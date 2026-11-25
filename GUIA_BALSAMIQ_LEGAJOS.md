# Guía de prototipado en Balsamiq: Legajos

## Objetivo

Recrear en Balsamiq el flujo de consulta y administración de legajos del Hospital Regional de Ayacucho. Las capturas compartidas son la referencia visual; este documento amplía el alcance para incluir las 12 secciones del legajo y las vistas de Recursos Humanos y del/de la servidor/a.

## Organización sugerida del proyecto

Crear un proyecto Balsamiq llamado **Legajos - Gestión de Personal** y organizar sus pantallas así:

1. `00 - Componentes comunes`
2. `01 - RR. HH.`
3. `02 - Mi legajo`
4. `03 - Estados y diálogos`

Usar componentes reutilizables para la cabecera, menú lateral, resumen de persona, pestañas, tabla de documentos, lista de secciones y etiquetas de estado. Duplicar las plantillas de detalle para las secciones que cambian de contenido, en lugar de redibujar el diseño desde cero.

## Base visual

- **Lienzo de referencia:** escritorio, 1440 × 900 px. La interfaz debe poder desplazarse verticalmente cuando el contenido exceda el alto visible.
- **Cabecera fija:** barra morada `#793576`, altura aproximada de 64 px; botón de menú y título a la izquierda; notificaciones, rol/nombre y avatar a la derecha.
- **Menú lateral:** ancho aproximado de 228 px bajo la cabecera; logo institucional en su franja superior; navegación `Persona` y `Legajos`; dentro de Legajos, las opciones `RR. HH.` y `Mi legajo`.
- **Área de trabajo:** fondo gris azulado muy claro, tarjetas blancas, bordes finos y sombras suaves.
- **Color de acción/selección:** morado institucional; estados positivos en verde; avisos informativos en azul; pendientes en gris.
- **Tipografía:** sans serif legible. Mantener títulos, etiquetas y datos en español.
- **Versión móvil:** apilar columnas; conservar navegación, identidad de la persona y acciones. En escritorio, respetar la distribución en dos columnas de las capturas.

## Componentes comunes

| Componente | Contenido |
|---|---|
| Cabecera | Logo, menú hamburguesa, título de vista, campana, nombre/rol y avatar. |
| Menú lateral | Persona, Legajos, subtítulo “VISTA DE PRUEBA”, RR. HH. y Mi legajo. Marcar la vista activa. |
| Encabezado de página | Icono, ruta o eyebrow, título y descripción breve. |
| Tarjeta de persona | Avatar, nombres y apellidos, DNI y estado “Activo” o “Personal activo”. |
| Pestañas | Subrayado morado para la activa. En el detalle, “Documentos” y, cuando corresponda, “Datos personales”. |
| Etiquetas | “Activo”, “Pendiente”, “Registrado” y “Enviado a RR. HH.” con estados visuales diferenciados. |
| Avisos | Banda discreta para explicar datos ficticios, permisos y resultado de acciones. |
| Tabla de documentos | Encabezado gris claro, filas separadas, textos largos en varias líneas y desplazamiento horizontal si hace falta. |

## Inventario de pantallas

### A. Recursos Humanos

#### RH-01 — Listado de legajos

Reproducir la primera captura:

- Encabezado “GESTIÓN DE PERSONAL / Legajos” y descripción “Consulta y administra la documentación del personal activo”.
- Aviso de demostración debajo del encabezado.
- Contenido en dos columnas: listado de personal a la izquierda y legajo seleccionado a la derecha.
- Listado: buscador por DNI o nombre, filtro/estado “Activo”, cantidad de registros y tabla con `N.° documento`, `Nombres y apellidos`, `Estado` y acceso a la fila.
- Seleccionar una fila resalta al/a la servidor/a y actualiza la tarjeta y el contenido de la columna derecha.
- Columna derecha: tarjeta de persona, estado activo y pestañas `Documentos del legajo` / `Datos personales`.
- En `Documentos del legajo`, mostrar las 12 secciones como filas seleccionables con número, título, descripción, icono y chevron.
- Incluir paginación si el listado tiene más registros que los visibles.

#### RH-02 — Datos personales del/de la servidor/a

Es el estado de RH-01 con la pestaña `Datos personales` seleccionada:

- Mantener visible el listado de personal y la tarjeta de persona.
- Mostrar el título “INFORMACIÓN SOLICITADA EN EL LEGAJO” y el bloque “Datos del/de la servidor/a civil”.
- Presentar los datos en controles de solo lectura organizados en grupos:
  - **Identificación:** nombres y apellidos, DNI.
  - **Contacto:** N.° de celular, correo electrónico.
  - **Domicilio:** domicilio actual.
