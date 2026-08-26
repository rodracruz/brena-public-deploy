[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$runtimeDir = Join-Path $PSScriptRoot "runtime"
$supervisorScript = Join-Path $PSScriptRoot "run-brena-server.ps1"
$supervisorPidPath = Join-Path $runtimeDir "supervisor.pid"
$publicLinkPath = Join-Path $runtimeDir "PUBLIC-LINK.txt"
New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null

$running = $false
if (Test-Path -LiteralPath $supervisorPidPath) {
  $recordedPid = [int](Get-Content -LiteralPath $supervisorPidPath -Raw)
  $process = Get-CimInstance Win32_Process -Filter "ProcessId = $recordedPid" -ErrorAction SilentlyContinue
  $running = $null -ne $process -and $process.CommandLine -like "*run-brena-server.ps1*"
}

if (-not $running) {
  if (Test-Path -LiteralPath $publicLinkPath) { Remove-Item -LiteralPath $publicLinkPath -Force }
  $stdout = Join-Path $runtimeDir "supervisor.out.log"
  $stderr = Join-Path $runtimeDir "supervisor.err.log"
  $arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$supervisorScript`""
  Start-Process -FilePath "powershell.exe" `
    -ArgumentList $arguments `
    -WorkingDirectory $PSScriptRoot -WindowStyle Hidden `
    -RedirectStandardOutput $stdout -RedirectStandardError $stderr | Out-Null
}

$deadline = (Get-Date).AddSeconds(90)
while ((Get-Date) -lt $deadline) {
  if (Test-Path -LiteralPath $publicLinkPath) {
    $publicUrl = (Get-Content -LiteralPath $publicLinkPath -Raw).Trim()
    try {
      $health = Invoke-RestMethod -Uri "$publicUrl/healthcheck" -TimeoutSec 10
      if ($health.status -eq "ok") {
        Write-Output $publicUrl
        exit 0
      }
    } catch {
      # Keep waiting while Cloudflare finishes warming up.
    }
  }
  Start-Sleep -Seconds 1
}

throw "Brena no quedó disponible públicamente en 90 segundos. Revisa ops\runtime\supervisor.err.log."
