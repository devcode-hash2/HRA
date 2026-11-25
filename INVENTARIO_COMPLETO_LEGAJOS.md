# Inventario completo del módulo Legajos

## Alcance y cautelas

Este inventario describe los archivos encontrados en el workspace actual para `LEGAJOS`, incluido el componente Angular, las rutas y dependencias visuales compartidas, una guía Balsamiq ya existente y una maqueta HTML independiente.

La implementación Angular encontrada es una **vista de demostración/prototipo**: el propio interfaz indica que la lista contiene datos ficticios y que los archivos no se guardan en el servidor. No se encontró un servicio HTTP, contrato API o modelo de backend de Legajos en el código examinado. No se debe inferir de la maqueta HTML que todas sus operaciones estén implementadas en Angular.

Para respetar la restricción de privacidad, las copias de `legajo-personal.component.ts` y `PROTOTIPO_LEGAJOS.html` dentro de la entrega sustituyen nombres, documentos, teléfonos, correos y domicilios de demostración por valores sintéticos explícitos. Los archivos originales del proyecto no se modificaron. Las capturas se tomaron navegando únicamente entre vistas y pestañas; sus valores identificativos están desenfocados. No se seleccionaron ni enviaron archivos, no se guardaron cambios ni se modificaron datos de la aplicación.

## Resumen cuantitativo

| Medida | Resultado observado |
|---|---:|
| Vistas principales con ruta Angular | 2: RR. HH. y Mi legajo |
| Estados de pantalla nombrados en la guía existente | 6: RH-01, RH-02, RH-03, ML-01, ML-02 y ML-03 |
| Variantes si se materializa RH-03 y ML-02 para cada una de las 12 secciones | 28 estados/variantes en total |
| Secciones documentales definidas en Angular | 12 |
| Filas de documentos requeridos definidas | 71 |
| Documentos cargables por el/la servidor/a, incluyendo declaraciones | 46 |
| Documentos que aportan al progreso `0 de 42` | 42; se excluyen cuatro documentos condicionales de declaración |
| Formularios Angular con etiqueta HTML `<form>` | 0 |
| Paneles lógicos editables en Angular | 1, con 5 campos personales |
| Formularios HTML en la maqueta estática complementaria | 2: empleado/a y datos personales |
| Campos personales editables principales | 5 |
| Tablas distintas en la plantilla Angular | 3 |
| Capturas generadas | 5 |
| Archivos en el ZIP | 30: 21 archivos fuente/documentación preexistentes, 5 capturas y 4 índices/documentos generados |

El número de formularios se informa por separado para no confundir el componente Angular con la maqueta HTML. La plantilla Angular no encierra los campos en un `<form>`; usa `FormsModule`/`ngModel` y presenta un panel de edición. La maqueta HTML sí define dos elementos `<form>`.

## 1. Estructura del módulo

La implementación está concentrada en un único componente Angular:

```text
ADMIN_GENERAL_FE/src/app/app-admin/components/legajo-personal/
  legajo-personal.component.ts
  legajo-personal.component.html
  legajo-personal.component.scss
  legajo-personal-data-store.service.ts
  legajo-file-store.service.ts
```

El componente combina las vistas de administración de RR. HH. y Mi legajo; no se encontraron componentes Angular separados para alta, edición, detalle, consulta, historial, seguimiento, documentación o modales de Legajos. Las listas, los formularios/paneles, las tablas y los estados de sección se definen en la plantilla y la clase del mismo componente.

`LegajoSection`, `LegajoEmployee` y los tipos auxiliares están declarados en el TypeScript del componente. `LegajoPersonData` se declara dentro del servicio de datos personales. No se encontraron archivos independientes de modelos, interfaces, enums o catálogos de Legajos.

## 2. Pantallas y navegación

### Vistas Angular

