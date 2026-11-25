---
description: Ejecutar migrate-v2.js para configurar el sistema de build/deploy en un frontend satelite
---

# Workflow: Migracion de Sistema de Deploy

Este workflow sirve para llevar el baseline de `LOGIN_GENERAL_FE` a otro frontend satelite sin arrastrar contratos antiguos.

> [!IMPORTANT]
> El baseline actual no usa una URL dedicada de login en environments. El contrato canonico es `url_api` y, si aplica, `id_app` mas variables personalizadas.

## Pre-requisitos

- Proyecto Angular existente con `angular.json`
- Node.js instalado
- Acceso SSH/SFTP a los servidores destino
- Matriz real de hosts `DEV`, `QA` y `PROD`

## Pasos de ejecucion

### 1. Navegar al proyecto destino

```bash
cd /ruta/al/proyecto/angular
```

### 2. Ejecutar el script de migracion

```bash
node F:/Pase_sgp_fua/Repositorio-para-la-aplicacion-Front-End-de-Gestion-de-FUA-Digital-GFUAD-/migrate-v2.js
```

### 3. Responder al asistente interactivo

El script detecta `web.config` o `angular.json` y solicita:

| Parametro | Descripcion | Ejemplo |
|-----------|-------------|---------|
| Nombre de la app | ID corto de la aplicacion | `fua`, `sgp` |
| ID de aplicacion | Identificador de app | `1`, `5` |
| Servidor de desarrollo | IP del servidor DEV | `10.100.6.24` |
| Base HREF | Ruta base Angular | `/fua/` |
| Build output | Directorio de compilacion | `dist/fua/browser` |
| Ruta del frontend | Nombre de despliegue | `fua` |
| Variables de environment | Opcion 1, 2 o 3 | Ver tabla |

Opciones de variables:

| Opcion | Variables generadas | Notas |
|--------|---------------------|-------|
| 1 | `url_api` | Pregunta si incluir `id_app` |
| 2 | `url_api` + `id_app` | Default |
| 3 | Opcion 2 + variables personalizadas | Pide valores DEV/QA/PROD |

### 4. Confirmar la migracion

Revisar el resumen y escribir `s` para continuar.

### 5. Configurar credenciales SSH

Editar `.env` con valores reales:

```env
DEV_SERVER_USER=tu_usuario
DEV_SERVER_PASS=tu_contrasena
QA_SERVER_USER=usuario_qa
QA_SERVER_PASS=contrasena_qa
PROD_SERVER_USER=usuario_prod
PROD_SERVER_PASS=contrasena_prod
```

### 6. Instalar dependencias

```bash
npm install
```

### 7. Verificar la configuracion

```bash
npm run verify
npm run validate
```

### 8. Ejecutar builds de prueba

```bash
npm run workflow:build:qa
npm run workflow:build:prod
```

## Archivos generados o sincronizados

```text
proyecto/
|-- gulpfile.js
|-- verify-config.js
|-- .env
|-- scripts/
|   |-- build.js
|   |-- deploy.js
|   |-- generate-environment.js
|   |-- orquestador-workflows.js
|   |-- shared-config.js
|   `-- validate-all-environments.js
|-- docs/
`-- .agent/workflows/
```

## Comandos canonicos

| Comando | Uso |
|---------|-----|
| `npm run build` | Build productivo deterministico |
| `npm run build:env -- dev --api-port=9093` | Build DEV puntual |
| `npm run build:env -- qa` | Build QA |
| `npm run deploy -- dev --api-port=9093` | Deploy DEV |
| `npm run workflow:list` | Ver recetas ejecutables |
| `npm run workflow:deploy-audit` | Auditoria operativa |

## Reglas de migracion

- No arrastrar nombres de otros satelites en `APP_NAME`, `BASE_HREF`, `remotePath` o README.
- No asumir mismo host para `API` y `Front`; validar la matriz real.
- No anunciar deploy QA/PROD como habilitado si operativamente sigue bloqueado.
- Mantener el build productivo deterministico.

## Solucion de problemas

### Error: host o entorno inconsistente

Revisar:

- `scripts/shared-config.js`
- `.env`
- `scripts/generate-environment.js`
- `src/app/core/services/environment.service.ts`
- `README.md`

### Error: build produce QA por accidente

`npm run build` debe regenerar `environment.prod.ts` productivo antes de compilar. Si no ocurre, corregir `package.json` y `scripts/build.js`.

### Error: verify o validate da falso verde

Los validadores deben distinguir:

- configuracion correcta
- build habilitado
- deploy habilitado
- deploy bloqueado operativamente

## Cierre

La migracion se considera cerrada cuando el satelite puede ejecutar:

```bash
npm run verify
npm run validate
npx ng test --watch=false --browsers=ChromeHeadless
npm run workflow:build:qa
npm run workflow:build:prod
```
