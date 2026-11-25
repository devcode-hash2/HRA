---
description: Auditoria y fix del error 429 por bucle de autenticacion en apps consumidoras
---

# Workflow: Error 429 por Bucle de Autenticacion

Aplica a aplicaciones consumidoras que reciben usuarios desde `login-general`, no al propio `login-general`.

## Sintomas

- `429 Too Many Requests` en navegador
- recarga infinita entre login y dashboard
- saturacion de endpoints de sesion
- redirecciones repetidas al login central

## Causa comun

La app consumidora confunde la cookie marcador `app{id}` con la cookie real `{id}` que contiene el JWT.

| Cookie | Contenido | Uso correcto |
|--------|-----------|--------------|
| `{idApp}` | JWT | Autenticacion de API |
| `app{idApp}` | `"app"` | Solo marcador de sesion |

## Flujo del problema

1. `login-general` guarda la cookie JWT y la cookie marcador.
2. La app consumidora lee la cookie incorrecta o elimina el JWT al iniciar.
3. La app cree que no hay sesion y redirige al login central.
4. El login central detecta sesion valida y la devuelve.
5. Se genera el bucle y termina en `429`.

## Que auditar

- usos de `getTokenApp`, `saveTokenApp`, `removeTokenApp`
- `ngOnInit` de login o pantallas de entrada
- guards de autenticacion
- interceptores que hagan logout agresivo

## Patron incorrecto

```typescript
ngOnInit() {
  const tokenExist = this.tokenService.getTokenApp(environment.id_app);
  if (!tokenExist) {
    this.externalNavigationService.goToCentralLogin();
  }
}
```

El problema no es solo la redireccion: si antes se elimino el JWT o se evaluo la cookie marcador como token, el bucle queda garantizado.

## Patron correcto

```typescript
ngOnInit() {
  const tokenExist = this.tokenService.getTokenApp(environment.id_app) ?? '';
  const appNumber = sessionStorage.getItem('appNumber') ?? '';

  if (tokenExist === '' && appNumber === '') {
    return;
  }

  if (appNumber !== '') {
    this.router.navigate(['/dashboard']);
    return;
  }

  sessionStorage.setItem('appNumber', environment.id_app);
  this.router.navigate(['/dashboard']);
}
```

## Reglas

- No llamar `removeTokenApp()` en `ngOnInit`.
- No usar la cookie `app{id}` como token.
- El guard debe validar JWT usable, no solo existencia de cookie.
- El logout por `401` debe depender de causa real, no ser automatico en cualquier error.

## Verificacion

- limpiar cookies, `sessionStorage` y `localStorage`
- iniciar desde `login-general`
- recargar varias veces
- confirmar que no aparece `429`
- confirmar que existen cookie JWT y cookie marcador
