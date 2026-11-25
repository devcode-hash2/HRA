# Orquestador de Workflows FE

## Modo ejecutable

- Listar recetas:
  - `npm run workflow:list`
- Auditoria de deploy:
  - `npm run workflow:deploy-audit`
- Build QA:
  - `npm run workflow:build:qa`
- Build PROD:
  - `npm run workflow:build:prod`
- Pre-QA tecnico:
  - `npm run workflow:preqa`
- Deploy DEV con parametros:
  - `npm run workflow -- run deploy-dev --front-port=80 --api-port=9093`
- **Precondicion de revision por agente (FASE 1):**
  - `npm run workflow:agent-pre`
- **Postcondicion de revision por agente (FASE 3):**
  - `npm run workflow:agent-post`
- Documentacion — auditoria:
  - `npm run docs:audit`
- Documentacion — verificar protegidos:
  - `npm run docs:check`
- Documentacion — nuevo changelog:
  - `npm run docs:new "descripcion"`

## Alcance real

- `build`: DEV, QA y PROD disponibles.
- `deploy`: solo DEV disponible en flujo simple.
- `deploy QA`: bloqueado por diseno hasta habilitar SSH.
- `deploy PROD`: fuera del flujo simple; usar release controlado.

## Orden recomendado
1. `workflow-base-frontend-estandar.md`
2. `migrate-deploy.md`
3. `sync-deploy-changes.md`
4. `workflow-reglas-negocio-parametrizadas.md`
5. `update-readme.md`
6. `scroll-orquestador.md`
7. `lecciones-aprendidas.md`

## Regla
Actualizar primero `.agent/workflows` y luego documentacion de `docs/`.

## Gate transversal

Si un lote toca catalogos, estados o clasificaciones funcionales:

1. revisar `workflow-reglas-negocio-parametrizadas.md`
2. verificar si existen comparaciones por texto o IDs duros
3. si existen y no hay metadata persistida, no marcar el lote como `cerrado`
