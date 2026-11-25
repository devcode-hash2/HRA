# login-general

Frontend Angular 20 para autenticación centralizada y listado de aplicativos.

## Marco de trabajo

- Workflow base reutilizable: `.agent/workflows/workflow-base-frontend-estandar.md`

## Requisitos

- Node.js 20+
- npm 10+

## Scripts principales

### Desarrollo

```bash
npm start
```

Servidor local: `http://localhost:4200/`.

### Build

```bash
npm run build
```

Genera artefactos en `dist/login-general/browser` con `baseHref` canónico `/login-general/`.

Nota: `npm run build` ahora fuerza la generacion previa del `environment.prod.ts` productivo.
Ya no depende del ultimo compilado generado manualmente para QA o DEV.

### Build por entorno

```bash
npm run build:env
npm run build:env -- dev --api-port=9093
npm run build:env -- qa
```

Modo interactivo simplificado:
- Pregunta `DEV` o `QA` (o `PROD`).
- `DEV`: solo solicita puerto backend API (`9090-9099`), host fijo `10.100.6.24`.
- `QA`: no solicita IP ni puerto, usa backend fijo `10.100.6.19`.

### Verificación de configuración

```bash
npm run verify
npm run validate
```

Recipes ejecutables del orquestador:
- `npm run workflow:list`
- `npm run workflow:deploy-audit`
- `npm run workflow:preqa`
- `npm run workflow:build:qa`
- `npm run workflow:build:prod`
- `npm run workflow -- run deploy-dev --front-port=80 --api-port=9093`

### Tests

```bash
npx ng test --watch=false --browsers=ChromeHeadless
```

Estrategia de pruebas:
- `Unitarias`: servicios (`token`, `auth`), guard y componentes standalone con mocks.
- `Smoke`: flujo crítico de login/listado validado en CI con `ng test` y validación manual mínima en ambiente objetivo.

## Deploy

```bash
npm run deploy
npm run deploy -- dev --api-port=9093
npm run deploy -- qa
```

Comandos directos para servidor de pruebas (DEV `10.100.6.24`):

```bash
npm run deploy -- dev --api-port=9090
npm run deploy -- dev --api-port=9091
npm run deploy -- dev --api-port=9092
npm run deploy -- dev --api-port=9093
npm run deploy -- dev --api-port=9094
npm run deploy -- dev --api-port=9095
npm run deploy -- dev --api-port=9096
npm run deploy -- dev --api-port=9097
npm run deploy -- dev --api-port=9098
npm run deploy -- dev --api-port=9099
```

Modo interactivo simplificado:
- Pregunta `DEV` o `QA`.
- `DEV`: solo solicita puerto backend API (`9090-9099`), host fijo `10.100.6.24`.
- `QA`: **bloqueado por diseño** hasta habilitar SSH en ese entorno (opción A).

- `PROD`: fuera del flujo simple; usar release controlado.

Precondiciones:
- `.env` con credenciales y hosts SSH/SFTP válidos.
- Ruta remota alineada con `login-general`.
- Build generado en `dist/login-general/browser`.

Rollback:
1. Re-publicar el último artefacto estable en `dist/login-general/browser`.
2. Restaurar variables `.env` del entorno estable anterior.
3. Ejecutar `npm run verify` antes de volver a desplegar.

## Deploy desde IDE (Visual Studio / VS Code)

### Opción recomendada: ejecutar script del proyecto

Usar terminal integrada del IDE y correr:

```bash
npm run deploy -- dev --api-port=9093
```

Ventaja: reutiliza la misma lógica de build, generación de environment y validaciones SFTP ya versionadas.

### Si quieres publicar por SFTP desde IDE

Configura la ruta remota considerando chroot:
- Host: `10.100.6.24`
- Puerto: `22`
- Usuario: valor de `DEV_SERVER_USER`
- Ruta remota: `/app_80/login-general` (no `C:/inetpub/wwwroot/...` cuando hay chroot)

Notas:
- Esta opción sube archivos, pero no reemplaza validaciones del script (`verify`, limpieza controlada, coherencia de rutas).
- Para equipo, mantener como flujo oficial el comando `npm run deploy`.

## Estructura funcional

