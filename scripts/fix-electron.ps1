# ===========================================================================
# fix-electron.ps1
# Repara la instalación de Electron cuando OneDrive corta la extracción del
# binario (síntoma: "Electron failed to install correctly" y la carpeta
# node_modules\electron\dist queda casi vacía).
#
# Uso (desde la carpeta andyios):
#   powershell -ExecutionPolicy Bypass -File scripts\fix-electron.ps1
# ===========================================================================

$ErrorActionPreference = 'Stop'
$proyecto = Split-Path -Parent $PSScriptRoot   # carpeta andyios
$dist = Join-Path $proyecto 'node_modules\electron\dist'
$pathTxt = Join-Path $proyecto 'node_modules\electron\path.txt'

# 1) Buscar el zip de Electron ya descargado en la caché
$cache = Join-Path $env:LOCALAPPDATA 'electron\Cache'
$zip = Get-ChildItem -Recurse $cache -Filter *.zip -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $zip) {
  Write-Host "No encontré el zip de Electron en la caché." -ForegroundColor Yellow
  Write-Host "Ejecuta primero:  npm install" -ForegroundColor Yellow
  exit 1
}
Write-Host "Zip encontrado: $($zip.Name) ($([math]::Round($zip.Length/1MB)) MB)"

# 2) Extraer a una carpeta TEMP (fuera de OneDrive, donde la extracción sí funciona)
$tmp = Join-Path $env:TEMP "andy-electron-extract"
if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp }
New-Item -ItemType Directory -Force $tmp | Out-Null
Write-Host "Extrayendo en TEMP..."
Expand-Archive -Path $zip.FullName -DestinationPath $tmp -Force

# 3) Copiar el resultado a node_modules\electron\dist
if (Test-Path $dist) { Remove-Item -Recurse -Force $dist }
New-Item -ItemType Directory -Force $dist | Out-Null
Write-Host "Copiando a node_modules\electron\dist..."
Copy-Item -Path (Join-Path $tmp '*') -Destination $dist -Recurse -Force

# 4) Crear path.txt
Set-Content -Path $pathTxt -Value 'electron.exe' -NoNewline -Encoding ascii

# 5) Verificar
$ok = Test-Path (Join-Path $dist 'electron.exe')
if ($ok) {
  $n = (Get-ChildItem -Recurse $dist -File | Measure-Object).Count
  Write-Host "LISTO: electron.exe instalado ($n archivos)." -ForegroundColor Green
  Write-Host "Ahora puedes ejecutar:  npm run dev"
} else {
  Write-Host "ERROR: no se copió electron.exe." -ForegroundColor Red
  exit 1
}
