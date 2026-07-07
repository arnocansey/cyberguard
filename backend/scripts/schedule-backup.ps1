param(
  [string]$TaskName = "CyberGuardNightlyBackup",
  [string]$Time = "02:00",
  [string]$WorkDir = "$PSScriptRoot\.."
)

$work = Resolve-Path $WorkDir
$npmCmd = "cmd /c cd /d `"$work`" && npm run backup"

$existing = schtasks /Query /TN $TaskName 2>$null
if ($LASTEXITCODE -eq 0) {
  schtasks /Delete /TN $TaskName /F | Out-Null
}

schtasks /Create /SC DAILY /TN $TaskName /TR $npmCmd /ST $Time /F | Out-Null
Write-Host "Scheduled task '$TaskName' created for daily backups at $Time"
