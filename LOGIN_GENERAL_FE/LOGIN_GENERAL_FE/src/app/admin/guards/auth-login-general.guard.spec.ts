import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@services/auth.service';

import { authLoginGeneralGuard } from './auth-login-general.guard';

describe('authLoginGeneralGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authLoginGeneralGuard(...guardParameters));

  const authServiceMock = {
    hasValidSession: jasmine.createSpy('hasValidSession'),
    logoutListApp: jasmine.createSpy('logoutListApp')
  };

  const routerMock = {
    navigate: jasmine.createSpy('navigate')
  };

  beforeEach(() => {
    authServiceMock.hasValidSession.calls.reset();
    authServiceMock.logoutListApp.calls.reset();
    routerMock.navigate.calls.reset();

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    });
  });

  it('allows navigation when session is valid', () => {
    authServiceMock.hasValidSession.and.returnValue(true);

    const canActivate = executeGuard({} as any, {} as any);

    expect(canActivate).toBeTrue();
    expect(routerMock.navigate).not.toHaveBeenCalled();
    expect(authServiceMock.logoutListApp).not.toHaveBeenCalled();
  });

  it('redirects to login when session is invalid', () => {
    authServiceMock.hasValidSession.and.returnValue(false);

    const canActivate = executeGuard({} as any, {} as any);

    expect(canActivate).toBeFalse();
    expect(authServiceMock.logoutListApp).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
  });
});
