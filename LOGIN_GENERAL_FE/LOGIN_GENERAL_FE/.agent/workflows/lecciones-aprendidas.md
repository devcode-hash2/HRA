# Lecciones Aprendidas FE

| ID | Inconsistencia detectada | Causa raiz | Correccion aplicada | Regla preventiva |
|----|---------------------------|------------|---------------------|------------------|
| FE-01 | Deriva entre workflows del mismo stack FE | Cambios puntuales por repo sin sincronizacion | Se unifico base canonica de workflows FE | Mantener una sola fuente canonica para FE |
| FE-02 | Falta de separacion workflow/skill | Solo habia workflows sin capa de orquestacion | Se agrego `./.agent/skills/` en todos los repos FE | Workflow=tarea tecnica, Skill=orquestacion |
| FE-03 | Duplicacion en instrucciones de deploy y troubleshooting | Variantes locales no alineadas | Se sincronizo a la version mas completa | Cambios posteriores via proceso de sincronizacion |
