# Lecciones Aprendidas

Fecha: 2026-04-14
Proyecto origen: `LOGIN_GENERAL_FE`
Proyecto canónico: `login-general`

## Objetivo

Dejar un registro reutilizable para el siguiente proyecto y evitar repetir los mismos errores de build, environment, routing y deploy.

## Lo que salió mal

1. La identidad de la aplicación no estaba cerrada.
   Había mezcla entre `hra-login-general`, `login-general`, `admin-general`, `App-GS` y referencias históricas a `/gestion-servicios/`.

2. El environment generado no siempre era el que Angular consumía.
   Se generaba `environment.prod.ts`, pero algunos builds usaban una configuración que no lo reemplazaba.

3. La configuración estaba duplicada en varios puntos.
   `package.json`, `angular.json`, `build.js`, `generate-environment.js`, `gulpfile.js` y `deploy.js` podían divergir.

4. El pipeline dependía demasiado de convenciones implícitas.
   Cuando una ruta, nombre o `outputPath` cambiaba en un solo sitio, el deploy dejaba de ser confiable.

5. Los scripts históricos eran fuente de regresión.
   `migrate-v2.js` seguía pudiendo regenerar nombres y rutas viejas si no se limpiaba.

## Decisiones que funcionaron

1. Definir una sola identidad canónica.
   Se fijó `login-general` como nombre del proyecto, nombre de paquete, nombre Angular y nombre operativo de despliegue.

2. Definir una sola ruta base.
   Se fijó `/login-general/` como `baseHref` único.

3. Definir una sola ruta de salida.
   Se fijó `dist/login-general/browser` como salida única esperada por scripts y deploy.

4. Centralizar configuración compartida.
   `scripts/shared-config.js` quedó como fuente común para `build`, `deploy` y `gulp`.

5. Validar antes de desplegar.
   Se dejaron comandos de verificación para detectar desalineación antes de subir archivos al servidor.

## Lecciones de autenticación y UX (Fase 3 y 4)

1. Un token presente no implica una sesión utilizable.
   El guard debe validar expiración y formato del JWT, no solo existencia de cookie.

2. El login no debe depender de estado mutable entre suscripciones.
   Encadenar `login -> userByToken -> listadoApps` evita carreras y decisiones con datos incompletos.

3. Las validaciones locales deben cortar el request.
   Si la confirmación de contraseña no coincide, el frontend debe detener el submit antes de llamar al backend.

4. La apertura de apps debe tener una sola regla funcional.
   Login y listado deben usar la misma secuencia para token de app, persistencia de sesión de app y apertura de URL.

5. Los mensajes de error deben representar la causa real.
   Evitar mensajes genéricos de credenciales cuando el problema es falta de apps asignadas o fallas de sesión.

6. Cada criterio de validación de fase debe quedar reflejado en tests.
   Convertir escenarios de roadmap en pruebas evita que la siguiente fase reintroduzca errores ya cerrados.

7. Encapsular navegación externa y helpers de formulario reduce deuda técnica.
   Mover `window.open` y validaciones repetidas a servicios deja componentes más predecibles y testeables.

8. Cambios de autenticación compartida deben evaluarse a nivel ecosistema.
   Migrar refresh token a `HttpOnly` mejora seguridad, pero si hay varios frontends con el mismo contrato se debe aplicar con estrategia dual-compatible para evitar regresiones.

9. El flujo con cambio obligatorio debe respetar destino funcional final.
   Si hay cambio de contraseña forzado, el popup ocurre primero y luego se aplica la misma regla de destino por cantidad de apps (1 app abre directo, varias apps muestran listado).

10. Después de cambiar contraseña se debe renovar sesión antes de pedir token de app.
   El backend invalida tokens activos tras `Post_change_password`; si frontend llama `Post_token_app` con el token viejo, el resultado esperado es `401 Unauthorized`.

11. Los mensajes de error deben tener contrato transversal.
   Backend y frontend deben compartir un formato compatible (`message`, `value[]`, `errors`) para evitar mostrar textos genéricos o incorrectos cuando cambia el tipo de error.

12. El deploy de desarrollo debe parametrizar backend en consola.
   Para pruebas en `10.100.6.24`, el flujo interactivo debe permitir definir solo el puerto backend API (rango `9090-9099`) sin editar archivos manualmente.

13. Simplificar prompts reduce errores operativos.
   En build/deploy conviene preguntar solo `DEV` o `QA`, con IPs fijas por entorno y solo un dato variable en DEV (puerto backend `9090-9099`).

14. En errores de cambio de contraseña no se debe depender de un solo formato.
   El frontend debe soportar `value[].message`, `errors`, `message` y `HttpErrorResponse.message`; el backend debe evitar mensajes técnicos internos y devolver textos funcionales consistentes.

