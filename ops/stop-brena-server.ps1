[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$runtimeDir = Join-Path $PSScriptRoot "runtime"

foreach ($name in @("supervisor", "cloudflared", "origin")) {
  $pidPath = Join-Path $runtimeDir "$name.pid"
  if (-not (Test-Path -LiteralPath $pidPath)) { continue }
  $recordedPid = [int](Get-Content -LiteralPath $pidPath -Raw)
  $process = Get-CimInstance Win32_Process -Filter "ProcessId = $recordedPid" -ErrorAction SilentlyContinue
  if ($null -eq $process) { continue }
  $expected = switch ($name) {
    "supervisor" { "*run-brena-server.ps1*" }
    "cloudflared" { "*cloudflared.exe*tunnel*127.0.0.1:3011*" }
    "origin" { "*node.exe*src*app.js*" }
  }
  if ($process.CommandLine -notlike $expected) {
    throw "El PID $recordedPid de $name pertenece a otro proceso; no se detuvo."
  }
  Stop-Process -Id $recordedPid -Force
}

Write-Output "Servidor Brena detenido."
