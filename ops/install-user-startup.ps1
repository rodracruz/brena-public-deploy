[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$startupDir = [Environment]::GetFolderPath("Startup")
$launcherPath = Join-Path $startupDir "Brena-Servidor.cmd"
$startScript = Join-Path $PSScriptRoot "start-brena-server.ps1"
$contents = "@echo off`r`nstart `"`" /min powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$startScript`"`r`n"
Set-Content -LiteralPath $launcherPath -Value $contents -Encoding ascii
Write-Output $launcherPath
