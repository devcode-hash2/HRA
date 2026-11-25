# Roadmap de Remediación

Fecha: 2026-04-14
Proyecto: `LOGIN_GENERAL_FE`

## Objetivo

Resolver los hallazgos detectados en el análisis técnico sin mezclar cambios de distinta naturaleza.
El orden prioriza primero la confiabilidad de build/deploy, luego la seguridad y estabilidad de autenticación, después la simplificación funcional y finalmente la cobertura de pruebas y documentación.

## Principios de ejecución

1. Cerrar una fase antes de abrir la siguiente.
2. No mezclar refactor, corrección funcional y cambios de deploy en el mismo lote.
3. Cada fase debe terminar con validación explícita.
4. `environment.prod.ts` debe tratarse como archivo generado, no como fuente manual de configuración.

## Resumen de prioridades

- `P0`: Build, environment y deploy.
- `P1`: Seguridad y consistencia de sesión/tokens.
- `P1`: Bugs funcionales visibles en login/listado.
- `P2`: Refactor de componentes y eliminación de duplicación.
- `P2`: Reparación y ampliación de pruebas.
- `P3`: Limpieza final y documentación.

## Fase 0. Línea base y criterio de verdad

### Hallazgos cubiertos

- El proyecto compila, pero el estado operativo real depende de scripts custom y configuración externa.
- Hay cambios locales ya presentes en el workspace, por lo que conviene aislar el trabajo por bloques.

### Tareas

- [ ] Definir cuál será la fuente única de verdad para:
  - nombre de aplicación
  - `baseHref`
  - `outputPath`
  - `remotePath`
  - URLs por entorno
- [ ] Confirmar entornos objetivo reales:
  - desarrollo
  - calidad
  - producción
- [x] Definir ruta base canónica del frontend: `/login-general/`.
- [ ] Confirmar si el backend por entorno usa puerto fijo o variable.
- [ ] Guardar baseline de validación actual:
  - `npm run build`
  - `npx ng test --watch=false --browsers=ChromeHeadless`

### Entregable

- Criterio de configuración unificado aprobado.
- Baseline de build y test documentado.

### Criterio de cierre

- Existe una decisión explícita sobre nombre, ruta base y estrategia de entornos.

## Fase 1. Reparar build dinámico y generación de environments

### Prioridad

`P0`

### Hallazgos cubiertos

- `build:env` genera `environment.prod.ts`, pero para entornos no productivos compila con `development`, que no reemplaza `environment.ts`.
- El generador tiene una regex incorrecta para reemplazo de puerto.
- Se usa el puerto del frontend como default del API en desarrollo.
- `environment.prod.ts` queda como archivo generado, pero el pipeline no siempre lo consume.

### Archivos afectados

- `angular.json`
- `scripts/build.js`
- `scripts/generate-environment.js`
- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

### Tareas

- [x] Corregir la estrategia de file replacement para que el build dinámico use el environment realmente generado.
- [x] Decidir entre estas dos opciones y aplicar una sola:
  - generar siempre `environment.ts` antes del build
  - mantener `environment.prod.ts` y compilar siempre con una configuración que lo reemplace
- [x] Mantener `environment.prod.ts` generado y compilar siempre con configuración `production`.
- [x] Corregir `buildApiUrl()` para reemplazar puertos correctamente.
- [x] Separar conceptualmente:
  - puerto del frontend
  - puerto del backend API
- [x] Evitar que desarrollo use valores implícitos engañosos.
- [x] Añadir validación del archivo generado antes de compilar.

### Validación

- [x] `npm run build`
- [x] `npm run build:env -- 80`
- [x] `npm run build:env -- calidad`
- [x] `npm run build:env -- prod`
- [x] Verificar que el bundle contiene la URL esperada en cada caso.

### Criterio de cierre

- Cada comando de build usa la URL correcta del backend y el environment generado coincide con el bundle final.

## Fase 2. Unificar naming, rutas y pipeline de deploy

### Prioridad

`P0`

### Hallazgos cubiertos

- Hay referencias inconsistentes a `hra-login-general`, `login-general`, `admin-general`, `dist/App-GS/browser/` y residuos históricos de `/gestion-servicios/`.
- Riesgo alto de despliegue a ruta incorrecta aunque el build funcione.

### Archivos afectados

- `package.json`
- `scripts/build.js`
- `scripts/shared-config.js`
- `scripts/deploy.js`
- `scripts/generate-environment.js`
- `gulpfile.js`
- `angular.json`

### Tareas

