[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateNotNullOrEmpty()]
  [string]$ExportUrl,

  [ValidateRange(5, 1440)]
  [int]$IntervalMinutes = 15,

  [string]$TaskName = "Brena - Sincronizar leads"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$syncScript = Join-Path $PSScriptRoot "sync-render-leads.ps1"
$tokenPath = Join-Path $PSScriptRoot "runtime\render-export-token.txt"
if (-not (Test-Path -LiteralPath $syncScript -PathType Leaf)) {
  throw "No se encontró sync-render-leads.ps1."
}
if (-not (Test-Path -LiteralPath $tokenPath -PathType Leaf)) {
  throw "Primero debe guardarse la credencial en ops\runtime\render-export-token.txt."
}

$arguments = '-NoProfile -ExecutionPolicy Bypass -File "{0}" -ExportUrl "{1}"' -f `
  $syncScript, $ExportUrl
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $arguments
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) `
  -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes)
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" `
  -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger `
  -Settings $settings -Principal $principal -Force | Out-Null

Write-Output "Tarea '$TaskName' instalada cada $IntervalMinutes minutos."
