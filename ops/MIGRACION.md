# Migración del servidor Brena

## Contenido que se debe copiar

Copiar completa la carpeta `Brena public Web`. Los datos definitivos están en:

- `outputs/01a03663-35f2-70e2-848d-af024af190de/Leads-Brena.jsonl` (fuente de verdad acumulativa).
- `outputs/01a03663-35f2-70e2-848d-af024af190de/Leads-Brena.xlsx` (vista para Excel).
- `brena-main/` (aplicación, pruebas y operación).

No basta copiar únicamente el `.xlsx`: el `.jsonl` permite reconstruir el libro completo si quedó abierto o bloqueado durante el último envío.

No copiar ninguna carpeta llamada `node_modules`; el runtime de hojas de cálculo y sus enlaces se recrean en el PC de destino.

## Preparación del PC reemplazante

1. Instalar Node.js 20.18 o superior y Cloudflare Tunnel.
2. Instalar Codex Desktop para disponer del runtime de hojas de cálculo en `%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node`.
3. Abrir PowerShell dentro de `brena-main` y ejecutar `npm test`.
4. Ejecutar `powershell -ExecutionPolicy Bypass -File .\ops\start-brena-server.ps1`.
5. Ejecutar `powershell -ExecutionPolicy Bypass -File .\ops\install-user-startup.ps1`.
6. Ejecutar `powershell -ExecutionPolicy Bypass -File .\ops\check-brena-server.ps1` y conservar el nuevo enlace indicado.

El enlace Quick Tunnel cambia cuando se crea un proceso nuevo. Cuando exista acceso a la zona DNS de `brena.cl`, reemplazarlo por un túnel nombrado para conservar una URL estable durante reinicios y migraciones.
