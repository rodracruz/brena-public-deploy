[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$runtimeDir = Join-Path $PSScriptRoot "runtime"
$workspaceRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$dataDir = Join-Path $workspaceRoot "outputs\01a03663-35f2-70e2-848d-af024af190de"
$publicLinkPath = Join-Path $runtimeDir "PUBLIC-LINK.txt"

$localHealth = Invoke-RestMethod -Uri "http://127.0.0.1:3011/healthcheck" -TimeoutSec 5
if ($localHealth.status -ne "ok") { throw "El origen local no está saludable." }
if (-not (Test-Path -LiteralPath $publicLinkPath)) { throw "Falta PUBLIC-LINK.txt." }
$publicUrl = (Get-Content -LiteralPath $publicLinkPath -Raw).Trim()
$publicHealth = Invoke-RestMethod -Uri "$publicUrl/healthcheck" -TimeoutSec 10
if ($publicHealth.status -ne "ok") { throw "El enlace público no está saludable." }

$journalPath = Join-Path $dataDir "Leads-Brena.jsonl"
$workbookPath = Join-Path $dataDir "Leads-Brena.xlsx"
$leadCount = if (Test-Path -LiteralPath $journalPath) {
  @(Get-Content -LiteralPath $journalPath | Where-Object { $_.Trim() }).Count
} else { 0 }

[pscustomobject]@{
  PublicUrl = $publicUrl
  LocalHealth = $localHealth.status
  PublicHealth = $publicHealth.status
  Leads = $leadCount
  Workbook = $workbookPath
  WorkbookExists = Test-Path -LiteralPath $workbookPath
}
