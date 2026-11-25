import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@services/auth.service';

export const authLoginGeneralGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.hasValidSession()) {
    authService.logoutListApp();
    router.navigate(['/']);
    return false;
  }

  return true;
};