| Vista/estado | Ruta | Contenido identificado |
|---|---|---|
| RH-01 — listado de legajos | `/legajos`; en desarrollo `/preview-legajos` | Búsqueda de personal activo, tabla/listado de empleados, persona seleccionada y lista de 12 secciones. |
| RH-02 — datos personales | Estado de `/legajos` con la pestaña `Datos personales` | Consulta de identificación, contacto y domicilio del personal seleccionado; campos de solo lectura. |
| RH-03 — documentos de sección | Estado de `/legajos` tras seleccionar una sección | Aviso de envío/disponibilidad, encabezado de sección y tabla con documentos, permisos, archivo, estado y fecha. |
| ML-01 — Mi legajo | `/mi-legajo`; en desarrollo `/preview-mi-legajo` | Resumen del/de la servidor/a, progreso, lista de 12 secciones y documentos de la sección activa. |
| ML-02 — documentos de sección | Estado de `/mi-legajo` con `Documentos` | Tabla de documentos, permisos de carga, estados, adjuntos, progreso y acción de envío a RR. HH. |
| ML-03 — datos personales editables | `/mi-legajo`, sección 1, pestaña `Datos personales` | Panel editable con cinco campos, `Cancelar`, `Guardar cambios` y mensaje de resultado. |

RH-03 y ML-02 son plantillas dinámicas que muestran el contenido de cualquiera de las 12 secciones; la guía existente sugiere duplicar esas pantallas como variantes de Balsamiq.

### Rutas encontradas

- `app-admin.routes.ts`: rutas de aplicación `legajos` y `mi-legajo`, ambas al mismo `LegajoPersonalComponent`.
- `app.routes.ts`: rutas temporales `preview-legajos`, `preview-mi-legajo` y redirección `preview-legajo-personal`, habilitadas solo cuando `environment.production` es falso. Las dos rutas de preview reutilizan el componente.
- El grupo de rutas de administración se encuentra dentro de `NavComponent` y usa `authAdminPersonGuard`. El guard comprueba token de aplicación y `sessionStorage.appNumber`; si faltan, redirige al URL de login definido por environment.
- El menú compartido añade la entrada `Legajos` al menú de `Gestión de personal` si no existe; ofrece `RR. HH.` y `Mi legajo` en las vistas de prueba.

No se encontró paginación, ordenamiento, filtro seleccionable de estados, pestañas adicionales ni historial en la implementación Angular. El estado `Activo` del listado es fijo y la búsqueda filtra por nombre o DNI sobre los registros de demostración.

## 3. Formularios y campos

### Panel de datos personales Angular

Un panel lógico editable, mostrado en Mi legajo para la sección 1. No tiene una etiqueta `<form>` en el HTML.

| Campo | Propiedad/modelo | Atributos observados |
|---|---|---|
| Nombres y apellidos | `personalDataDraft.fullName` / `myFullName` | `autocomplete="name"`; no se observó validador requerido en Angular. |
| DNI | `personalDataDraft.dni` / `myDni` | `inputmode="numeric"`, longitud máxima 8; no se observó validador de formato en Angular. |
| N.° de celular | `personalDataDraft.phone` / `myPhone` | `autocomplete="tel"`. |
| Correo electrónico | `personalDataDraft.email` / `myEmail` | `type="email"`, `autocomplete="email"`. |
| Domicilio actual | `personalDataDraft.address` / `myAddress` | `autocomplete="street-address"`. |

Los cinco campos se enlazan mediante `[(ngModel)]`. `Cancelar` restaura los datos almacenados en el objeto del empleado; `Guardar cambios` persiste el borrador en `localStorage` a través de `LegajoPersonalDataStore`. La vista RR. HH. presenta los mismos cinco datos en modo de lectura.

### Otros controles de entrada Angular

