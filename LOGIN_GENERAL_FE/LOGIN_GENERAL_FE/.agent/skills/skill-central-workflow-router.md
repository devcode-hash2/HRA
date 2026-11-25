# Skill: Central Workflow Router FE

## Objetivo
Seleccionar rapido el flujo correcto segun tipo de cambio.

## Entrada
1. Tipo de cambio: `auth`, `deploy`, `ui`, `qa-docs`.
2. Resultado esperado.

## Enrutamiento
- `auth` -> `fix-429-cookie-loop.md` + `workflow-base-frontend-estandar.md`
- `deploy` -> `migrate-deploy.md` + `sync-deploy-changes.md`
- `ui` -> `modal-close-button-style.md` + `scroll-orquestador.md`
- `qa-docs` -> `orquestador-workflows.md` + actualizacion en `docs/`

## Cierre
Registrar hallazgos en `../workflows/lecciones-aprendidas.md`.
