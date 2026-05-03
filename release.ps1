#Requires -Version 5.1
<#
.SYNOPSIS
    Bouwt en publiceert een nieuwe release van Ritme Timer.
.PARAMETER Notes
    Release-omschrijving (wordt toegevoegd boven de changelog-notities).
.PARAMETER Version
    Versienummer (bijv. "1.0.1"). Standaard: patch-bump van huidige versie.
.EXAMPLE
    .\release.ps1 -Notes "Verbeterde notificaties"
    .\release.ps1 -Version "1.1.0" -Notes "Grote update"
#>
param(
    [Parameter(Mandatory)][string]$Notes,
    [string]$Version
)

$ErrorActionPreference = 'Stop'
$ProjectRoot  = $PSScriptRoot
$ReleasesRepo = 'rvdstarre/ritme-timer-releases'

# ── Hulpfuncties ──────────────────────────────────────────────────

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Ok($msg)   { Write-Host "    OK: $msg" -ForegroundColor Green }
function Fail($msg) { Write-Host "    FOUT: $msg" -ForegroundColor Red; exit 1 }

function Get-CurrentVersion {
    $pkg = Get-Content "$ProjectRoot\package.json" | ConvertFrom-Json
    return $pkg.version
}

function Bump-PatchVersion($v) {
    $parts = $v -split '\.'
    $parts[2] = [int]$parts[2] + 1
    return $parts -join '.'
}

function Update-PackageVersion($newVersion) {
    $path = "$ProjectRoot\package.json"
    $content = Get-Content $path -Raw
    $content = $content -replace '"version": "[^"]*"', "`"version`": `"$newVersion`""
    Set-Content $path $content -Encoding UTF8
}

function Update-Changelog($newVersion, $date) {
    $path = "$ProjectRoot\CHANGELOG.md"
    $content = Get-Content $path -Raw

    # Vervang [Unreleased] door de nieuwe versie
    $content = $content -replace '## \[Unreleased\]', "## [Unreleased]`n### Toegevoegd`n### Gewijzigd`n### Opgelost`n### Verwijderd`n`n---`n`n## [$newVersion] - $date"

    # Verwijder lege secties in [Unreleased] die we net opnieuw toevoegden
    $content = $content -replace '(### (Toegevoegd|Gewijzigd|Opgelost|Verwijderd)\n){1}(?=### |\n---)', ''

    Set-Content $path $content -Encoding UTF8
}

function Get-ChangelogNotes($version) {
    $content = Get-Content "$ProjectRoot\CHANGELOG.md" -Raw
    # Extract alles tussen ## [version] en de volgende ## [
    if ($content -match "(?s)## \[$([regex]::Escape($version))\][^\n]*\n(.*?)(?=\n## \[|\z)") {
        return $Matches[1].Trim()
    }
    return ""
}

function Get-AndroidApkPath($version) {
    $candidates = @(
        "$ProjectRoot\android\app\build\outputs\apk\release\app-release.apk",
        "$ProjectRoot\android\app\build\outputs\apk\release\app-release-unsigned.apk"
    )
    foreach ($p in $candidates) {
        if (Test-Path $p) { return $p }
    }
    return $null
}

# ── Stap 0: Versie bepalen ────────────────────────────────────────

Step "Versie bepalen"
$currentVersion = Get-CurrentVersion
if ($Version) {
    $newVersion = $Version
} else {
    $newVersion = Bump-PatchVersion $currentVersion
}
$releaseDate = Get-Date -Format 'yyyy-MM-dd'
Write-Host "    $currentVersion  -->  $newVersion  ($releaseDate)"

$confirm = Read-Host "    Doorgaan? (j/n)"
if ($confirm -ne 'j') { exit 0 }

# ── Stap 1: Versie bijwerken ──────────────────────────────────────

Step "package.json en CHANGELOG bijwerken"
Update-PackageVersion $newVersion
Update-Changelog $newVersion $releaseDate
Ok "Versie bijgewerkt naar $newVersion"

# ── Stap 2: Web build + Capacitor sync ───────────────────────────

Step "Web build voor Capacitor"
Set-Location $ProjectRoot
npm run build:web
if ($LASTEXITCODE -ne 0) { Fail "Web build mislukt" }
Ok "Web build klaar"

