# Integración de la web pública con BrenaV2

## Límite de confianza

El navegador nunca llama directamente a BrenaV2 y nunca conoce sus credenciales. Envía el formulario a `POST /api/leads` de la web pública. El servidor valida, limita abuso y remite un payload normalizado a `BRENA_V2_LEADS_URL` usando `Authorization: Bearer <BRENA_V2_API_TOKEN>`.

El endpoint interno autenticado `POST /api/leads` que ya existe en BrenaV2 exige una sesión de usuario. No debe exponerse públicamente ni recibir credenciales en el navegador. BrenaV2 debe ofrecer un endpoint servidor-a-servidor dedicado, por ejemplo `POST /api/public/leads`, que valide el token de integración y reutilice la creación canónica de leads.

## Solicitud enviada a BrenaV2

```http
POST /api/public/leads HTTP/1.1
Authorization: Bearer <secreto>
Content-Type: application/json
X-Brena-Source: public-web
```

```json
{
  "nombre_propietario": "María Pérez",
  "telefono": "+56912345678",
  "email": "maria@example.cl",
  "origen_lead": "otro",
  "fecha_ingreso": "2026-08-26",
  "problema_principal": "herencia",
  "problemas_secundarios": [],
  "urgencia": "alta",
  "estado_pipeline": "nuevo",
  "objetivo_propietario": "Resolver una herencia o copropiedad",
  "observaciones": "Somos tres herederos y queremos conversar.",
  "source": "web_publica",
  "property": {
    "region": "Región Metropolitana de Santiago",
    "comuna": "Ñuñoa",
    "direccion_propiedad": "",
    "tipo_propiedad": "casa",
    "ocupacion_propiedad": "sin_informacion",
    "vive_propietario": null,
    "source": "web_publica"
  },
  "attribution": {
    "channel": "website",
    "page_url": "https://brena.cl/",
    "referrer": "https://www.google.com/",
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "venta-casa"
  },
  "privacy": {
    "consent": true,
    "consented_at": "2026-08-26T13:45:00.000Z",
    "notice_version": "2026-08-26"
  }
}
```

`origen_lead` conserva el vocabulario actual de BrenaV2 y usa `otro`; `source=web_publica` identifica inequívocamente la captura. Una solicitud crea un lead real, que es también la identidad de proyecto (`projectId = leadId`); no se crea una tabla o entidad Project adicional.

## Respuesta esperada

BrenaV2 puede responder cualquiera de estas formas con estado `200` o `201`:

```json
{ "lead": { "id": "uuid-del-lead" } }
```

```json
{ "id": "uuid-del-lead" }
```

```json
{ "submission_id": "uuid-del-lead" }
```

Otros estados, respuestas sin identificador o timeouts se convierten en un error genérico para el visitante. La web pública no revela el cuerpo de error de BrenaV2.

## Requisitos del endpoint receptor

1. Comparar el token mediante una operación de tiempo constante o validar una firma/HMAC equivalente.
2. Aplicar su propio rate limit además del límite de la web pública.
3. Validar el payload de nuevo; no confiar en la validación del emisor.
4. Crear el lead y la propiedad en una operación atómica usando la ruta canónica de BrenaV2.
5. Registrar la creación en el mecanismo de auditoría existente, sin almacenar el token ni datos de red innecesarios.
6. Ser idempotente si posteriormente se incorpora una clave de idempotencia.
7. Responder solo con el identificador público necesario.

## Códigos de la web pública

- `201`: BrenaV2 aceptó y persistió el lead.
- `202`: preview local o honeypot; no implica persistencia productiva.
- `400`: validación de campos.
- `413`: cuerpo superior a 16 KiB.
- `415`: formato distinto de JSON.
- `429`: límite temporal por dirección del cliente.
- `502/504`: rechazo o timeout de BrenaV2, presentado al visitante sin detalles internos.
