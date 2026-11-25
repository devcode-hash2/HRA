# Versionado de Workflows y Skills (FE)

- Version actual: `1.0.1`
- Fecha de baseline: `2026-03-05`
- Alcance: `.agent/workflows` y `.agent/skills`

## Politica de versionado
- `MAJOR`: cambios incompatibles en estructura, rutas o convenciones de ejecucion.
- `MINOR`: nuevos workflows/skills compatibles con la estructura vigente.
- `PATCH`: correcciones de redaccion, enlaces, checklist o guardrails sin romper compatibilidad.

## Regla de control
1. Todo cambio en workflow/skill debe actualizar `CHANGELOG.md`.
2. Mantener referencias relativas entre archivos Markdown.
3. No duplicar detalle tecnico: workflow orquesta, skill ejecuta.