- No mostrar acciones de edición para Recursos Humanos en esta vista de consulta.

#### RH-03 — Documentos de una sección

Plantilla para el detalle de cualquiera de las 12 secciones:

- Mantener el listado de personal a la izquierda y la tarjeta de la persona seleccionada arriba del panel derecho.
- Activar `Documentos del legajo` y mostrar `‹ Volver a las secciones`.
- Incluir un aviso de disponibilidad/permisos.
- Encabezado de sección: “SECCIÓN NN DE 12”, título, icono y cantidad de documentos.
- Tabla adaptable al contenido de esa sección. Columnas de referencia: `Documento requerido`, `Puede cargar`, `Archivo`, `Estado` y `Nombre del archivo`.
- Si una sección tiene subcategorías, incluirlas antes de la tabla y permitir volver al índice de la sección.
- En las filas, mostrar el acceso permitido, el nombre del archivo o “Sin documento adjunto”, el estado y la acción disponible para RR. HH.

### B. Vista del/de la servidor/a

#### ML-01 — Mi legajo

Reproducir las capturas cuarta y quinta:

- Encabezado “GESTIÓN DE PERSONAL / LEGAJO” y título “Mi legajo”.
- En la cabecera del contenido, tarjeta de progreso con documentos adjuntos sobre el total (referencia: `0 de 42`).
- Aviso de prototipo y aviso azul explicando que algunos documentos son gestionados exclusivamente por RR. HH.
- Tarjeta de identidad con nombres, DNI y etiqueta “Personal activo”.
- Panel de trabajo en dos columnas:
  - **Izquierda:** “MI LEGAJO”, “Documentación por sección”, contador `12` y lista desplazable de las 12 secciones. Cada elemento incluye número, icono, título, descripción, estado y chevron.
  - **Derecha:** encabezado de la sección elegida, número de sección, título y descripción; pestañas `Documentos` y, para la sección 1, `Datos personales`.
- Seleccionar otra sección actualiza el panel derecho sin perder el contexto del legajo.

#### ML-02 — Documentos de una sección

Estado de ML-01 con una sección seleccionada y la pestaña `Documentos` activa:

- Tabla con columnas `Tipo de documento`, `Acceso`, `Estado`, `Nombre del archivo` y `Fecha de registro`.
- Para documentos que puede presentar el/la servidor/a, mostrar botón `Subir`; mostrar `Cambiar` cuando ya exista un adjunto propio.
- Para documentos de acceso exclusivo de RR. HH., indicar `Solo RR. HH.` y no ofrecer carga al/a la servidor/a. Para documentos que solo puede cargar el/la servidor/a, indicar `Solo servidor/a`.
- Si el documento depende de una declaración previa (por ejemplo, seleccionar “Sí”), representar el selector y el estado habilitado/deshabilitado del botón de carga.
- Pie fijo del panel con texto de ayuda y botón `Enviar Documentos a RRHH`; deshabilitarlo hasta que exista al menos un archivo que se pueda enviar.
- Tras el envío, sustituir el botón por el estado `Documentos enviados a RR. HH.`.

#### ML-03 — Datos personales editables

Estado de Mi legajo en la pestaña `Datos personales`:

- Mostrar los mismos grupos de identificación, contacto y domicilio de RH-02, pero como campos editables.
- Campos: nombres y apellidos, DNI, celular, correo electrónico y domicilio actual.
- Acciones al pie: `Cancelar` y `Guardar cambios`.
- Incluir espacio para el mensaje de confirmación de guardado local.
- En el prototipo, explicar que los cambios son demostrativos y no se envían a un servidor.

## Variantes de las 12 secciones

Crear una variante de RH-03 y ML-02 para cada sección. Mantener la plantilla y cambiar número, título, descripción, lista de documentos, permisos, subtítulos y estados.

