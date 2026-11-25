# HISTORIAL DE CAMBIOS — LOGIN_GENERAL_FE

**Proyecto:** Angular — Frontend de autenticación general SGP

---

### Agregado

- `scripts/check-env-before-build.js` — validación de variables de entorno antes del build; verifica que las propiedades necesarias estén presentes.
- Tipo nombrado `ServerType` en `EnvironmentService`: `'development' | 'quality' | 'production' | 'local' | 'unknown'` (antes era una unión inline duplicada).
- Interface `EnvironmentMeta` para metadatos del entorno generado (`environmentName`, `server`, `generatedAt`).
- Campos `expectedLoginHost` y `allowEmptyLogin` en `ExpectedHostsByServerType`.
- Método `logServerTypeIndicator(serverType)` — indicador visual en consola con color diferenciado por tipo de servidor.
- Logging con formato `%c` y colores en `logEnvironmentInfo()`; información ampliada: API Port, Login URL, FE Host.

### Modificado

- `EnvironmentService.IpValidationResult`: renombrado `frontendHost` → `loginHost`. El frontend de login tiene identidad propia; el nombre genérico causaba ambigüedad con los satélites.
- `EnvironmentService.ServerInfo`: eliminado campo `configuredFrontendHost`; `serverType` ahora usa el tipo `ServerType`.
- `ExpectedHostsByServerType`: reemplazados `expectedFrontendHost` / `allowEmptyFrontendHost` por `expectedLoginHost` / `allowEmptyLogin`.
- `logEnvironmentInfo()`: en producción ahora es silencioso si la configuración es consistente; antes retornaba sin logging independientemente de inconsistencias.
- `getServerInfo()`: usa `this.getLoginUrl()` en lugar de `(environment as any).url_login || ''`.
- `environment.prod.ts`: ajuste menor de configuración de producción (+3 / -2 líneas).
- `package.json`: actualización de dependencia o script (+1 línea).
- `angular.json`: ajuste de configuración del proyecto (+3 / -2 líneas).

### Notas

> `configuredFrontendHost` fue eliminado de `ServerInfo`. Verificar que ningún componente externo lo consuma antes del commit.
> Verificar log en consola del navegador en ambiente QA y producción.

---

## Impacto y riesgos

| Aspecto | Evaluación | Estado |
|---|---|---|
| **Renombrado `frontendHost` → `loginHost`** | Cambio interno en `EnvironmentService`. Verificar que ningún componente externo consuma `configuredFrontendHost` antes del commit. | 🟡 Pendiente verificación |
| **Verificación en QA/Producción** | Validar que el logging con colores en consola funciona correctamente en los ambientes de calidad y producción. | 🟡 Pendiente verificación |
| **`check-env-before-build.js`** | Nuevo script de validación de variables de entorno previo al build. Sin efecto en runtime. | 🟢 Resuelto |
| **Refactorización `EnvironmentService`** | Cambios internos de tipado y nomenclatura. Sin breaking changes para el usuario final. | 🟢 Resuelto |