- Búsqueda del listado: `searchTerm`, campo de texto libre; busca por nombre o DNI.
- Declaraciones condicionales: cuatro selectores Sí/No se generan en las filas que `isDeclaration()` identifica. Las opciones son `Seleccionar`, `Sí` y `No`; elegir algo distinto de `Sí` quita el adjunto asociado. No son un formulario independiente.
- Carga de documentos: controles `<input type="file">` generados en las filas según rol y permisos. Se aceptan PDF, JPG/JPEG, PNG, DOC y DOCX; para documentos reconocidos como CV solo PDF, DOC y DOCX. El límite validado en lógica es 10 MB.
- No se encontró validación de servidor, carga de archivos a un API ni formulario de registro de personal en Angular.

### Formularios de la maqueta HTML adicional

La maqueta estática incluye dos formularios HTML:

1. `employee-form`: alta/edición de persona; cinco datos visibles (nombre, DNI, celular, correo, domicilio) y un campo oculto `employeeId`. Incluye validaciones HTML en esta maqueta, por ejemplo `required`, longitudes, formato de correo y patrón numérico del DNI.
2. `personal-form`: edición de los cinco datos personales.

Estos formularios pertenecen a `PROTOTIPO_LEGAJOS.html`, no al componente Angular. La maqueta también define un campo de importación JSON y controles dinámicos de búsqueda/carga.

## 4. Tablas y columnas

Se identificaron tres tablas distintas en la plantilla Angular:

| Tabla | Columnas |
|---|---|
| Personal activo (`employee-table`) | `N.° documento`; `Nombres y apellidos`; `Estado`; columna de selección/acceso (encabezado accesible “Seleccionar”). |
| Documentos de RR. HH. (`hr-document-table`) | `Documento requerido`; `Puede cargar`; `Archivo`; `Estado`; `Nombre del archivo`; `Fecha de registro`. |
| Documentos de Mi legajo (`my-documents-table`) | `Tipo de documento`; `Acceso`; `Estado`; `Nombre del archivo`; `Fecha de registro`. |

Las subsecciones se representan como filas que abarcan la tabla. No se encontró paginación ni configuración separada de columnas: encabezados y celdas están escritos directamente en la plantilla. El listado de RR. HH. muestra 15 registros ficticios en esta vista.

## 5. Secciones, documentos y permisos

Los nombres y los 71 requisitos documentales completos se conservan en el TypeScript copiado del componente. Conteo de elementos por sección:

| # | Sección | Documentos |
|---:|---|---:|
| 1 | Información personal y familiar | 10 |
| 2 | Incorporación | 13 |
| 3 | Formación académica y capacitación | 8 |
| 4 | Experiencia laboral | 2 |
| 5 | Movimientos del personal | 5 |
| 6 | Compensaciones | 4 |
| 7 | Evaluación de desempeño, progresión en la carrera y desplazamiento | 6 |
| 8 | Reconocimientos y sanciones disciplinarias | 5 |
| 9 | Relaciones laborales individuales y colectivas | 3 |
| 10 | Seguridad y salud en el trabajo (SST) y bienestar social | 7 |
| 11 | Finalización del vínculo laboral | 7 |
| 12 | Otros documentos | 1 |
| **Total** |  | **71** |

Subsecciones explícitas en el código:

- Sección 2: proceso de selección (RR. HH.), formalización del vínculo, inducción (RR. HH.) y período de prueba.
- Sección 7: evaluación de desempeño (RR. HH.), progresión en la carrera y desplazamiento.
- Sección 8: reconocimientos y sanciones disciplinarias (RR. HH.).
- Sección 10: SST y bienestar social (ambas marcadas solo RR. HH.).

Resumen de permisos declarados en el componente:

| Sección | Carga del/de la servidor/a | Carga de RR. HH. |
|---:|---|---|
| 1 | Todos los requisitos | No declarada; el comportamiento predeterminado es solo servidor/a. |
| 2 | Índices 2–6 y 12 | Índices 0–1 y 7–11. |
| 3 | Todos | No declarada; predeterminado solo servidor/a. |
| 4 | Todos | No declarada; predeterminado solo servidor/a. |
| 5 | Todos | Todos. |
| 6 | Todos | No declarada; predeterminado solo servidor/a. |
| 7 | Índices 2–5 | Índices 0–1. |
| 8 | Índices 0–2 | Índices 3–4. |
| 9 | Todos | No declarada; predeterminado solo servidor/a. |
| 10 | Ninguno | Todos. |
| 11 | Ninguno | Todos. |
| 12 | Todos | Todos. |

