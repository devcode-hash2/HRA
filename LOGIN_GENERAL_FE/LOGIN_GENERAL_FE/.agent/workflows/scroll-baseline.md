# Scroll Baseline (Estandar)

## Objetivo
Definir una base unica para grillas con scroll estable, sin solapamientos y con cabecera alineada.

## Reglas obligatorias
1. Mantener `min-width: 0` y `min-height: 0` en la cadena de contenedores.
2. Evitar `w-full` en tabla cuando `lockColumnTemplate=true`.
3. Definir `columnTemplate` por grilla segun dataset real.
4. Validar colision vertical/horizontal y ultima fila visible.
5. Evitar scroll global del viewport causado por la tabla.
