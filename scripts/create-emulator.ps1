# Creates the TrackStack AVD and boots it with hardware acceleration.
param(
  [string]$AvdName = 'TrackStack',
  [string]$ApiLevel = '36',
  [string]$Device = 'pixel_6'
)

$ErrorActionPreference = 'Stop'

$SdkRoot = "$env:LOCALAPPDATA\Android\Sdk"
$env:JAVA_HOME = "C:\Program Files\Amazon Corretto\jdk21.0.13_0"
$env:ANDROID_HOME = $SdkRoot
$env:ANDROID_SDK_ROOT = $SdkRoot
$env:PATH = "$env:JAVA_HOME\bin;$SdkRoot\platform-tools;$SdkRoot\emulator;$env:PATH"

$avdmanager = "$SdkRoot\cmdline-tools\latest\bin\avdmanager.bat"
$emulator = "$SdkRoot\emulator\emulator.exe"
$image = "system-images;android-$ApiLevel;google_apis;x86_64"

Write-Host "== Creating the AVD ==" -ForegroundColor Cyan
$existing = & $avdmanager list avd 2>&1 | Out-String
if ($existing -match "Name:\s*$AvdName") {
  Write-Host "AVD '$AvdName' already exists." -ForegroundColor Yellow
} else {
  "no" | & $avdmanager create avd --force --name $AvdName --package "$image" --device "$Device" 2>&1 | Select-Object -Last 3
}

# A leaner profile: the app does not need a large device.
$config = "$env:USERPROFILE\.android\avd\$AvdName.avd\config.ini"
if (Test-Path $config) {
  $lines = Get-Content $config
  $lines = $lines -replace '^hw\.ramSize=.*$', 'hw.ramSize=3072'
  $lines = $lines -replace '^hw\.gpu\.mode=.*$', 'hw.gpu.mode=host'
  $lines = $lines -replace '^hw\.keyboard=.*$', 'hw.keyboard=yes'
  $lines = $lines -replace '^disk\.dataPartition\.size=.*$', 'disk.dataPartition.size=6G'
  $lines | Set-Content $config
  Write-Host "AVD tuned: 3GB RAM, host GPU." -ForegroundColor Green
}

Write-Host ""
Write-Host "== Hardware acceleration ==" -ForegroundColor Cyan
& $emulator -accel-check 2>&1 | Select-Object -Last 4

Write-Host ""
Write-Host "== Booting $AvdName ==" -ForegroundColor Cyan
$avdPath = "$env:USERPROFILE\.android\avd\$AvdName.avd"
Start-Process $emulator -ArgumentList @(
  '-avd', $AvdName,
  '-gpu', 'host',
  '-no-snapshot-save',
  '-no-boot-anim'
) -WindowStyle Normal

Write-Host "Waiting for the device to finish booting..."
$adb = "$SdkRoot\platform-tools\adb.exe"
& $adb wait-for-device
$booted = $false
for ($i = 0; $i -lt 120; $i++) {
  Start-Sleep -Seconds 5
  $boot = (& $adb shell getprop sys.boot_completed 2>&1 | Out-String).Trim()
  if ($boot -eq '1') { $booted = $true; break }
  Write-Host "  still booting ($($i * 5)s)"
}
if ($booted) {
  Write-Host "Emulator is up." -ForegroundColor Green
  & $adb devices -l
} else {
  Write-Host "The emulator did not report a completed boot in time." -ForegroundColor Red
  exit 1
}
