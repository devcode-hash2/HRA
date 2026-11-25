---
description: Gestionar cambios en archivos de build/deploy y sincronizarlos con migrate-v2.js
---

# Workflow: Sincronizacion de Cambios de Deploy

Este workflow existe para que cualquier ajuste operativo hecho en el proyecto semilla tambien quede replicado en `migrate-v2.js`.

> [!IMPORTANT]
> El baseline actual usa `url_api` como variable principal de entorno. No reintroducir contratos heredados ni ejemplos que dependan de propiedades removidas.

## Mapa de archivos

| Archivo local | Template en `migrate-v2.js` |
|---------------|-----------------------------|
| `scripts/shared-config.js` | `generateSharedConfig()` |
| `scripts/deploy.js` | `generateDeployScript()` |
| `scripts/build.js` | `generateBuildScript()` |
| `scripts/generate-environment.js` | `generateEnvironmentScript()` |
| `scripts/validate-all-environments.js` | `generateValidateScript()` |
| `verify-config.js` | `generateVerifyConfig()` |
| `package.json` | `updatePackageJson()` |
| `src/app/core/services/environment.service.ts` | `generateEnvironmentService()` |

## Pasos

### 1. Cambiar primero el archivo real del proyecto

Editar el archivo local y validar su sintaxis:

```bash
node --check scripts/generate-environment.js
```

### 2. Probar el comportamiento real

```bash
npm run verify
npm run validate
npm run workflow:build:qa
npm run workflow:build:prod
```

### 3. Replicar el cambio en `migrate-v2.js`

Actualizar el template correspondiente y cuidar:

- interpolaciones de template literal
- paths con `/`
- nombres del satelite
- matriz de hosts

### 4. Verificar `migrate-v2.js`

```bash
node --check migrate-v2.js
```

### 5. Registrar el cambio documental

Actualizar si corresponde:

- `README.md`
- `.agent/workflows/orquestador-workflows.md`
- `docs/MEJORAS_SATELITES_BACKLOG.md`

## Cambios criticos que siempre deben mantenerse

### 1. Build productivo deterministico

`npm run build` debe regenerar `environment.prod.ts` productivo antes del build Angular.

### 2. Matriz `API` vs `Front`

`EnvironmentService`, generadores y validadores deben aceptar entornos con split-host cuando aplique.

### 3. Validadores sin falso verde

`verify` y `validate` deben distinguir:

- configuracion correcta
- build habilitado
- deploy habilitado
- deploy bloqueado operativamente

### 4. Orquestador ejecutable

Si se agrega o cambia una receta operativa, sincronizar:

- `scripts/orquestador-workflows.js`
- `package.json`
- `.agent/workflows/orquestador-workflows.md`

## Checklist de cierre

- [ ] El archivo local funciona
- [ ] El template equivalente en `migrate-v2.js` quedo actualizado
- [ ] `node --check migrate-v2.js` pasa
- [ ] `verify` y `validate` siguen sin falsos positivos
- [ ] La documentacion principal refleja el cambio
