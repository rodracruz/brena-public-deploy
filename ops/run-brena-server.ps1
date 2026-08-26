[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$workspaceRoot = Split-Path -Parent $projectRoot
$runtimeDir = Join-Path $PSScriptRoot "runtime"
$dataDir = Join-Path $workspaceRoot "outputs\01a03663-35f2-70e2-848d-af024af190de"
$spreadsheetRoot = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node"
$spreadsheetNode = Join-Path $spreadsheetRoot "bin\node.exe"
$spreadsheetModules = Join-Path $spreadsheetRoot "node_modules"
$spreadsheetLink = Join-Path $projectRoot "scripts\node_modules"
$cloudflaredRoot = Join-Path $env:APPDATA "xdg.config\.wrangler\cloudflared"

New-Item -ItemType Directory -Force -Path $runtimeDir, $dataDir | Out-Null
Set-Content -LiteralPath (Join-Path $runtimeDir "supervisor.pid") -Value $PID -Encoding ascii

$appNode = (Get-Command node.exe -ErrorAction Stop).Source
if (-not (Test-Path -LiteralPath $spreadsheetNode -PathType Leaf)) {
  throw "No se encontró el runtime de hojas de cálculo: $spreadsheetNode"
}
if (-not (Test-Path -LiteralPath (Join-Path $spreadsheetModules "@oai\artifact-tool\package.json") -PathType Leaf)) {
  throw "No se encontró @oai/artifact-tool en el runtime de hojas de cálculo."
}

if (Test-Path -LiteralPath $spreadsheetLink) {
  $linkItem = Get-Item -LiteralPath $spreadsheetLink -Force
  $expectedTarget = [System.IO.Path]::GetFullPath($spreadsheetModules)
  $actualTargets = @($linkItem.Target | ForEach-Object { [System.IO.Path]::GetFullPath($_) })
  if ($linkItem.LinkType -ne "Junction" -or $actualTargets -notcontains $expectedTarget) {
    throw "La ruta scripts\node_modules existe pero no apunta al runtime aprobado."
  }
} else {
  New-Item -ItemType Junction -Path $spreadsheetLink -Target $spreadsheetModules | Out-Null
}

$cloudflared = Get-ChildItem -LiteralPath $cloudflaredRoot -Filter "cloudflared.exe" -Recurse -File -ErrorAction Stop |
  Sort-Object FullName -Descending |
  Select-Object -First 1 -ExpandProperty FullName
if (-not $cloudflared) {
  throw "No se encontró cloudflared en $cloudflaredRoot"
}

$env:NODE_ENV = "production"
$env:HOST = "127.0.0.1"
$env:PORT = "3011"
$env:BRENA_LEAD_MODE = "local"
$env:BRENA_LOCAL_EXCEL_ENABLED = "1"
$env:BRENA_LOCAL_LEADS_DIR = $dataDir
$env:BRENA_SPREADSHEET_NODE = $spreadsheetNode
$env:BRENA_V2_LEADS_URL = ""
$env:BRENA_V2_API_TOKEN = ""
$env:BRENA_V2_TIMEOUT_MS = "5000"
$env:TRUST_PROXY = "1"

$origin = $null
$tunnel = $null

function Test-Origin {
  try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:3011/healthcheck" -TimeoutSec 3
    return $response.status -eq "ok"
  } catch {
    return $false
  }
}

function Start-Origin {
  $stdout = Join-Path $runtimeDir "origin.out.log"
  $stderr = Join-Path $runtimeDir "origin.err.log"
  $scriptPath = Join-Path $projectRoot "src\app.js"
  $arguments = "`"$scriptPath`""
  $script:origin = Start-Process -FilePath $appNode -ArgumentList $arguments `
    -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru `
    -RedirectStandardOutput $stdout -RedirectStandardError $stderr
  Set-Content -LiteralPath (Join-Path $runtimeDir "origin.pid") -Value $origin.Id -Encoding ascii

  $deadline = (Get-Date).AddSeconds(45)
  while ((Get-Date) -lt $deadline) {
    if ($origin.HasExited) {
      throw "El servidor Brena terminó durante el inicio. Revisa $stderr"
    }
    if (Test-Origin) { return }
    Start-Sleep -Milliseconds 500
  }
  throw "El servidor Brena no respondió en 45 segundos."
}

function Start-Tunnel {
  $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
  $log = Join-Path $runtimeDir "cloudflared-$stamp.log"
  $stdout = Join-Path $runtimeDir "cloudflared-$stamp.out.log"
  $stderr = Join-Path $runtimeDir "cloudflared-$stamp.err.log"
  $arguments = "tunnel --url http://127.0.0.1:3011 --no-autoupdate --logfile `"$log`" --loglevel info"
  $script:tunnel = Start-Process -FilePath $cloudflared -ArgumentList $arguments `
    -WorkingDirectory $projectRoot -WindowStyle Hidden -PassThru `
    -RedirectStandardOutput $stdout -RedirectStandardError $stderr
  Set-Content -LiteralPath (Join-Path $runtimeDir "cloudflared.pid") -Value $tunnel.Id -Encoding ascii

  $deadline = (Get-Date).AddSeconds(60)
  while ((Get-Date) -lt $deadline) {
    if ($tunnel.HasExited) {
      throw "Cloudflare Tunnel terminó durante el inicio. Revisa $stderr"
    }
    $combined = @($log, $stdout, $stderr) |
      Where-Object { Test-Path -LiteralPath $_ } |
      ForEach-Object { Get-Content -LiteralPath $_ -Raw -ErrorAction SilentlyContinue }
    $match = [regex]::Match(($combined -join "`n"), "https://[a-z0-9-]+\.trycloudflare\.com")
    if ($match.Success) {
      $publicUrl = $match.Value
      try {
        $health = Invoke-RestMethod -Uri "$publicUrl/healthcheck" -TimeoutSec 10
        if ($health.status -eq "ok") {
          Set-Content -LiteralPath (Join-Path $runtimeDir "PUBLIC-LINK.txt") -Value $publicUrl -Encoding ascii
          return
        }
      } catch {
        # DNS and the Cloudflare edge can need a few seconds to warm up.
      }
    }
    Start-Sleep -Seconds 1
  }
  throw "Cloudflare no entregó un enlace público saludable en 60 segundos."
}

try {
  while ($true) {
    if ($null -eq $origin -or $origin.HasExited -or -not (Test-Origin)) {
      if ($null -ne $origin -and -not $origin.HasExited) { Stop-Process -Id $origin.Id -Force }
      Start-Origin
    }
    if ($null -eq $tunnel -or $tunnel.HasExited) {
      Start-Tunnel
    }
    Start-Sleep -Seconds 10
  }
} finally {
  if ($null -ne $tunnel -and -not $tunnel.HasExited) { Stop-Process -Id $tunnel.Id -Force }
  if ($null -ne $origin -and -not $origin.HasExited) { Stop-Process -Id $origin.Id -Force }
}
