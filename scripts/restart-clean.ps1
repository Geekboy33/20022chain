$ErrorActionPreference = "Stop"

Write-Host "=== 20022Chain clean restart ===" -ForegroundColor Cyan

# 1) Kill any process listening on 3005
try {
  $listeners = Get-NetTCPConnection -LocalPort 3005 -State Listen -ErrorAction SilentlyContinue
  if ($listeners) {
    $pids = $listeners | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pidToKill in $pids) {
      Write-Host "Killing PID $pidToKill on port 3005..." -ForegroundColor Yellow
      taskkill /PID $pidToKill /F | Out-Null
    }
  } else {
    Write-Host "No process listening on 3005." -ForegroundColor DarkGray
  }
} catch {
  Write-Host "Could not inspect/kill listeners on 3005: $($_.Exception.Message)" -ForegroundColor Red
}

# 2) Clean .next cache
if (Test-Path ".next") {
  Write-Host "Removing .next cache..." -ForegroundColor Yellow
  Remove-Item -Recurse -Force ".next"
} else {
  Write-Host ".next cache not found." -ForegroundColor DarkGray
}

# 3) Start dev server
Write-Host "Starting dev server on :3005..." -ForegroundColor Green
npm run dev
