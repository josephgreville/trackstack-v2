# Installs the Android SDK pieces needed to build the TrackStack APK.
# Run once on a fresh machine, then use `npm run android:apk`.

$ErrorActionPreference = 'Stop'

$SdkRoot = "$env:LOCALAPPDATA\Android\Sdk"
$Zip = "$env:LOCALAPPDATA\Temp\opencode\cmdline-tools.zip"
$Url = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"

Write-Host "== Android SDK setup ==" -ForegroundColor Cyan

# --- JDK -----------------------------------------------------------------
$java = Get-ChildItem -Path "C:\Program Files\Amazon Corretto" -Recurse -Filter "java.exe" -ErrorAction SilentlyContinue |
  Select-Object -First 1 -ExpandProperty FullName
if (-not $java) {
  Write-Host "Installing Temurin/Amazon JDK 21..." -ForegroundColor Yellow
  winget install --id Amazon.Corretto.21.JDK --accept-source-agreements --accept-package-agreements --silent
  $java = Get-ChildItem -Path "C:\Program Files\Amazon Corretto" -Recurse -Filter "java.exe" | Select-Object -First 1 -ExpandProperty FullName
}
$env:JAVA_HOME = Split-Path (Split-Path $java -Parent) -Parent
Write-Host "JAVA_HOME = $env:JAVA_HOME"

# --- Command line tools --------------------------------------------------
if (-not (Test-Path "$SdkRoot\cmdline-tools\latest\bin\sdkmanager.bat")) {
  if (-not (Test-Path $Zip)) {
    Write-Host "Downloading command line tools..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $Url -OutFile $Zip -UseBasicParsing
  }
  Write-Host "Extracting..." -ForegroundColor Yellow
  New-Item -ItemType Directory -Force -Path "$SdkRoot\cmdline-tools" | Out-Null
  $tmp = "$env:TEMP\cmdline-extract"
  Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
  Expand-Archive -Path $Zip -DestinationPath $tmp -Force
  Move-Item "$tmp\cmdline-tools" "$SdkRoot\cmdline-tools\latest" -Force
  Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
}

$sdkmanager = "$SdkRoot\cmdline-tools\latest\bin\sdkmanager.bat"

# --- Packages ------------------------------------------------------------
Write-Host "Accepting licences..." -ForegroundColor Yellow
1..20 | ForEach-Object { "y" } | & $sdkmanager --licenses 2>&1 | Out-Null

Write-Host "Installing platform-tools, platform 36 and build-tools..." -ForegroundColor Yellow
& $sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0" 2>&1 | Select-Object -Last 5

# --- local.properties ----------------------------------------------------
$props = "$SdkRoot\..\..\..\OneDrive\Documents\GitHub\trackstack-v2\android\local.properties"
$projectDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$escaped = $SdkRoot -replace '\\', '\\'
Set-Content -Path (Join-Path $projectDir "android\local.properties") -Value "sdk.dir=$escaped"

Write-Host ""
Write-Host "SDK ready at $SdkRoot" -ForegroundColor Green
Write-Host "Next: npm run android:apk" -ForegroundColor Green
