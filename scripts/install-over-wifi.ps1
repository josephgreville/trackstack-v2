# Builds the TrackStack APK and serves it over Wi-Fi so it can be installed
# straight from the phone's browser. Useful when USB is not carrying data.
#
#   .\scripts\install-over-wifi.ps1
#
# The phone then opens http://<your-lan-ip>:5173/trackstack.apk

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot

$lanIp = (Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -notlike '127.*' -and $_.InterfaceAlias -eq 'WiFi' } |
  Select-Object -First 1 -ExpandProperty IPAddress)

if (-not $lanIp) {
  $lanIp = (Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown' -and $_.InterfaceAlias -notlike 'vEthernet*' } |
    Select-Object -First 1 -ExpandProperty IPAddress)
}

Write-Host "LAN address: $lanIp" -ForegroundColor Cyan

# Point the native app at this machine so it has a working, same-origin API.
$configPath = Join-Path $root "capacitor.config.json"
$config = Get-Content $configPath -Raw | ConvertFrom-Json
$config.server.url = "http://${lanIp}:5173"
$config.server.cleartext = $true
$config | ConvertTo-Json -Depth 10 | Set-Content $configPath

Write-Host "Building the web client and the APK..." -ForegroundColor Cyan
Push-Location $root
try {
  npm run android:build
} finally {
  Pop-Location
}

$apk = Join-Path $root "android\app\build\outputs\apk\debug\app-debug.apk"
if (-not (Test-Path $apk)) {
  Write-Host "APK was not produced." -ForegroundColor Red
  exit 1
}

# Publish it through the dev server so the phone can download it.
$public = Join-Path $root "client\public"
Copy-Item $apk (Join-Path $public "trackstack.apk") -Force
Write-Host "APK copied to client\public\trackstack.apk" -ForegroundColor Green

Write-Host ""
Write-Host "Install it on the phone:" -ForegroundColor Green
Write-Host "  1. Make sure the phone is on the same Wi-Fi" -ForegroundColor White
Write-Host "  2. Open this URL in the phone's browser:" -ForegroundColor White
Write-Host "     http://${lanIp}:5173/trackstack.apk" -ForegroundColor Yellow
Write-Host "  3. Allow your browser to 'Install unknown apps' and install TrackStack" -ForegroundColor White