- [x] Definir un solo nombre canónico para la app: `login-general`.
- [x] Definir un solo `baseHref`: `/login-general/`.
- [x] Definir un solo `outputPath` y usarlo en todo el pipeline: `dist/login-general`.
- [x] Eliminar referencias residuales activas a apps antiguas o migraciones previas.
- [x] Unificar mensajes de salida y rutas impresas por consola.
- [x] Revisar `remotePath` por entorno y evitar defaults heredados incorrectos.
- [x] Añadir una verificación previa al deploy que falle si hay desalineación entre:
  - `angular.json`
  - scripts de build
  - scripts de deploy
  - gulp
- [x] Mantener operativos los comandos de compilación y deploy para uso manual.

### Decisiones cerradas

- Nombre canónico del proyecto: `login-general`.
- Ruta base canónica: `/login-general/`.
- Salida canónica del build: `dist/login-general/browser`.
- Los scripts de migración deben producir la identidad vigente del proyecto y no reintroducir nombres heredados.

### Validación

- [x] `npm run build`
- [x] `npm run build:env -- 80`
- [x] `npm run build:env -- calidad`
- [x] `npm run build:env -- prod`
- [x] `npm run verify`
- [x] `npm run validate`
- [x] `npx gulp --tasks-simple`
- [x] Simulación de deploy sin subir archivos mediante validación previa de rutas y tareas.

### Criterio de cierre

- El pipeline de build/deploy usa la misma identidad de aplicación y las mismas rutas en todos los scripts.
- Los comandos manuales de compilación y despliegue siguen siendo consistentes con esa identidad.

## Fase 3. Endurecer sesión, cookies y manejo de tokens

### Prioridad

`P1`

### Hallazgos cubiertos

- Logout incompleto: solo se elimina `value-token`.
- `value-refreshToken` y cookies de apps pueden permanecer.
- `saveRefreshTokenApp()` y `getRefreshTokenApp()` usan nombres distintos.
- El guard solo valida presencia de token.
- La expiración/decodificación del token no está centralizada.

### Archivos afectados

- `src/app/core/services/token.service.ts`
- `src/app/core/services/auth.service.ts`
- `src/app/admin/guards/auth-login-general.guard.ts`
- `src/app/list-apps/components/list-apps/list-apps.component.ts`
- `src/app/auth/components/login-form/login-form.component.ts`

### Tareas

- [x] Corregir el naming de refresh token por app.
- [x] Implementar logout completo:
  - token principal
  - refresh token principal
  - tokens de apps
  - refresh tokens de apps si aplican
- [x] Centralizar validación de expiración del JWT.
- [x] Hacer segura la decodificación del token frente a payload inválido.
- [x] Mejorar el guard para validar token útil, no solo token no vacío.
- [ ] Revisar si la cookie debe seguir en cliente JS o migrar a una estrategia más segura según restricciones del backend.
  - Estado documentado: el cambio a `HttpOnly` requiere coordinación backend + frontends consumidores del contrato actual de refresh.
  - Estrategia acordada: migración dual-compatible en backend antes de cambiar este frontend.

### Validación

- [x] Login correcto.
- [x] Logout elimina todas las credenciales esperadas.
- [x] Guard bloquea tokens expirados o corruptos.
- [x] La pantalla de listado no revienta con token inválido.

### Criterio de cierre

- La sesión queda consistente en login, renovación, expiración y logout.

## Fase 4. Corregir bugs funcionales visibles

### Prioridad

`P1`

### Hallazgos cubiertos

- `profileApp?.role` se muestra en template, pero nunca se asigna.
- El cambio de contraseña sigue enviando request aunque las contraseñas no coincidan.
- Hay flujo de login con suscripciones anidadas y dependencia de estado mutable.
- Hay navegación y apertura de apps con lógica distinta entre login y listado.

### Archivos afectados

- `src/app/auth/components/login-form/login-form.component.ts`
- `src/app/auth/components/login-form/login-form.component.html`
- `src/app/list-apps/components/list-apps/list-apps.component.ts`
- `src/app/list-apps/components/list-apps/list-apps.component.html`

### Tareas

- [x] Corregir la fuente del rol mostrado o eliminar el binding si no existe dato.
- [x] Bloquear el submit de cambio de contraseña si no coincide la validación local.
- [x] Reordenar el flujo de login para evitar race conditions con `userByToken`.
- [x] Unificar el criterio de apertura de app:
  - misma forma de obtener token
  - misma forma de abrir URL
  - mismo cleanup de tokens
- [x] Revisar mensajes de error para que no se muestre “usuario incorrecto” cuando el problema real sea otro.

### Validación

- [x] Login con una app.
- [x] Login con múltiples apps.
- [x] Login con obligación de cambio de contraseña.
- [x] Cambio de contraseña forzado reautentica antes de pedir `Post_token_app`.
- [x] Cambio de contraseña con mismatch.
- [x] Apertura de app desde listado.