15. Decisiones de sesión deben basarse en `statusCode`, no solo en texto.
   Para reautenticación y revocación de token, evaluar explícitamente `401/403` evita cierres de sesión incorrectos por coincidencias de palabras.

16. En servidores SFTP con `ChrootDirectory`, la ruta Windows deja de ser válida para deploy.
   Si el usuario está enjaulado en `C:/inetpub/wwwroot`, la ruta operativa correcta pasa a ser relativa a `/` (por ejemplo `/app_80/login-general`).

17. Reintentos excesivos ocultan causa raíz y alargan fallas operativas.
   Conviene usar pocos reintentos con corte temprano en errores no recuperables (`code=2`, `code=3`) y logs con `code/message` explícitos.

18. El deploy debe detectar estilo de ruta remota antes de crear carpetas.
   Probar candidatos (`C:/...`, `/C:/...`, `/app_80/...`) reduce errores por diferencias de SFTP en Windows.

19. El deploy no debe continuar si falla la preparación del directorio remoto.
   Si no se valida/crea la ruta destino, se debe abortar antes de limpiar/subir archivos para evitar estado inconsistente.

20. Para escalar a apps satélite, copiar scripts sin estandarizar rompe rápido.
   Se debe portar un paquete mínimo común: `shared-config`, `generate-environment`, `deploy`, validaciones previas y convención única de `APP_NAME/baseHref/outputPath/remotePath`.

## Reglas para el siguiente proyecto

1. Antes de tocar código, cerrar estos cuatro valores:
   - `APP_NAME`
   - `BASE_HREF`
   - `outputPath`
   - `remotePath`

2. El archivo de environment generado nunca debe depender de una configuración Angular que no lo reemplace.

3. No repetir nombres de app ni rutas en varios scripts.
   Si un valor es compartido, debe salir de un archivo común.

4. Los generadores o migradores deben producir exactamente la identidad vigente del proyecto.
   Si no, se convierten en deuda activa y reintroducen configuración vieja.

5. No hacer deploy sin una verificación automatizada previa.

## Checklist mínimo de arranque para otro proyecto

- Confirmar nombre canónico de la app.
- Confirmar `baseHref` real de IIS o reverse proxy.
- Confirmar `outputPath` real que espera el pipeline.
- Confirmar hosts, puertos SSH y `remotePath` por entorno.
- Confirmar si el backend cambia por host, por puerto o por ambos.
- Confirmar si el deploy será por `gulp`, por script Node o por CI/CD.
- Confirmar que `verify` y `validate` fallen si la configuración se desalinea.

## Comandos canónicos que quedaron operativos

### Compilación

```bash
npm run build
npm run build:env
npm run build:env -- dev --api-port=9093
npm run build:env -- qa
npm run build:env -- prod
```

### Verificación

```bash
npm run verify
npm run validate
npx gulp --tasks-simple
```

### Deploy

```bash
npm run deploy
npm run deploy -- dev --api-port=9093
npm run deploy -- qa
```

## Precondiciones de deploy

- `.env` debe existir con credenciales SSH válidas.
- El servidor objetivo debe tener habilitado el acceso SSH/SFTP.
- La ruta remota debe coincidir con el `APP_NAME` vigente.
- El artefacto esperado debe existir en `dist/login-general/browser`.

## Señales de alarma que no deben ignorarse

- El build genera en una carpeta distinta a la esperada por `gulp`.
- `verify` o `validate` siguen pasando aunque haya rutas inconsistentes.
- Aparecen otra vez nombres como `admin-general`, `App-GS` o `gestion-servicios`.
- El environment generado apunta a una URL distinta a la del bundle final.
- El deploy depende de ingreso manual de IPs o valores que deberían estar fijos por entorno.

## Resultado útil para replicar

El patrón correcto para el siguiente proyecto es:

1. fijar identidad canónica;
2. centralizar constantes compartidas;
3. generar environment de forma determinista;
4. compilar siempre con la configuración que consume ese environment;
5. validar consistencia antes de desplegar;
6. mantener los scripts de migración alineados con la identidad actual.

## Guía base para apps satélite (plantilla)

1. Crear en cada app satélite su `scripts/shared-config.js` con los mismos campos base de `login-general`.
2. Estandarizar comandos: `build:env`, `deploy`, `verify`, `validate`.
3. Definir `DEV_REMOTE_PATH` en formato chroot (`/app_xxxx/<app-name>`) cuando aplique.
4. Mantener `TARGET_API_HOST` y `TARGET_API_PORT` como únicos overrides dinámicos en DEV.
5. Reusar estrategia de fail-fast en SFTP (sin reintentos largos).
6. Validar en pipeline que `dist`, `baseHref` y `remotePath` sean coherentes antes del deploy real.
