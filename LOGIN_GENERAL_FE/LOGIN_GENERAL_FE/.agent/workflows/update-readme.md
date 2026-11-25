---
description: Guia para mantener README.md alineado con el estado real del repositorio
---

# Workflow: Actualizar README

El README debe reflejar el comportamiento real del repo, no supuestos historicos.

## Cuando actualizar

Actualizar inmediatamente si cambia cualquiera de estos puntos:

- scripts de `build`, `build:env`, `deploy`, `verify`, `validate`
- matriz de hosts `DEV`, `QA`, `PROD`
- rutas `BASE_HREF`, `outputPath`, `remotePath`
- flujo de login, sesion o logout
- estructura documental (`docs`, `.agent/workflows`, `.agent/docs`)

## Secciones minimas del README

1. Descripcion corta del proyecto
2. Scripts principales
3. Build por entorno
4. Verificacion y tests
5. Deploy
6. Estructura funcional
7. Estado de sesion y seguridad
8. Matriz oficial de hosts
9. Estructura documental
10. Referencias rapidas

## Reglas

- No documentar comandos inexistentes.
- No documentar deploy QA/PROD como habilitado si sigue bloqueado.
- No asumir que `API` y `Front` comparten host.
- No usar ejemplos con variables de entorno obsoletas.
- Mantener una sola fuente de verdad para la matriz de entornos.

## Plantilla minima de variables de entorno

```typescript
{
  production: false,
  url_api: 'http://10.100.6.24:9093',
  id_app: '4'
}
```

Si el satelite no usa `id_app`, no debe inventarse en el ejemplo.

## Checklist rapido

- [ ] `npm run build` descrito como deterministico
- [ ] comandos `workflow:*` documentados si existen
- [ ] hosts y hostnames actualizados
- [ ] referencias a archivos reales, no rotas
- [ ] README alineado con `package.json` y `scripts/`
