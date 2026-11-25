---
description: Estilo de Modal con Botón Cerrar Centrado en Vértice
---

# Estilo de Modal: Botón Cerrar en Vértice

## Objetivo
Posicionar el botón de cerrar de un modal de forma que su centro esté exactamente en el vértice superior derecho del contenedor, creando un efecto visual de "botón flotante".

## Resultado Visual
```
         ┌──────────────────────────┐
      ╭──┼──╮                       │   ← Botón centrado en vértice
      │  X  │   TÍTULO DEL MODAL    │
      ╰──┼──╯                       │
         │                          │
         │      Contenido...        │
         │                          │
         └──────────────────────────┘
```

## Implementación

### 1. Container del Modal
```html
<div class="... relative overflow-visible">
```
> **Importante**: `overflow-visible` permite que el botón sobresalga del contenedor.

### 2. Botón Cerrar
```html
<button class="absolute -top-3 -right-3 z-20 bg-red-400 hover:bg-red-500 
               text-white border shadow-lg font-bold p-0.5 border-red-500 
               rounded-full text-lg transition-transform hover:scale-110">
  <fa-icon [icon]="faXmark" class="block w-7 h-7"></fa-icon>
</button>
```

### Claves de Posicionamiento
| Clase | Valor | Propósito |
|-------|-------|-----------|
| `-top-3` | -0.75rem (-12px) | Sube el botón para que su centro esté en el borde |
| `-right-3` | -0.75rem (-12px) | Mueve el botón a la derecha para centrar en esquina |
| `z-20` | z-index: 20 | Asegura que el botón esté sobre otros elementos |

### Cálculo del Offset
- Tamaño del botón: `w-7 h-7` ≈ 28px + padding
- Offset necesario: ~50% del tamaño = -14px ≈ `-top-3.5`
- Ajuste práctico: `-top-3 -right-3` (12px) funciona visualmente bien

## Archivo Afectado
- `src/app/admin/components/modal-first/modal-first.component.html`

## Errores Comunes a Evitar
1. ❌ Usar `overflow-hidden` en el container (cortará el botón)
2. ❌ Olvidar `relative` en el contenedor padre
3. ❌ Valores de offset muy grandes que saquen completamente el botón

## Verificación
1. Ejecutar `ng serve`
2. Abrir cualquier modal en la aplicación
3. Verificar que el botón X esté centrado en la esquina superior derecha
4. Verificar hover effect (escala al 110%)