Los índices de esa tabla son base cero dentro de la lista de documentos de cada sección. El progreso personal se calcula sobre 42 documentos cargables que no son declaraciones. Los estados de sección que muestra la vista son `Pendiente`, `En proceso` y `Completado`; el estado de documento es `Pendiente` o `Registrado`.

## 6. Botones, acciones y flujos

### RR. HH.

- Buscar por DNI o nombre; seleccionar una persona y abrir su legajo.
- Cambiar entre `Documentos del legajo` y `Datos personales`.
- Seleccionar una sección; `‹ Volver a las secciones` retorna al índice.
- En las filas permitidas, `+ Cargar` / `Cambiar` selecciona un archivo. Si hay adjunto, puede visualizarse en nueva pestaña, descargarse o quitarse según el propietario.
- RR. HH. puede quitar únicamente sus propios adjuntos. Puede cargar documentos cuyo permiso incluye RR. HH.
- Los adjuntos subidos por empleado no aparecen a RR. HH. hasta que se envía la sección.

### Mi legajo

- Seleccionar cualquiera de las 12 secciones y volver a la lista con el contexto del legajo.
- Cambiar entre `Documentos` y, en la sección 1, `Datos personales`.
- `Subir` / `Cambiar` elige un archivo local. La vista permite visualizar y quitar adjuntos propios; los documentos marcados solo RR. HH. son de lectura para el/la servidor/a.
- `Enviar Documentos a RRHH` marca la sección como enviada si existe al menos un adjunto propio. Si no, muestra mensaje solicitando al menos un archivo. No requiere que estén cargados todos los documentos requeridos.
- En declaraciones, el selector habilita la carga solo con `Sí`; cambiar a otra respuesta quita el adjunto correspondiente.
- `Cancelar` descarta el borrador de edición personal en pantalla; `Guardar cambios` escribe los datos en almacenamiento local y muestra un mensaje.

### Modales

- No hay etiquetas `<dialog>` ni modales dentro de la plantilla Angular de Legajos.
- La maqueta complementaria sí contiene `confirm-dialog`, `employee-dialog` y `document-viewer-dialog`. Incluye flujos de confirmación, alta/edición de persona y visualización de documento; son elementos de la maqueta y no deben atribuirse al componente Angular.
- La guía existente recomienda estados Balsamiq para buscar sin resultados, confirmar eliminación/restauración, vista previa, archivo seleccionado y envío. Estas recomendaciones no prueban que esos diálogos estén implementados en Angular.

## 7. Servicios, persistencia y límites funcionales

| Archivo/servicio | Función observada |
|---|---|
| `LegajoPersonalDataStore` | Lee/guarda los cinco datos personales en `localStorage` con prefijo `hrayacucho-legajo-personal-data-`; notifica cambios entre pestañas vía evento `storage`; valida la forma de los datos. No realiza peticiones HTTP. |
| `LegajoFileStore` | Mantiene nombre de archivo, URL de objeto, fecha, propietario y marca de envío en estructuras en memoria. Revoca URL al reemplazar/quitar archivo. Los archivos no se envían a servidor ni se persisten al recargar. |
| `LegajoPersonalComponent` | Filtrado, selección de persona/sección, permisos, estado y progreso, declaraciones, validación de archivo, adjuntar/quitar, visualización/descarga local y envío demostrativo de sección. |

Validaciones de archivo: extensiones permitidas según arriba y tamaño máximo 10 MB. No se encontró comprobación de contenido MIME, endpoint de subida, descarga desde API, eliminación de documentos persistidos ni servicio de consulta/registro/actualización/eliminación de legajos.

