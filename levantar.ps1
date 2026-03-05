# Levantar la web 20022chain (puerto 3005)
# Ejecutar desde esta carpeta: .\levantar.ps1

$port = 3005
$proc = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
if ($proc) {
  Write-Host "Cerrando proceso que usa el puerto $port (PID $proc)..."
  Stop-Process -Id $proc -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 2
}
Write-Host "Iniciando 20022chain en http://localhost:$port"
npm run dev
