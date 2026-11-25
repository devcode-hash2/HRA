# Workflow Recipes FE

## Objetivo
Atajos de ejecucion para aplicar el orquestador FE sin perder trazabilidad.

## Receta 1 - Ajuste funcional con impacto QA
1. `workflow-base-frontend-estandar.md`
2. `orquestador-workflows.md`
3. Actualizar docs en `docs/` (diseno, CU, CP, plan QA)
4. Ejecucion tecnica sugerida:
   - `npm run workflow:preqa`

## Receta 2 - Ajuste de deploy
1. `migrate-deploy.md`
2. `sync-deploy-changes.md`
3. `update-readme.md`
4. Ejecucion tecnica:
   - `npm run workflow:deploy-audit`

## Receta 3 - Ajuste UI consistente
1. `modal-close-button-style.md`
2. `scroll-orquestador.md` (si hay grillas con scroll)
3. Registrar leccion en `lecciones-aprendidas.md`

## Receta 4 - Cierre previo a QA
1. Ejecutar `CHECKLIST_UNIFICADO_PRE_QA.md`
2. Validar artefacto y evidencia funcional
3. Actualizar docs de pase
4. Ejecucion tecnica:
   - `npm run workflow:preqa`