## 8. Recursos visuales

- `logo-admin.png`: logotipo institucional usado por el shell y por la cabecera de preview.
- `photo-profile-male.jpg` y `photo-profile-female.jpg`: avatares de respaldo del shell de navegación cuando el perfil no aporta imagen.
- Los iconos de las 12 secciones proceden de `@fortawesome/free-solid-svg-icons`; el template también contiene SVG inline. No se encontraron recursos gráficos individuales para cada sección, capturas históricas del módulo, ni fuentes locales del módulo.
- La hoja SCSS del componente define la presentación principal. Usa Arial como fuente en componentes; el HTML de prototipo declara una pila que incluye Open Sans y alternativas de sistema.
- No se incluyeron fondos, iconos o fotos ajenos a la navegación de Legajos.

## 9. Dependencias compartidas incluidas y motivo

- `src/app/app.component.ts` / `.html`: raíz de Angular y punto de entrada `router-outlet`.
- `src/app/admin/components/nav/nav.component.ts` / `.html`: cabecera, menú lateral, carga de menú y enlace/vistas de Legajos.
- `src/app/admin/guards/auth-admin-person.guard.ts` y `src/app/core/services/token.service.ts`: acceso a la zona administrativa y verificación del token de aplicación.
- `src/styles.scss`: incluye globalmente el SCSS del componente Legajos y estilos base compartidos.
- `src/assets/images/logo-admin.png` y fotos genéricas de perfil: recursos usados por la navegación compartida.
- `angular.json` y `package.json`: muestran cómo se cargan estilos/assets y dependencias Angular/Font Awesome; se incluyen solo como contexto, sin instalar paquetes.

No se incluyeron `node_modules`, compilados, cachés, carpetas `.git`, archivos de environment, secretos, configuración de login, APIs genéricas de autenticación ni backend. El guard depende de valores de environment y de servicios del área de autenticación que no son necesarios para reconstruir las pantallas; no se copiaron sus configuraciones ni endpoints. No se encontró una dependencia de negocio de Legajos en otros frontends.

## 10. Documentación, rutas originales e índice de la entrega

La carpeta `ENTREGA_ARCHIVOS_LEGAJOS_CHATGPT` organiza cada archivo bajo la categoría indicada y conserva debajo la ruta relativa original del proyecto. No se duplican fuentes que sirvan a varias categorías; las referencias cruzadas se explican en este inventario.

### Archivos fuente y documentación preexistentes copiados