- `src/app/auth`: login y cambio de contraseña inicial.
- `src/app/list-apps`: perfil, listado y apertura de aplicativos.
- `src/app/core/services/token.service.ts`: manejo de cookies/tokens y validación JWT.
- `src/app/core/services/auth.service.ts`: integración con backend de autenticación.
- `src/app/admin/guards/auth-login-general.guard.ts`: protección de rutas por sesión válida.

## Estado de sesión y seguridad

- Logout global limpia token principal, refresh token y tokens de apps.
- El guard valida sesión utilizable (no solo token presente).
- Decodificación JWT centralizada y segura ante payload inválido.

## Comportamiento funcional de login

- Si el usuario tiene una sola app asignada: se abre directamente en la misma pestaña.
- Si el usuario tiene varias apps: se navega al listado (`/list-app`).
- Desde el listado, al hacer clic en una app: se abre en nueva pestaña.
- Si backend fuerza cambio de contraseña:
  1. se abre primero el popup de cambio,
  2. al guardar correctamente se hace reautenticación con la nueva contraseña (backend invalida el token anterior),
  3. luego se aplica el destino por cantidad de apps:
     - 1 app -> apertura directa en la misma pestaña,
     - varias apps -> listado de apps.

## Propuesta pendiente: refresh token más seguro

Resumen de la propuesta:
- Guardar `refresh token` en cookie `HttpOnly + Secure + SameSite` (controlada por backend).
- Mantener `access token` en memoria para uso de frontend.
- Renovar sesión con endpoint de refresh basado en cookie (sin enviar refresh token en body).
- Revocar refresh token en backend durante logout.

### Impacto funcional esperado

Si se aplica **solo en este frontend** y el backend mantiene el contrato actual (`Post_refresh_token` con `v_REFRESH_TOKEN` en body), no habrá mejora real de seguridad.

Si se aplica **cambiando contrato backend** (refresh por cookie HttpOnly), sí hay impacto:
- Cambia el flujo de `renewSession()` en este frontend.
- Cambia el modelo/contrato de login y refresh.
- Puede afectar otros frontends que consumen los mismos endpoints de autenticación.

### Decisión de implementación recomendada

Para evitar romper otros frontends:
1. Implementar en backend una versión compatible (dual): aceptar flujo actual y nuevo flujo por cookie.
2. Migrar `LOGIN_GENERAL_FE` al nuevo flujo.
3. Validar que otros frontends sigan operativos.
4. Retirar flujo antiguo cuando todos migren.

### Conclusión para este repositorio

Este cambio **sí puede implicar más desarrollo transversal** si otros frontends dependen del contrato actual de refresh.
Por ahora, mantener el flujo actual en este proyecto evita regresiones en ecosistema.

## Validacion de entorno (2026-04-20)

Matriz oficial de hosts:
- DEV: API 10.100.6.24 (`WIN-R0CQNKDBP24`) / Front 10.100.6.24 (`WIN-R0CQNKDBP24`)
- QA: API 10.100.6.19 (`HR1W19DESAPP01`) / Front 10.100.6.22 (`HR1W19DESINTR01`)
- LOCAL: localhost o 127.0.0.1
- PROD: API 172.16.3.90 (`HR1W19PROSAPP01`) / Front 172.16.3.94 (`HR1W19PROINTR01`)
- Infraestructura PROD adicional: BD 172.16.3.84 (`HR1W19PROBDAT01`) solo como referencia; no se configura en el frontend.

Notas:
- El warning de IP mismatch se muestra solo cuando incumple la matriz del entorno.
- En QA y PROD, API y Front distintos son validos por diseno.
- FE Host se mantiene en logs para trazabilidad de origen.
- El nombre resuelto por DNS para `172.16.3.90` fue `HR1W19PROSAPP01`; si infraestructura confirma otro alias canonico, actualizar esta referencia.

## Estructura Documental

- Documentación operativa y de seguimiento histórico:
  - `.agent/docs/`
- Workflows operativos y orquestadores:
  - `.agent/workflows/`
- Documentación de desarrollo nueva:
  - `docs/`

## Referencias rápidas

- Orquestador principal:
  - `.agent/workflows/orquestador-workflows.md`
- Checklist unificado pre-QA:
  - `.agent/workflows/CHECKLIST_UNIFICADO_PRE_QA.md`