Step "Capacitor sync Android"
npx cap sync android
if ($LASTEXITCODE -ne 0) { Fail "Capacitor sync mislukt" }
Ok "Capacitor sync klaar"

# ── Stap 3: Android APK bouwen ────────────────────────────────────

Step "Android APK bouwen"
$androidSdk  = if ($env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT } else { "D:\AndroidSDK" }
$javaHome    = if ($env:JAVA_HOME) { $env:JAVA_HOME } else { "C:\Program Files\Android\Android Studio\jbr" }
$gradleCmd   = "$ProjectRoot\android\gradlew.bat"

$env:ANDROID_SDK_ROOT = $androidSdk
$env:JAVA_HOME        = $javaHome

if (-not (Test-Path $gradleCmd)) { Fail "gradlew.bat niet gevonden in android/" }
if (-not (Test-Path $androidSdk)) { Fail "Android SDK niet gevonden op $androidSdk — stel ANDROID_SDK_ROOT in" }

Push-Location "$ProjectRoot\android"
& $gradleCmd assembleRelease
if ($LASTEXITCODE -ne 0) { Fail "Android build mislukt" }
Pop-Location

$apkSrc = Get-AndroidApkPath $newVersion
if (-not $apkSrc) { Fail "APK niet gevonden na build" }

$apkDst = "$ProjectRoot\..\ritme-timer-$newVersion.apk"
Copy-Item $apkSrc $apkDst -Force
Ok "APK: $apkDst"

# ── Stap 4: Windows installer bouwen ─────────────────────────────

Step "Windows installer bouwen (electron-builder)"
Set-Location $ProjectRoot
npx electron-vite build
if ($LASTEXITCODE -ne 0) { Fail "Electron build mislukt" }

npx electron-builder --win --publish never
if ($LASTEXITCODE -ne 0) { Fail "electron-builder mislukt" }

$exeFiles = Get-ChildItem "$ProjectRoot\dist\*.exe" -ErrorAction SilentlyContinue
if (-not $exeFiles) { Fail "Geen .exe gevonden in dist/" }
$exePath = $exeFiles[0].FullName
Ok "Installer: $exePath"

# ── Stap 5: latest.yml aanpassen (GitHub converteert spaties naar punten) ──

$latestYml = "$ProjectRoot\dist\latest.yml"
if (Test-Path $latestYml) {
    $yml = Get-Content $latestYml -Raw
    # GitHub converteert spaties in bestandsnamen naar punten — corrigeer dit
    $yml = $yml -replace 'Ritme Timer Setup', 'Ritme.Timer.Setup'
    Set-Content $latestYml $yml -Encoding UTF8
    Ok "latest.yml gecorrigeerd"
}

# ── Stap 6: Git commit + tag + push ──────────────────────────────

Step "Git commit, tag en push"
Set-Location $ProjectRoot
git add package.json CHANGELOG.md
git commit -m "Release v$newVersion"
git tag "v$newVersion"
git push origin master
git push origin "v$newVersion"
Ok "Gepusht — GitHub Actions bouwt Linux/macOS/iOS"

# ── Stap 7: GitHub release aanmaken ──────────────────────────────

Step "GitHub release aanmaken op $ReleasesRepo"

$changelogNotes = Get-ChangelogNotes $newVersion
$releaseBody    = if ($Notes) { "$Notes`n`n---`n`n$changelogNotes" } else { $changelogNotes }

# Wacht tot de releases-repo de tag heeft (Actions pusht straks)
# We maken de release alvast aan — Actions voegt Linux/macOS/iOS toe
gh release create "v$newVersion" `
    --repo $ReleasesRepo `
    --title "Ritme Timer v$newVersion" `
    --notes $releaseBody `
    $exePath `
    $apkDst

if ($LASTEXITCODE -ne 0) { Fail "GitHub release aanmaken mislukt" }
Ok "Release aangemaakt: https://github.com/$ReleasesRepo/releases/tag/v$newVersion"

# ── Klaar ─────────────────────────────────────────────────────────

Write-Host "`n Ritme Timer v$newVersion gepubliceerd!" -ForegroundColor Green
Write-Host "    Windows + Android: https://github.com/$ReleasesRepo/releases/tag/v$newVersion"
Write-Host "    Linux/macOS/iOS:   volgt via GitHub Actions (ritme-timer repo)"