| Categoría | Ruta original | Función | Ruta dentro del ZIP |
|---|---|---|---|
| HTML y plantillas | `ADMIN_GENERAL_FE/src/app/app-admin/components/legajo-personal/legajo-personal.component.html` | Maquetación de las dos vistas, tablas, campos, pestañas, controles de archivo y estados. | `02_HTML_Y_PLANTILLAS/ADMIN_GENERAL_FE/src/app/app-admin/components/legajo-personal/legajo-personal.component.html` |
| TypeScript y lógica | `ADMIN_GENERAL_FE/src/app/app-admin/components/legajo-personal/legajo-personal.component.ts` (datos de ejemplo saneados en la copia) | Secciones, documentos, permisos, datos ficticios saneados, selección, filtros, carga, validaciones y estados. | `03_TYPESCRIPT_Y_LOGICA/ADMIN_GENERAL_FE/src/app/app-admin/components/legajo-personal/legajo-personal.component.ts` |
| Estilos | `ADMIN_GENERAL_FE/src/app/app-admin/components/legajo-personal/legajo-personal.component.scss` | Estilos específicos de la pantalla de Legajos. | `04_ESTILOS/ADMIN_GENERAL_FE/src/app/app-admin/components/legajo-personal/legajo-personal.component.scss` |
| Servicios de Legajos | `ADMIN_GENERAL_FE/src/app/app-admin/components/legajo-personal/legajo-personal-data-store.service.ts` | Interfaz `LegajoPersonData`, almacenamiento local de datos personales y notificación entre pestañas. | `06_SERVICIOS_Y_API/ADMIN_GENERAL_FE/src/app/app-admin/components/legajo-personal/legajo-personal-data-store.service.ts` |
| Servicios de Legajos | `ADMIN_GENERAL_FE/src/app/app-admin/components/legajo-personal/legajo-file-store.service.ts` | Metadatos de archivos, URLs de objeto, propietario y envío temporal por sección. | `06_SERVICIOS_Y_API/ADMIN_GENERAL_FE/src/app/app-admin/components/legajo-personal/legajo-file-store.service.ts` |
| Rutas | `ADMIN_GENERAL_FE/src/app/app-admin/app-admin.routes.ts` | Define las rutas `legajos` y `mi-legajo` que comparten el componente. | `07_RUTAS_Y_NAVEGACION/ADMIN_GENERAL_FE/src/app/app-admin/app-admin.routes.ts` |
| Rutas/preview | `ADMIN_GENERAL_FE/src/app/app.routes.ts` | Define el shell administrativo con guard y las rutas de preview de desarrollo. | `07_RUTAS_Y_NAVEGACION/ADMIN_GENERAL_FE/src/app/app.routes.ts` |
| Dependencia compartida | `ADMIN_GENERAL_FE/src/app/app.component.html` | Contenedor raíz con `router-outlet`. | `10_DEPENDENCIAS_COMPARTIDAS/ADMIN_GENERAL_FE/src/app/app.component.html` |
| Dependencia compartida | `ADMIN_GENERAL_FE/src/app/app.component.ts` | Componente raíz e inicialización del servicio de environment. | `10_DEPENDENCIAS_COMPARTIDAS/ADMIN_GENERAL_FE/src/app/app.component.ts` |
| Navegación compartida | `ADMIN_GENERAL_FE/src/app/admin/components/nav/nav.component.html` | Cabecera y menú lateral que hospedan la navegación de Legajos. | `10_DEPENDENCIAS_COMPARTIDAS/ADMIN_GENERAL_FE/src/app/admin/components/nav/nav.component.html` |
| Navegación compartida | `ADMIN_GENERAL_FE/src/app/admin/components/nav/nav.component.ts` | Carga el menú y agrega Legajos cuando falta; controla navegación y shell. | `10_DEPENDENCIAS_COMPARTIDAS/ADMIN_GENERAL_FE/src/app/admin/components/nav/nav.component.ts` |
| Acceso compartido | `ADMIN_GENERAL_FE/src/app/admin/guards/auth-admin-person.guard.ts` | Guardia de acceso al grupo de rutas administrativas. | `10_DEPENDENCIAS_COMPARTIDAS/ADMIN_GENERAL_FE/src/app/admin/guards/auth-admin-person.guard.ts` |
| Token compartido | `ADMIN_GENERAL_FE/src/app/core/services/token.service.ts` | Lectura de token de aplicación usado por el guard. | `10_DEPENDENCIAS_COMPARTIDAS/ADMIN_GENERAL_FE/src/app/core/services/token.service.ts` |
| Estilos compartidos | `ADMIN_GENERAL_FE/src/styles.scss` | Importa el SCSS de Legajos y estilos globales del frontend. | `10_DEPENDENCIAS_COMPARTIDAS/ADMIN_GENERAL_FE/src/styles.scss` |
| Configuración de assets/estilos | `ADMIN_GENERAL_FE/angular.json` | Configura la aplicación Angular, estilos globales y assets. | `10_DEPENDENCIAS_COMPARTIDAS/ADMIN_GENERAL_FE/angular.json` |
| Dependencias/versiones | `ADMIN_GENERAL_FE/package.json` | Identifica dependencias de Angular, Forms, Router e iconos. | `10_DEPENDENCIAS_COMPARTIDAS/ADMIN_GENERAL_FE/package.json` |
| Logotipo | `ADMIN_GENERAL_FE/src/assets/images/logo-admin.png` | Imagen institucional del shell de navegación y preview. | `09_RECURSOS_VISUALES/ADMIN_GENERAL_FE/src/assets/images/logo-admin.png` |
| Avatar genérico | `ADMIN_GENERAL_FE/src/assets/images/admin/photo-profile-male.jpg` | Avatar de respaldo del shell administrativo. | `09_RECURSOS_VISUALES/ADMIN_GENERAL_FE/src/assets/images/admin/photo-profile-male.jpg` |
| Avatar genérico | `ADMIN_GENERAL_FE/src/assets/images/admin/photo-profile-female.jpg` | Avatar de respaldo del shell administrativo. | `09_RECURSOS_VISUALES/ADMIN_GENERAL_FE/src/assets/images/admin/photo-profile-female.jpg` |
| Documentación existente | `GUIA_BALSAMIQ_LEGAJOS.md` | Especificación visual y funcional existente para Balsamiq. | `11_DOCUMENTACION/GUIA_BALSAMIQ_LEGAJOS.md` |
| Maqueta de apoyo (datos saneados) | `PROTOTIPO_LEGAJOS.html` | Prototipo autónomo con formularios, botones, diálogos e interacciones adicionales. | `11_DOCUMENTACION/PROTOTIPO_LEGAJOS.html` |

