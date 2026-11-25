# Workflow de Reglas de Negocio Parametrizadas

## Objetivo

Evitar cierres falsos de desarrollo cuando una regla funcional depende de:

- comparaciones por texto como `CESE`, `LICENCIA`, `MATERNIDAD`
- IDs duros sin metadata de negocio
- clasificaciones inferidas desde `label`, `name`, `descripcion` o `value` visual

Este workflow aplica a todos los proyectos que manejen catalogos, estados, motivos, clasificaciones o reglas de negocio configurables.

## Regla madre

Una regla funcional no se considera cerrada si depende de:

1. `if descripcion == "CESE"`
2. `Contains("LICENCIA")`
3. `id == 1`, `id == 2` sin tabla o metadata de respaldo
4. homologaciones mantenidas solo en `Common`, `Helpers`, `Constants` o frontend

Eso solo puede existir como `puente tecnico transitorio`, nunca como cierre final.

## Fuente de verdad obligatoria

La comparacion correcta debe salir de uno de estos mecanismos:

1. tabla de metadata del catalogo
2. tabla puente de homologacion
3. vista o SP que ya entregue clasificacion funcional
4. seed controlado en backend con entidad persistida y auditable

## Jerarquia de implementacion

1. `BD`
   - crear metadata funcional
   - crear homologaciones
   - sembrar datos base
2. `Backend`
   - leer metadata desde repositorio o consulta estable
   - exponer contrato limpio al frontend
3. `Frontend`
   - consumir flags o categorias desde API
   - no reimplementar clasificacion por texto

## Excepcion transitoria permitida

Solo se permite una regla por texto cuando se cumplan todas:

1. no existe aun metadata persistida
2. la salida del lote depende de desbloquear flujo urgente
3. la deuda queda documentada en roadmap, seguimiento y orquestador
4. se declara owner, fecha y fase exacta de retiro

Formato minimo de registro:

- `Estado`: `Puente tecnico`
- `Owner`: responsable
- `Archivo`: archivo exacto
- `Regla textual`: descripcion de la comparacion dura
- `Salida esperada`: tabla/SP/metadata que la reemplazara

## Gate para orquestadores

Todo orquestador de proyecto debe verificar antes de cerrar una fase:

1. si hay `Contains`, `Normalize`, `ToUpper`, `descripcion`, `label` usados para decidir negocio
2. si hay IDs duros ligados a catalogos
3. si existe tabla o metadata equivalente en BD

Si la respuesta a `1` o `2` es si, y `3` es no:

- `Fase 5. Persistencia y datos` no puede quedar `Cerrada`
- `Fase 6. Pruebas y pase` solo puede quedar `En revision`

## Checklist obligatorio

- identificar catalogos y estados involucrados
- listar columnas reales de BD
- definir metadata faltante
- decidir tabla nueva, tabla puente, vista o SP
- ajustar backend para consumir metadata
- ajustar frontend para consumir API, no texto
- registrar pruebas de coherencia

## Antipatrones prohibidos

- comparar `descripcion` de catalogo en backend como solucion final
- comparar `label` de combo en frontend como solucion final
- mapear motivos funcionales solo con `enum` local cuando el origen real es base de datos
- cerrar roadmap diciendo `terminado` si la clasificacion aun vive en texto duro

## Resultado esperado

Cuando este workflow se cumple:

- negocio cambia catalogos sin romper codigo
- QA valida comportamiento, no coincidencia textual
- los agentes pueden retomar el lote sin reinterpretar strings
- la regla queda auditable en BD y no escondida en codigo
