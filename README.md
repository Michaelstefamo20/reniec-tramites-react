# Mi DNI en línea · Trámites+

Prototipo independiente de orientación ciudadana para Perú, construido con React, Vite, Express y PostgreSQL. **No es un servicio oficial de RENIEC ni presenta trámites o pagos reales.** Los requisitos, costos, oficinas y estados deben confirmarse en los canales oficiales de RENIEC.

## Funciones del prototipo

- Registro con enlace de activación por correo; la contraseña se crea en el sitio.
- Configuración de cuenta con cambio de contraseña y cambio de correo mediante confirmación en dos pasos.
- Dashboard con accesos personalizables, tutorial, asistente, familia y bandeja de notificaciones.
- Sugerencia de idioma y región mediante selección manual o ubicación opcional del dispositivo.
- Buscador de oficinas con datos abiertos de OpenStreetMap. La cobertura puede estar incompleta; verifica la dirección y atención antes de ir.
- Formularios y seguimiento demostrativos. No hay integración oficial, pagos reales ni expedientes RENIEC.

## Requisitos

- Node.js y npm compatibles con las dependencias actuales del proyecto.
- PostgreSQL accesible desde la máquina de desarrollo o desde el despliegue.
- Credenciales de un proveedor de correo para enviar enlaces de activación, recuperación y confirmación.

## Uso local

1. Clona el repositorio y entra en la carpeta:

   ```sh
   git clone https://github.com/Michaelstefamo20/reniec-tramites-react.git
   cd reniec-tramites-react
   ```

2. Instala las dependencias:

   ```sh
   npm ci
   ```

3. Crea tu archivo local de variables a partir de la plantilla:

   PowerShell:
   ```powershell
   Copy-Item .env.example .env
   ```

   macOS/Linux:
   ```sh
   cp .env.example .env
   ```

4. Edita `.env` con una base PostgreSQL alcanzable desde tu máquina. Completa también `DNI_ENCRYPTION_KEY` y `DNI_HASH_KEY` con claves aleatorias distintas. No uses las claves de ejemplo en producción.

5. Configura un proveedor de correo. Gmail API OAuth es el proveedor preferido; consulta las variables en `.env.example`. El remitente de `MAIL_FROM` debe corresponder a la cuenta autorizada. Apps Script, Resend y SMTP están disponibles como alternativas según la configuración del servidor.

6. Inicia la aplicación:

   ```sh
   npm run dev
   ```

   Abre la dirección local que imprima el proceso. El script inicia la API y Vite; si la base de datos no está disponible, la web puede cargar, pero el registro, inicio de sesión y configuración de cuenta no funcionarán.

Para compilar la web:

```sh
npm run build
```

Para servir localmente el resultado compilado:

```sh
npm run preview
```

## Despliegue en Vercel

1. Importa el repositorio de GitHub en Vercel y usa la carpeta raíz del proyecto.
2. Configura las variables en **Project Settings → Environment Variables** para Production. Usa `.env.production.example` como lista de referencia, no como archivo de valores.
3. Necesitas una URL PostgreSQL accesible públicamente desde las funciones de Vercel con TLS habilitado.
4. Configura las claves `DNI_ENCRYPTION_KEY` y `DNI_HASH_KEY`, el correo y las variables OAuth indicadas abajo.
5. Despliega la rama `main`. `vercel.json` dirige `/api/*` a `api/index.js`.
6. Si la web debe ser pública, desactiva la protección de inicio de sesión de despliegues de Vercel para Production. La protección de previews puede mantenerse.

### Variables de entorno principales

