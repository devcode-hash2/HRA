# Protocolo de Revisión Segura por Agente

**Versión:** 1.0  
**Aplica a:** Todos los proyectos FE de `F:\Pase_sgp_fua\`  
**Propósito:** Garantizar que cualquier agente (IA o humano) pueda mejorar código y documentos del proyecto sin romper el estado actual.

---

## Regla fundamental

> Un agente NUNCA modifica sin verificar primero. Un agente NUNCA termina sin verificar que dejó el proyecto igual o mejor.

---

## FASE 1 — Precondiciones (ANTES de cualquier cambio)

Ejecutar en orden. Si algún paso falla, **detener y reportar** antes de continuar.

```bash
# 1. Verificar configuración del proyecto
npm run verify

# 2. Verificar integridad de documentos protegidos (evidencia histórica)
npm run docs:check

# 3. Auditar que todos los .md estén registrados en docs/README.md
npm run docs:audit

# 4. Listar el estado actual de la documentación
npm run docs:list
```

Si el proyecto tiene tests, también:
```bash
npx ng test --watch=false --browsers=ChromeHeadless
```

**✅ Criterio de entrada:** Los 4 comandos pasan con código de salida 0.  
**🚫 Si falla precondición:** Registrar el fallo en `docs/CAMBIOS_PENDIENTES_COMMIT_<fecha>.md` antes de continuar.

---

## FASE 2 — Protocolo de mejora

### 2.1 ¿Qué puede mejorar un agente?

| Categoría | Permitido | Requiere precaución |
|---|---|---|
| **Código** | Refactorizar servicios, corregir bugs, mejorar tipado | Cambios de contrato API, rutas, nombres públicos |
| **Documentación** | Actualizar README, agregar MDs, corregir contenido | Eliminar archivos (ver §2.3) |
| **Configuración** | Ajustar environments, scripts de build | `shared-config.js`, base-href |
| **Tests** | Agregar specs, corregir specs fallidos | Eliminar specs existentes |

### 2.2 Reglas de identidad de proyecto (NO cruzar)

Cada proyecto tiene su propia identidad. Al modificar, respetar:
- `APP_NAME`, `BASE_HREF`, `outputPath`, `remotePath` son únicos por proyecto
- No copiar valores de otro proyecto sin adaptar
- Referirse a `workflow-base-frontend-estandar.md` §4.1

### 2.3 Regla de archivos protegidos — PROHIBIDO eliminar

Los siguientes prefijos son **evidencia histórica irreversible**:
- `CAMBIOS_PENDIENTES_COMMIT_*`
- `AUDITORIA_*`
- `ANALISIS_CAUSA_RAIZ_*`
- `DICCIONARIO_*`

**Acción si se necesita "corregir" uno:** Editar el archivo, NO eliminarlo.

### 2.4 Cómo registrar cambios de código

Cuando un agente modifica código, DEBE actualizar o crear el changelog:

```bash
# Crea automáticamente el MD y lo registra en docs/README.md
npm run docs:new "Descripción del cambio"
```

Luego editar el MD generado y completar:
- Sección `## 1. Cambios realizados` — listar archivos y qué cambió
- Sección `## Archivos afectados` — tabla de conteo
- Sección `## Impacto y riesgos` — evaluar con 🟢/🟡/🔴

### 2.5 Orden de operaciones recomendado

1. Leer `workflow-base-frontend-estandar.md` (contexto técnico)
2. Leer `workflow-reglas-negocio-parametrizadas.md` (si toca catálogos/estados)
3. Realizar cambios en código
4. Actualizar o crear documentación de los cambios
5. Ejecutar Fase 3

---

## FASE 3 — Postcondiciones (DESPUÉS de los cambios)

```bash
# 1. Volver a verificar configuración
npm run verify

# 2. Verificar que no se eliminó ningún archivo protegido
npm run docs:check

# 3. Auditar que los nuevos MDs quedaron registrados
npm run docs:audit

# 4. Build de verificación (no deploy)
node scripts/build.js qa
```

**✅ Criterio de salida:** Los 4 comandos pasan con código de salida 0.  
**🚫 Si falla postcondición:** Revertir el cambio que rompió el paso. Registrar el intento fallido en el changelog.

---

## FASE 4 — Cierre

Al finalizar, el agente debe poder afirmar:

- [ ] El proyecto compila sin errores
- [ ] `npm run docs:check` pasa (ningún protegido eliminado)
- [ ] `npm run docs:audit` pasa (todos los MDs enlazados)
- [ ] Si hubo cambios de código → existe un `CAMBIOS_PENDIENTES_COMMIT_<fecha>.md` actualizado
- [ ] Ningún valor de identidad de otro proyecto fue copiado sin adaptar

---

## Receta de workflow integrada

Para ejecutar la cadena completa de verificación:

```bash
# Verificación previa al cambio
npm run workflow -- run agent-precheck

# Verificación posterior al cambio
npm run workflow -- run agent-postcheck
```

---

## Contexto de workflows relacionados

| Workflow | Cuándo leerlo |
|---|---|
| `workflow-base-frontend-estandar.md` | Siempre, antes de tocar código |
| `workflow-reglas-negocio-parametrizadas.md` | Si el cambio toca catálogos, estados o clasificaciones |
| `orquestador-workflows.md` | Para entender las recetas disponibles |
| `lecciones-aprendidas.md` | Si el cambio es similar a uno previo |
| `CHECKLIST_UNIFICADO_PRE_QA.md` | Antes de un pase a QA formal |

---

## Señales de alerta para el agente

Si detecta alguna de estas condiciones, **pausar y reportar** antes de continuar:

- `npm run verify` falla → variables de entorno incorrectas
- `npm run docs:check` falla → archivo protegido eliminado por otro proceso
- Build genera warnings de compilación nuevos → posible regresión de tipos
- Tests existentes fallan después del cambio → regresión funcional
- Se detectan valores hardcodeados de otra app (nombre, ruta, host) → identidad cruzada