### Capturas generadas

Todas corresponden al preview local `http://127.0.0.1:4500`, sin enviar archivos ni guardar información. Los datos personales de demostración se desenfocaron:

- `12_CAPTURAS_DE_PANTALLA/01_rrhh_listado.png`
- `12_CAPTURAS_DE_PANTALLA/02_rrhh_datos_personales.png`
- `12_CAPTURAS_DE_PANTALLA/03_rrhh_documentos_seccion_01.png`
- `12_CAPTURAS_DE_PANTALLA/04_mi_legajo_documentos.png`
- `12_CAPTURAS_DE_PANTALLA/05_mi_legajo_datos_personales.png`

### Índices generados para categorías sin archivos fuente autónomos

- `01_COMPONENTES_Y_PANTALLAS/REFERENCIA.txt`: el componente de pantalla es el TypeScript listado en la categoría 03.
- `05_MODELOS_E_INTERFACES/REFERENCIA.txt`: tipos/modelos están embebidos en el componente y el servicio de datos personales.
- `08_TABLAS_Y_FORMULARIOS/REFERENCIA.txt`: tablas y controles se declaran en la plantilla HTML, no en archivos separados.
- `11_DOCUMENTACION/INVENTARIO_COMPLETO_LEGAJOS.md`: copia de este inventario dentro del ZIP.

## 11. Elementos no localizados o no verificables

- No se encontró servicio, contrato API, tabla de base de datos ni modelo de backend específico de Legajos; por ello no se puede documentar un flujo real de persistencia de documentos.
- No se encontró almacenamiento permanente de adjuntos, descarga/visualización remota ni estados conectados a un servidor.
- No se encontraron componentes Angular de modal de Legajos, historial, seguimiento, paginación, alta/baja de personal o controles de permiso basados en roles de autorización reales.
- Los datos del listado son declarados ficticios por la propia interfaz. Se saneó la copia entregada y no se adjuntó ningún dato personal de empleados.
- No se localizaron capturas preexistentes en el árbol de archivos; las cinco capturas de la entrega se generaron durante esta recopilación.
- Los previews fueron accesibles localmente; no fue necesario iniciar sesión ni acceder a pantallas productivas.
- La guía recomienda algunos estados de prototipo que no se observaron en Angular. Se documentan como propuestas de Balsamiq, no como comportamiento Angular comprobado.
- La configuración de environment fue deliberadamente excluida por seguridad; los valores de login y aplicación no se reprodujeron.
