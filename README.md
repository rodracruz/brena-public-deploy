# Brena Public Web 2.0

Sitio público de Brena para explicar el servicio y recibir solicitudes de propietarios. Puede guardar los contactos localmente en Excel o entregarlos a BrenaV2.

## Requisitos

- Node.js 20.18 o superior.
- Cloudflare Tunnel para publicar desde un PC local.
- El runtime de hojas de cálculo de Codex Desktop para mantener `Leads-Brena.xlsx`.

El servidor no tiene dependencias npm de runtime.

## Ejecutar localmente

```powershell
npm start
```

Abre `http://127.0.0.1:3011/`. En desarrollo el formulario funciona en modo `preview`: no transmite datos fuera del equipo y agrega cada envío válido al Excel local `outputs/01a03663-35f2-70e2-848d-af024af190de/Leads-Brena.xlsx`.

El libro se reconstruye desde un registro local acumulativo, por lo que los envíos nuevos no sobrescriben los anteriores. La ubicación puede cambiarse con `BRENA_LOCAL_LEADS_DIR`.

## Pruebas

```powershell
npm test
npm audit --audit-level=low
```

## Servidor público temporal en este PC

```powershell
powershell -ExecutionPolicy Bypass -File .\ops\start-brena-server.ps1
powershell -ExecutionPolicy Bypass -File .\ops\install-user-startup.ps1
powershell -ExecutionPolicy Bypass -File .\ops\check-brena-server.ps1
```

El origen queda enlazado solamente a `127.0.0.1:3011`; Cloudflare entrega HTTPS sin abrir puertos del router. El enlace activo queda en `ops/runtime/PUBLIC-LINK.txt`. La carpeta `ops/runtime` también contiene logs y PIDs.

El modo `local` trata cada formulario como un contacto real, lo agrega al registro acumulativo y actualiza el Excel. El libro nunca se publica por HTTP porque contiene datos personales.

## Configuración con BrenaV2

Variables obligatorias:

```dotenv
NODE_ENV=production
HOST=0.0.0.0
PORT=3011
BRENA_LEAD_MODE=live
BRENA_V2_LEADS_URL=https://app.brena.cl/api/public/leads
BRENA_V2_API_TOKEN=<secreto-del-servidor>
BRENA_V2_TIMEOUT_MS=5000
TRUST_PROXY=1
BRENA_LOCAL_EXCEL_ENABLED=0
```

Antes de desplegar:

```powershell
$env:NODE_ENV='production'
$env:BRENA_LEAD_MODE='live'
$env:BRENA_V2_LEADS_URL='https://app.brena.cl/api/public/leads'
$env:BRENA_V2_API_TOKEN='<secreto-del-servidor>'
npm run check:production
```

El proceso se niega a iniciar en producción si queda en modo `preview`. El modo `local` exige el Excel local; el modo `live` exige el endpoint HTTPS y el token de BrenaV2.

## Docker

```powershell
docker build -t brena-public-web:2.0 .
docker run --rm -p 3011:3011 --env-file .env brena-public-web:2.0
```

El contenedor se ejecuta como usuario sin privilegios y expone `GET /healthcheck`.

## Contrato BrenaV2

Consulta [docs/BRENA_V2_INTEGRATION.md](docs/BRENA_V2_INTEGRATION.md). Las credenciales existen solo en el servidor público; nunca se envían al navegador.

## Archivos principales

- `frontend/public/index.html`: contenido y estructura semántica.
- `frontend/public/styles.css`: sistema visual responsive.
- `frontend/public/scripts.js`: formulario, accesibilidad y estados de interfaz.
- `src/server.js`: estáticos, cabeceras de seguridad y API pública.
- `src/lead-contract.js`: validación y mapeo a BrenaV2.
- `src/brena-client.js`: transporte servidor-a-servidor.
- `src/local-lead-archive.js`: registro acumulativo de formularios locales.
- `scripts/build-leads-workbook.mjs`: generación del archivo Excel.
- `src/config.js`: configuración y fallos seguros de producción.
- `ops/`: inicio, supervisión, salud, arranque al iniciar sesión y guía de migración.
