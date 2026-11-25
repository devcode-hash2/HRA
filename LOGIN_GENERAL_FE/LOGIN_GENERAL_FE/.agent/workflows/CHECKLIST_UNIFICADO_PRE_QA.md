# Checklist Unificado Pre-QA (Frontend)

## 1. Entorno y configuracion
- [ ] Build de QA ejecutado sin errores (`npm run build:env -- calidad`).
- [ ] Variables de entorno QA correctas (API/LOGIN/FE host segun proyecto).
- [ ] `Server Type` detectado correctamente en consola.
- [ ] Sin warnings falsos de mismatch de entorno.

## 2. Autenticacion y sesion
- [ ] Login exitoso con credenciales validas.
- [ ] Manejo de cambio de contrasena respeta la secuencia esperada.
- [ ] Mensajes de error/validacion muestran texto correcto del backend.
- [ ] Logout y guardas de ruta funcionan sin regresion.

## 3. Grillas y scroll
- [ ] Sin scroll global inesperado en viewport principal.
- [ ] Scroll vertical solo dentro de la grilla.
- [ ] Scroll horizontal visible cuando el contenido excede ancho.
- [ ] Sin colision visual entre barras vertical/horizontal.
- [ ] Ultima fila visible completa (sin recorte).
- [ ] Cabecera alineada con columnas de datos.

## 4. Layout y UX
- [ ] Sin solape con navbar/header.
- [ ] Contenedor padre ocupa correctamente el area de trabajo.
- [ ] Dropdowns/modales no quedan recortados por overflow.
- [ ] Acciones de fila (ver/editar/menu) visibles y clicables.

## 5. Calidad tecnica
- [ ] Sin errores en consola bloqueantes.
- [ ] Sin archivos temporales o docs operativos fuera de `.agent/workflows`.
- [ ] README y docs alineados con cambios recientes.
- [ ] Lecciones aprendidas actualizadas cuando aplica.

## 6. Evidencia de cierre
- [ ] Capturas de pantallas criticas (login, grillas, scroll, formularios).
- [ ] Ruta de artefacto QA confirmada en `dist/`.
- [ ] Fecha y responsable de validacion registrados.