### Criterio de cierre

- El flujo funcional principal es determinista y no depende de estado incompleto.
- Comportamiento funcional acordado:
  - 1 app: apertura directa en nueva pestaña.
  - varias apps: navegación a listado.
  - con cambio obligatorio: popup primero y luego destino según cantidad de apps.

## Fase 5. Reducir duplicación y dependencias directas del DOM

### Prioridad

`P2`

### Hallazgos cubiertos

- La lógica de cambio de contraseña está duplicada.
- Se usa `document.querySelector`, `querySelectorAll`, `window.location` y `window.open` directamente.
- Hay mucho control imperativo de UI que dificulta pruebas y mantenimiento.

### Archivos afectados

- `src/app/auth/components/login-form/login-form.component.ts`
- `src/app/list-apps/components/list-apps/list-apps.component.ts`
- `src/app/admin/components/modal-first/modal-first.component.*`

### Tareas

- [x] Extraer la lógica de cambio de contraseña a servicio o helper reutilizable.
- [x] Reemplazar manipulación directa del DOM por estado Angular donde sea posible.
- [x] Revisar si el foco inicial debe resolverse con `ViewChild` en lugar de `querySelector`.
- [x] Reemplazar deshabilitado por clase global `.disabledxSave` por estado reactivo.
- [x] Encapsular la navegación externa para facilitar pruebas.

### Validación

- [x] No quedan dependencias directas del DOM salvo casos justificados.
- [x] El flujo UI sigue funcionando igual tras el refactor.

### Criterio de cierre

- Menor duplicación y componentes más predecibles.

## Fase 6. Reparar y ampliar pruebas

### Prioridad

`P2`

### Hallazgos cubiertos

- Las pruebas actuales fallan.
- Los componentes standalone no están probados con providers reales o mocks.
- `AppComponent` conserva un test residual del scaffold original.

### Archivos afectados

- `src/app/app.component.spec.ts`
- `src/app/auth/components/login-form/login-form.component.spec.ts`
- `src/app/list-apps/components/list-apps/list-apps.component.spec.ts`
- `src/app/admin/guards/auth-login-general.guard.spec.ts`
- tests adicionales a crear para servicios si corresponde

### Tareas

- [x] Corregir specs rotos con providers adecuados.
- [x] Reemplazar el test residual del `<h1>` por un test coherente con `router-outlet`.
- [x] Añadir pruebas para:
  - guard con token válido e inválido
  - logout completo
  - cambio de contraseña con mismatch
  - flujo de login según cantidad de apps
  - validación de environment si se abstrae la lógica
- [x] Definir qué pruebas seguirán siendo unitarias y cuáles serán smoke tests.

### Validación

- [x] `npx ng test --watch=false --browsers=ChromeHeadless`
- [x] Todas las specs verdes.

### Criterio de cierre

- La suite cubre el flujo crítico y deja de ser una señal falsa.

## Fase 7. Limpieza de modelos, comentarios y documentación

### Prioridad

`P3`

### Hallazgos cubiertos

- `UpdateUser` está duplicado.
- Hay comentarios heredados y ruido de migración.
- README no refleja el estado real del pipeline ni de las decisiones de entorno.

### Archivos afectados

- `src/app/core/models/auth.model.ts`
- `README.md`
- `docs/`
- scripts con mensajes inconsistentes

### Tareas

- [x] Consolidar `UpdateUser` en una sola interfaz clara.
- [x] Eliminar código comentado y residuos de migración.
- [x] Ajustar README a la arquitectura real:
  - Angular standalone
  - entornos
  - build/deploy
  - pruebas
- [x] Documentar el flujo final de despliegue y rollback.

### Validación

- [x] Tipos consistentes.
- [x] README y docs alineados con la implementación final.

### Criterio de cierre

- El proyecto queda coherente a nivel técnico y documental.

## Orden recomendado de ejecución

1. Fase 0
2. Fase 1
3. Fase 2
4. Fase 3
5. Fase 4
6. Fase 5
7. Fase 6
8. Fase 7

## Plan de ejecución sugerido por lotes

### Lote A. Infraestructura de frontend

- Fase 0
- Fase 1
- Fase 2

### Lote B. Seguridad y sesión

- Fase 3
- Fase 4

### Lote C. Calidad interna

- Fase 5
- Fase 6
- Fase 7

## Definición de “hecho”

Una fase se considera cerrada solo si cumple todo lo siguiente:

- El cambio está implementado.
- La validación indicada fue ejecutada.
- No rompe la fase anterior.
- Se actualizó documentación mínima si cambió el comportamiento.
