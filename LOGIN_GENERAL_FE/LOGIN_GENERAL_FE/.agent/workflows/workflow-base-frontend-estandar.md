# Workflow Base Frontend Estandar

Fecha: 2026-04-15  
Proyecto base: `LOGIN_GENERAL_FE`

## Objetivo

Definir una sola linea de trabajo para construir frontends satelite con la misma estructura tecnica, flujo funcional y pipeline de despliegue.

## 1) Estructura estandar del proyecto

- `src/app/auth`: login, reautenticacion, cambio de contrasena.
- `src/app/list-apps`: listado de apps y apertura controlada.
- `src/app/admin`: layout, guard, rutas protegidas.
- `src/app/core/models`: contratos de API.
- `src/app/core/services`: `auth`, `token`, `environment`, utilitarios de errores.
- `scripts`: `shared-config`, `generate-environment`, `build`, `deploy`, validadores.
- `.agent/workflows`: workflow base y procedimientos operativos.
- `docs`: roadmap, contratos, decisiones y seguimiento funcional.

## 2) Componentes y servicios minimos obligatorios

- `AuthService`: login, refresh, cambio de contrasena, obtencion de perfil/apps.
- `TokenService`: guardar/leer/remover token principal y tokens por app.
- `Auth Guard`: validar token util (existencia + expiracion).
- `Error mapper`: unificar mensajes backend (`message`, `value[]`, `errors`).
- `LoginFormComponent`: flujo determinista login -> datos usuario -> decision de destino.
- `PasswordChangeComponent` o modal: validacion local estricta antes de llamar API.

## 3) Flujo funcional canonico

1. Login exitoso guarda token principal.
2. Se obtiene usuario/token claims.
3. Si hay cambio obligatorio de contrasena: abrir popup y resolver cambio.
4. Tras cambio exitoso: reautenticar para renovar token.
5. Regla de destino:
   - una app: abrir en misma pestana;
   - varias apps: navegar a listado.
6. Desde listado: click abre app en nueva pestana.

## 4) Pipeline de build/deploy canonico

1. Identidad cerrada por proyecto:
   - `APP_NAME`
   - `BASE_HREF`
   - `outputPath`
   - `remotePath`
2. Build por entorno via generador de environment (sin edicion manual).
3. Deploy con validacion previa (`verify`, `validate`).
4. Rutas SFTP compatibles con chroot cuando aplique (`/app_xxx/<app-name>`).
5. Estrategia fail-fast en SFTP (sin reintentos largos).

## 4.1) Regla critica: identidad por satelite (sin nombres cruzados)

Cada satelite debe usar su propia identidad en todos estos puntos:

- `scripts/shared-config.js`: `APP_NAME`, rutas y hosts.
- `.env`: `*_REMOTE_PATH` del satelite, no de otro proyecto.
- `README.md`: comandos y ejemplos del satelite actual.
- `src/web.config`: rewrite hacia su propio `BASE_HREF`.
- `angular.json`: `outputPath` y nombre del proyecto coherentes.

Ejemplo para GS:

- `APP_NAME=gestion-servicios`
- `BASE_HREF=/gestion-servicios/`
- `DEV_REMOTE_PATH=/app_80/gestion-servicios` (si hay chroot)
- `web.config`:
  - `<action type="Rewrite" url="/gestion-servicios/" />`

Regla de oro: si aparece `login-general`, `admin-general`, `App-GS` o cualquier nombre heredado en un satelite que no corresponda, el despliegue se bloquea hasta corregir.

## 5) Definicion de terminado (DoD)

- Build local OK.
- Tests unitarios minimos de `auth`, `token`, `guard` y cambio de contrasena.
- Flujo de login/cambio de contrasena validado.
- Deploy dev validado con ruta remota correcta.
- Documentacion actualizada (`README`, `LECCIONES`, `ROADMAP` si aplica).

## 6) Checklist de adopcion en un nuevo frontend satelite

1. Copiar y ajustar `scripts/shared-config.js`.
2. Configurar `.env` por entorno (DEV/QA/PROD).
3. Ajustar `APP_NAME`, `BASE_HREF`, `dist`.
4. Migrar `AuthService` y `TokenService` al patron canonico.
5. Implementar parser comun de errores backend.
6. Implementar guard robusto (token valido, no solo token presente).
7. Probar casos:
   - login valido/invalido
   - cambio de contrasena obligatorio
   - renovacion de sesion
   - logout completo
8. Ejecutar:
   - `npm run verify`
   - `npm run validate`
   - `npm run build:env -- dev --api-port=9093`
   - `npm run deploy -- dev --api-port=9093`
9. Ejecutar auditoria de nombres cruzados antes de deploy:
   - `rg -n "login-general|admin-general|App-GS|gestion-servicios" src scripts angular.json README.md .env`
   - Validar que solo existan nombres esperados del satelite actual.

## 7) Regla de gobierno tecnico

- No mezclar cambios de deploy, seguridad y UX en el mismo lote.
- Cada fase debe cerrar con evidencia de prueba.
- Cualquier satelite nuevo debe heredar este workflow antes de personalizar modulos de negocio.
- `web.config` y `remotePath` son parte del contrato de despliegue del satelite y no se cambian sin actualizar `BASE_HREF` y documentacion.
