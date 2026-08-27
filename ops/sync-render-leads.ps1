[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateNotNullOrEmpty()]
  [string]$ExportUrl,

  [string]$TokenPath = (Join-Path $PSScriptRoot "runtime\render-export-token.txt"),

  [string]$DestinationPath = (Join-Path $PSScriptRoot "..\..\outputs\01a03663-35f2-70e2-848d-af024af190de\Leads-Brena.xlsx")
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$uri = [Uri]$ExportUrl
$loopbackHosts = @("127.0.0.1", "localhost", "::1")
if ($uri.Scheme -ne "https" -and $loopbackHosts -notcontains $uri.Host) {
  throw "La descarga de leads debe usar HTTPS."
}
if (-not (Test-Path -LiteralPath $TokenPath -PathType Leaf)) {
  throw "No existe el archivo local con la credencial de descarga."
}

$token = (Get-Content -LiteralPath $TokenPath -Raw).Trim()
if ($token.Length -lt 32) {
  throw "La credencial de descarga no es válida."
}

$destinationDirectory = Split-Path -Parent $DestinationPath
New-Item -ItemType Directory -Force -Path $destinationDirectory | Out-Null
$temporaryPath = "$DestinationPath.tmp"

try {
  $headers = @{ Authorization = "Bearer $token" }
  Invoke-WebRequest -UseBasicParsing -Uri $uri.AbsoluteUri -Headers $headers `
    -OutFile $temporaryPath -TimeoutSec 60 | Out-Null

  $stream = [IO.File]::OpenRead($temporaryPath)
  try {
    $first = $stream.ReadByte()
    $second = $stream.ReadByte()
    if ($stream.Length -lt 4 -or $first -ne 0x50 -or $second -ne 0x4B) {
      throw "Render no devolvió un archivo Excel válido."
    }
  } finally {
    $stream.Dispose()
  }

  Move-Item -LiteralPath $temporaryPath -Destination $DestinationPath -Force
  Write-Output ([IO.Path]::GetFullPath($DestinationPath))
} finally {
  if (Test-Path -LiteralPath $temporaryPath) {
    Remove-Item -LiteralPath $temporaryPath -Force
  }
}
