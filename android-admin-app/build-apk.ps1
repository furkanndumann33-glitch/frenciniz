param(
    [string]$SdkRoot = "D:\C_Users_Admin\.android-build-tools\sdk",
    [string]$JavaHome = "C:\Users\furka\AppData\Local\Programs\Microsoft\jdk-17.0.10.7-hotspot"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BuildTools = Join-Path $SdkRoot "build-tools\35.0.0"
$AndroidJar = Join-Path $SdkRoot "platforms\android-35\android.jar"
$Aapt2 = Join-Path $BuildTools "aapt2.exe"
$Aapt = Join-Path $BuildTools "aapt.exe"
$D8 = Join-Path $BuildTools "d8.bat"
$ZipAlign = Join-Path $BuildTools "zipalign.exe"
$ApkSigner = Join-Path $BuildTools "apksigner.bat"
$Javac = Join-Path $JavaHome "bin\javac.exe"
$Jar = Join-Path $JavaHome "bin\jar.exe"
$Keytool = Join-Path $JavaHome "bin\keytool.exe"

foreach ($required in @($AndroidJar, $Aapt2, $Aapt, $D8, $ZipAlign, $ApkSigner, $Javac, $Jar, $Keytool)) {
    if (-not (Test-Path -LiteralPath $required)) {
        throw "Gerekli derleme bileşeni bulunamadı: $required"
    }
}

$env:JAVA_HOME = $JavaHome
$BuildRoot = Join-Path $ProjectRoot ("build\manual-" + (Get-Date -Format "yyyyMMdd-HHmmss"))
$Generated = Join-Path $BuildRoot "generated"
$Classes = Join-Path $BuildRoot "classes"
$Dex = Join-Path $BuildRoot "dex"
$ClassesJar = Join-Path $BuildRoot "classes.jar"
$ResourcesZip = Join-Path $BuildRoot "resources.zip"
$UnsignedApk = Join-Path $BuildRoot "app-unsigned.apk"
$AlignedApk = Join-Path $BuildRoot "app-aligned.apk"
$FinalDir = Join-Path $ProjectRoot "output"
$FinalApk = Join-Path $FinalDir "Frenciniz-Admin-v1.1.0.apk"
$Keystore = Join-Path $ProjectRoot ".debug\frenciniz-admin-debug.keystore"

New-Item -ItemType Directory -Force -Path $BuildRoot, $Generated, $Classes, $Dex, $FinalDir, (Split-Path -Parent $Keystore) | Out-Null

& $Aapt2 compile --dir (Join-Path $ProjectRoot "app\src\main\res") -o $ResourcesZip
if ($LASTEXITCODE -ne 0) { throw "Kaynak derleme başarısız." }

& $Aapt2 link `
    -o $UnsignedApk `
    -I $AndroidJar `
    --manifest (Join-Path $ProjectRoot "app\src\main\AndroidManifest.xml") `
    --java $Generated `
    --min-sdk-version 24 `
    --target-sdk-version 35 `
    --version-code 2 `
    --version-name "1.1.0" `
    -R $ResourcesZip `
    --auto-add-overlay
if ($LASTEXITCODE -ne 0) { throw "APK kaynak bağlama başarısız." }

$JavaSources = @(
    (Join-Path $ProjectRoot "app\src\main\java\com\frenciniz\admin\MainActivity.java"),
    (Join-Path $ProjectRoot "app\src\main\java\com\frenciniz\admin\LiveAlertService.java"),
    (Join-Path $Generated "com\frenciniz\admin\R.java")
)
& $Javac -encoding UTF-8 -source 8 -target 8 -bootclasspath $AndroidJar -d $Classes $JavaSources
if ($LASTEXITCODE -ne 0) { throw "Java derleme başarısız." }

& $Jar --create --file $ClassesJar -C $Classes .
if ($LASTEXITCODE -ne 0) { throw "Java sınıfları paketlenemedi." }

& $D8 --lib $AndroidJar --min-api 24 --output $Dex $ClassesJar
if ($LASTEXITCODE -ne 0) { throw "DEX derleme başarısız." }

Push-Location $Dex
try {
    & $Aapt add $UnsignedApk "classes.dex"
    if ($LASTEXITCODE -ne 0) { throw "DEX APK içine eklenemedi." }
} finally {
    Pop-Location
}

& $ZipAlign -p -f 4 $UnsignedApk $AlignedApk
if ($LASTEXITCODE -ne 0) { throw "APK hizalama başarısız." }

if (-not (Test-Path -LiteralPath $Keystore)) {
    & $Keytool -genkeypair -v -keystore $Keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Frenciniz Admin,O=Dumanlar Ticaret,C=TR"
    if ($LASTEXITCODE -ne 0) { throw "APK imza anahtarı oluşturulamadı." }
}

& $ApkSigner sign --ks $Keystore --ks-pass pass:android --key-pass pass:android --ks-key-alias androiddebugkey --out $FinalApk $AlignedApk
if ($LASTEXITCODE -ne 0) { throw "APK imzalama başarısız." }

& $ApkSigner verify --verbose --print-certs $FinalApk
if ($LASTEXITCODE -ne 0) { throw "APK imza doğrulaması başarısız." }

$hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $FinalApk).Hash
$size = (Get-Item -LiteralPath $FinalApk).Length
Write-Output "APK=$FinalApk"
Write-Output "SIZE=$size"
Write-Output "SHA256=$hash"
