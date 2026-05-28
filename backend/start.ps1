# Script de demarrage KmerFret Backend
Set-Location $PSScriptRoot

Write-Host "=== KmerFret Backend ===" -ForegroundColor Green

# Liberer le port 8080 si occupe
$occupied = netstat -ano | Select-String "0.0.0.0:8080"
if ($occupied) {
    $pidStr = ($occupied -split '\s+')[-1]
    Write-Host "Port 8080 occupe (PID $pidStr) - liberation..." -ForegroundColor Yellow
    Stop-Process -Id ([int]$pidStr) -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# Compiler
Write-Host "Compilation..." -ForegroundColor Cyan
.\mvnw compile -q
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur de compilation." -ForegroundColor Red
    exit 1
}

# Copier les dependances si absent
$libsPath = Join-Path $PSScriptRoot "target\libs"
if (-not (Test-Path $libsPath) -or (Get-ChildItem $libsPath -Filter "*.jar").Count -eq 0) {
    Write-Host "Copie des dependances..." -ForegroundColor Cyan
    .\mvnw dependency:copy-dependencies -DoutputDirectory=target\libs -Dmdep.useRepositoryLayout=false -DincludeScope=runtime -q
}

# Construire le classpath sans guillemets problematiques
$cp = "target\classes" + [System.IO.Path]::PathSeparator + "target\libs\*"
$mainClass = "cm.kmerfret.backend.KmerFretBackendApplication"

Write-Host "Demarrage sur http://localhost:8080 ..." -ForegroundColor Green
& java -cp $cp $mainClass
