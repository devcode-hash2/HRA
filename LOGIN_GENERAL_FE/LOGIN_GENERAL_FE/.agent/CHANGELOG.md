# Changelog de Workflows y Skills (FE)

## [1.0.1] - 2026-04-28
### Changed
- `orquestador-workflows.md` y `workflow-recipes.md` ahora apuntan a recetas ejecutables del repo.
- Se agrega orquestador CLI `scripts/orquestador-workflows.js` para auditar deploy, compilar QA/PROD y ejecutar pre-QA tecnico.

## [1.0.0] - 2026-03-05
### Added
- Estructura canonica `.agent` con capas separadas de `workflows/` y `skills/`.
- `README.md` de operacion en raiz `.agent`, `workflows/` y `skills/`.
- `lecciones-aprendidas.md` como bitacora operativa.

### Changed
- Alineacion de 5 repos FE con el mismo set canonico de workflows y skills.
- Normalizacion de referencias a enlaces relativos.

### Fixed
- Eliminacion de enlaces absolutos `file:///...` que introducian dependencia a un repo especifico.
