# Lecciones aprendidas - Validacion de entorno (2026-04-20)

Proyecto: LOGIN_GENERAL_FE

## Causa raiz
La validacion anterior exigia igualdad exacta entre API host y Login host.
Ese criterio produce falso positivo en QA porque QA opera con split-host por diseno:
- API: 10.100.6.19
- Login/Frontend: 10.100.6.22

## Ajuste aplicado
1. Se cambio la validacion a matriz por entorno.
2. Se mantuvo trazabilidad en consola con FE Host (sin FE IP ni FE Target).
3. Se agrego detalle de causa en mensajes de warning.
4. Se agrego mensaje informativo para split-host QA valido.

## Reglas operativas
- No usar regla global "API == Login" para todos los entornos.
- Cualquier nuevo entorno debe entrar a matriz esperada.
- Si cambia infraestructura, actualizar knownServers y matriz en el mismo commit.

## Resultado
- Menos ruido en consola.
- Deteccion de desvio real de configuracion.
- Menor riesgo de confundir incidentes de configuracion con comportamiento esperado.