| N.° | Sección | Descripción breve | Variantes/subsecciones que deben representarse |
|---:|---|---|---|
| 01 | Información personal y familiar | Datos personales y familiares del/de la servidor/a civil. | Documentos personales/familiares; pestaña adicional de datos personales. |
| 02 | Incorporación | Selección, vinculación, inducción y período de prueba. | 2.1 Proceso de selección (solo RR. HH.); 2.2 Formalización del vínculo; 2.3 Inducción (solo RR. HH.); 2.4 Período de prueba. |
| 03 | Formación académica y capacitación | Estudios, grados, colegiatura, habilitación y capacitación. | Documentos académicos y de capacitación. |
| 04 | Experiencia laboral | Experiencia presentada durante el proceso de selección. | Documentos que acreditan experiencia laboral. |
| 05 | Movimientos del personal | Asistencia, permanencia, permisos, vacaciones, suspensiones y licencias. | Documentación de movimientos y ausencias. |
| 06 | Compensaciones | Compensaciones económicas/no económicas y aportes del empleador. | Documentación de compensaciones y aportes. |
| 07 | Evaluación de desempeño, progresión en la carrera y desplazamiento | Gestión del rendimiento, progresión en la carrera y desplazamientos. | 7.1 Evaluación de desempeño (solo RR. HH.); 7.2 Progresión en la carrera; 7.3 Desplazamiento. |
| 08 | Reconocimientos y sanciones disciplinarias | Reconocimientos por mérito, procedimientos disciplinarios y documentación del RNSSC. | 8.1 Reconocimientos; 8.2 Sanciones disciplinarias (solo RR. HH.). |
| 09 | Relaciones laborales individuales y colectivas | Controversias laborales y afiliación sindical. | Documentos de relaciones laborales y afiliación. |
| 10 | Seguridad y salud en el trabajo (SST) y bienestar social | SST, incidentes, seguros, subsidios, descansos médicos y EPS. | 10.1 SST (solo RR. HH.); 10.2 Bienestar social (solo RR. HH.). |
| 11 | Finalización del vínculo laboral | Documentación del proceso de finalización del vínculo con la entidad. | Documentos de cierre del vínculo laboral. |
| 12 | Otros documentos | Documentos relevantes no incluidos en las secciones anteriores. | Listado de documentos complementarios. |

> Los títulos y las subsecciones reflejan el prototipo actual. Para poblar todas las filas documentales en Balsamiq, usar los requisitos documentales oficiales como fuente; las capturas solo muestran ejemplos parciales.

## Pantallas de estado y diálogos

Preparar estados alternativos o anotaciones de interacción para los siguientes casos:

1. **Búsqueda sin resultados:** tabla vacía con mensaje y opción de limpiar el buscador.
2. **Cambio de sección:** sección seleccionada resaltada; contenido y título de la derecha actualizados.
3. **Documento pendiente:** “Sin documento adjunto” y etiqueta `Pendiente`.
4. **Archivo seleccionado:** nombre y fecha del archivo visibles, con acciones de vista previa y quitar/cambiar según rol.
5. **Carga no permitida:** botón deshabilitado o ayuda explicando por qué no se puede adjuntar.
6. **Envío deshabilitado / enviado:** botón inactivo antes de adjuntar; confirmación visual tras el envío.
7. **Confirmación para quitar archivo/restaurar datos:** diálogo con acción principal y botón `Cancelar`.
8. **Vista previa de documento:** modal con título, área de previsualización, `Descargar` y `Cerrar`.
9. **Guardado de datos personales:** aviso de éxito y acciones `Cancelar` / `Guardar cambios`.

## Enlaces de navegación para el prototipo

- Menú lateral `RR. HH.` → RH-01.
- Menú lateral `Mi legajo` → ML-01.
- Seleccionar persona en RH-01 → mantiene la lista y carga su resumen.
- Pestaña `Datos personales` en RR. HH. → RH-02.
- Seleccionar una sección en RR. HH. → RH-03 de esa sección.
- `Volver a las secciones` → RH-01 con la lista de secciones.
- Seleccionar sección en ML-01 → ML-02 de esa sección.
- Pestaña `Datos personales` en la sección 01 → ML-03.
- `Subir` → estado de archivo seleccionado; `Enviar Documentos a RRHH` → estado enviado.
- Acción de archivo → estado de vista previa; acción `Quitar` → diálogo de confirmación.

## Revisión antes de dar por terminado el proyecto Balsamiq

- [ ] Están creados RH-01, RH-02, ML-01, ML-03 y las plantillas RH-03/ML-02.
- [ ] Las 12 secciones aparecen en las listas de ambas vistas.
- [ ] Se han duplicado los detalles necesarios y están rotulados del 01 al 12.
- [ ] Las subsecciones 2, 7, 8 y 10 están representadas con acceso a sus variantes.
- [ ] Los permisos de carga distinguen claramente al/a la servidor/a de RR. HH.
- [ ] Los estados pendiente, archivo cargado y enviado están conectados.
- [ ] La navegación permite volver a la lista sin perder la persona seleccionada.
- [ ] Las vistas de escritorio siguen la distribución de las capturas y las tablas largas son desplazables.
