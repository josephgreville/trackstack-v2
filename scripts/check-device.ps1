# Checks whether the phone is visible over USB and ready for an install.
# Run this after changing the cable, port or the phone's USB mode.

$ErrorActionPreference = 'Continue'

$adb = Get-ChildItem -Path "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Recurse -Filter "adb.exe" -ErrorAction SilentlyContinue |
  Select-Object -First 1 -ExpandProperty FullName

if (-not $adb) {
  Write-Host "adb not found. Install it with: winget install Google.PlatformTools" -ForegroundColor Red
  exit 1
}

& $adb start-server 2>&1 | Out-Null
Start-Sleep -Seconds 2

$devices = & $adb devices -l
Write-Host $devices

$phone = $devices | Select-String -Pattern "^(\S+)\s+device\s" | Select-Object -First 1

if (-not $phone) {
  Write-Host ""
  Write-Host "No phone detected." -ForegroundColor Yellow
  Write-Host ""
  Write-Host "What Windows can currently see:" -ForegroundColor Cyan
  Get-PnpDevice -ErrorAction SilentlyContinue |
    Where-Object { $_.Class -in @('USB', 'WPD', 'AndroidUsbDeviceClass') -and $_.FriendlyName -match 'Android|ADB|MTP|Mass Storage' } |
    Select-Object Status, Class, FriendlyName | Format-Table -AutoSize | Out-String -Width 160 | Write-Host
  Write-Host "If you only see 'USB Mass Storage Device' with VID_ABCD&PID_1234," -ForegroundColor Yellow
  Write-Host "the cable is carrying power but not data. Swap the cable or the port." -ForegroundColor Yellow
  exit 1
}

if ($devices -match "unauthorized") {
  Write-Host "Phone found but not authorised. Unlock it and accept the 'Allow USB debugging' prompt." -ForegroundColor Yellow
  exit 1
}

Write-Host ""
Write-Host "Phone detected and ready:" -ForegroundColor Green
& $adb shell getprop ro.product.model
& $adb shell getprop ro.build.version.release