- `DATABASE_URL`: conexión PostgreSQL con TLS en producción.
- `DATABASE_SSL`: usa `true` en producción.
- `DNI_ENCRYPTION_KEY` y `DNI_HASH_KEY`: claves aleatorias independientes; guárdalas en Vercel, nunca en Git.
- `GMAIL_OAUTH_CLIENT_ID`, `GMAIL_OAUTH_CLIENT_SECRET`, `GMAIL_OAUTH_REFRESH_TOKEN` y `MAIL_FROM`: envío por Gmail API OAuth.
- `APPS_SCRIPT_MAIL_URL` y `APPS_SCRIPT_MAIL_SECRET`: alternativa heredada; Gmail OAuth tiene prioridad si se configura.
- `RESEND_API_KEY`: proveedor alternativo de correo.
- `APP_BASE_URL`: dominio público para enlaces. En la configuración actual, producción usa `https://reniec-tramites-react.vercel.app/`; al desplegar un fork con otro dominio, actualiza el valor de producción en `server/config/env.js`.
- `ANTHROPIC_API_KEY`: opcional para habilitar respuestas del asistente con Claude.
- `SUPPORT_ADMIN_EMAILS`: opcional, direcciones autorizadas separadas por comas para el panel de atención.

Después de modificar variables, vuelve a desplegar para que las funciones las reciban. No guardes contraseñas, tokens OAuth, claves ni `.env` en GitHub.

## Correo y cuentas

El usuario confirma su cuenta con un enlace de un solo uso que vence en 30 minutos. Para cambiar el correo, se requiere autorizar la solicitud desde el correo actual y luego confirmar el nuevo desde un segundo enlace. Cambiar la contraseña requiere la contraseña actual y cierra las sesiones existentes.

Para Gmail API OAuth, habilita el envío por Gmail en el proyecto de Google y proporciona las credenciales del servidor como variables de entorno. Nunca uses la contraseña normal de Gmail como `SMTP_PASS`; el modo SMTP local requiere una contraseña de aplicación. No ejecutes Apps Script ni regeneres credenciales por cada registro.

## Seguridad y privacidad

- Los DNI, nombres de cuenta, familiares, consultas de soporte y notificaciones se cifran en el servidor con `DNI_ENCRYPTION_KEY`.
- Las contraseñas se almacenan con hash, no en texto claro. Los tokens de activación y cambio de correo tienen caducidad y solo se pueden usar una vez.
- El DNI aparece oculto inicialmente en el dashboard y solo se revela en la sesión autenticada del titular. Evita mostrarlo al compartir pantalla.
- Tras tres minutos continuos sin poder contactar la API, la interfaz cierra la sesión local y limpia datos de usuario en memoria.
- Mantén las claves de cifrado estables y con respaldo seguro. Perderlas o rotarlas sin migrar los datos impedirá descifrarlos.
- `.env`, `.env.local` y otros archivos de entorno están ignorados por Git. Usa variables de Vercel para secretos de producción.

## Idiomas, ubicación y mapa

La interfaz ofrece Español, Quechua y Aimara donde hay traducciones. El selector cambia el idioma; la ubicación requiere permiso explícito y puede sugerir región e idioma. La búsqueda de oficinas consulta OpenStreetMap y puede tener datos incompletos o desactualizados; no es un directorio oficial de RENIEC.

## Estructura

- `src/components/`: interfaz React, registro, dashboard, cuenta, tutorial, mapa y asistente.
- `src/locales.js`: etiquetas y traducciones.
- `src/components/LanguageProvider.jsx`: selección persistente de idioma y ubicación.
- `server/`: API Express, autenticación, repositorios, cifrado y correo.
- `api/index.js`: entrada de API para Vercel.
- `apps-script/`: alternativa heredada para envío de correo.
- `docker-compose.yml` y `Dockerfile`: configuración opcional de contenedores; revisa sus variables antes de usarla.

## Limitaciones

Este repositorio es un prototipo. No está autorizado ni conectado a los sistemas oficiales de RENIEC, no valida parentescos o identidad, no procesa pagos, no crea expedientes oficiales y no garantiza que los datos abiertos del mapa estén completos. No ingreses datos bancarios ni uses los estados de demostración como seguimiento real.
