# Roadmap - Validacion de entorno (2026-04-20)

Proyecto: LOGIN_GENERAL_FE

## Objetivo
Eliminar falsos positivos de "IP MISMATCH DETECTED" y alinear la validacion con la arquitectura real de DEV/QA/PROD.

## Fases
1. Base comun de EnvironmentService
- Unificar deteccion de servidor conocido.
- Mantener fallback por environmentName (qa/quality/calidad).

2. Matriz de validacion por entorno
- DEV: API 10.100.6.24 + Login 10.100.6.24.
- QA: API 10.100.6.19 + Login 10.100.6.22.
- LOCAL: localhost/127.0.0.1.
- PROD: API/Login segun host productivo.

3. Observabilidad
- Mantener logs: Environment, API URL, Login URL, API Host, API Port, FE Host, Server Type.
- Warning solo cuando se rompe la matriz esperada.
- Mensaje informativo cuando QA usa split-host valido.

4. Verificacion
- Build QA verde en cada proyecto.
- Validar en consola que QA no muestre falso mismatch.

## Estado
- [x] Implementado en codigo
- [x] Compilacion QA lista
- [x] Documentacion actualizada
