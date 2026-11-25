# Agent Operating Model (Frontend FE)

Este repositorio usa un modelo workflow-first para cambios de autenticacion, deploy y UI.

## Estructura

- `workflows/`: procedimientos tecnicos por tarea.
- `skills/`: orquestacion de workflows para objetivos concretos.

## Reglas

1. Mantener workflows separados por tarea.
2. Mantener skills como capa de orquestacion.
3. No duplicar instrucciones en multiples archivos.
4. Al cerrar cambios, actualizar `workflows/lecciones-aprendidas.md`.
5. Ninguna regla funcional basada en catalogos puede cerrarse con textos o IDs duros; usar `workflows/workflow-reglas-negocio-parametrizadas.md`.
