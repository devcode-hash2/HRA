import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '@services/auth.service';
import { ExternalNavigationService } from '@services/external-navigation.service';

import { LoginFormComponent } from './login-form.component';

describe('LoginFormComponent', () => {
  let component: LoginFormComponent;
  let fixture: ComponentFixture<LoginFormComponent>;

  const authServiceMock = {
    getUserByToken: jasmine.createSpy('getUserByToken').and.returnValue(of({
      id: 1,
      user: 'test',
      changepassword: 'False'
    })),
    login: jasmine.createSpy('login').and.returnValue(of({})),
    getListadoApps: jasmine.createSpy('getListadoApps').and.returnValue(of({ value: [] })),
    getTokenApp: jasmine.createSpy('getTokenApp').and.returnValue(of({ value: 'app-token' })),
    storeAppSession: jasmine.createSpy('storeAppSession'),
    rememberLocalAppReturnUrl: jasmine.createSpy('rememberLocalAppReturnUrl'),
    consumeLocalAppReturnUrl: jasmine.createSpy('consumeLocalAppReturnUrl').and.returnValue(null),
    updateUser: jasmine.createSpy('updateUser').and.returnValue(of({})),
    logoutListApp: jasmine.createSpy('logoutListApp')
  };

  const routerMock = { navigate: jasmine.createSpy('navigate') };
  const externalNavigationServiceMock = {
    openInNewTab: jasmine.createSpy('openInNewTab'),
    openInSameTab: jasmine.createSpy('openInSameTab')
  };
  const toastrMock = {
    error: jasmine.createSpy('error'),
    success: jasmine.createSpy('success'),
    warning: jasmine.createSpy('warning')
  };

  beforeEach(async () => {
    authServiceMock.getUserByToken.calls.reset();
    authServiceMock.getUserByToken.and.returnValue(of({
      id: 1,
      user: 'test',
      changepassword: 'False'
    }));
    authServiceMock.login.calls.reset();
    authServiceMock.login.and.returnValue(of({}));
    authServiceMock.getListadoApps.calls.reset();
    authServiceMock.getTokenApp.calls.reset();
    authServiceMock.storeAppSession.calls.reset();
    authServiceMock.rememberLocalAppReturnUrl.calls.reset();
    authServiceMock.consumeLocalAppReturnUrl.calls.reset();
    authServiceMock.consumeLocalAppReturnUrl.and.returnValue(null);
    authServiceMock.updateUser.calls.reset();
    authServiceMock.updateUser.and.returnValue(of({}));
    authServiceMock.logoutListApp.calls.reset();
    routerMock.navigate.calls.reset();
    externalNavigationServiceMock.openInNewTab.calls.reset();
    externalNavigationServiceMock.openInSameTab.calls.reset();
    toastrMock.error.calls.reset();
    toastrMock.success.calls.reset();
    toastrMock.warning.calls.reset();

    await TestBed.configureTestingModule({
      imports: [LoginFormComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: ExternalNavigationService, useValue: externalNavigationServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ToastrService, useValue: toastrMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('navigates to list when user has multiple apps', () => {
    authServiceMock.getUserByToken.and.returnValue(of({
      id: 1,
      user: 'test',
      changepassword: 'False'
    }));
    authServiceMock.getListadoApps.and.returnValue(of({
      value: [
        { aplicaciones: { id_app: '1', url: 'https://a', application: 'A', acronym: 'A', image: null, ruta: null, rol: 'R1' } },
        { aplicaciones: { id_app: '2', url: 'https://b', application: 'B', acronym: 'B', image: null, ruta: null, rol: 'R2' } }
      ]
    }));

    component.formLogin.setValue({ v_user: 'user1', v_password: 'pass1', v_ip: '' });
    component.login();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/list-app']);
  });

  it('opens app directly when user has only one app', () => {
    authServiceMock.getUserByToken.and.returnValue(of({
      id: 1,
      user: 'test',
      changepassword: 'False'
    }));
    authServiceMock.getListadoApps.and.returnValue(of({
      value: [
        { aplicaciones: { id_app: '10', url: 'https://only-app', application: 'APP', acronym: 'APP', image: null, ruta: null, rol: 'ROL' } }
      ]
    }));

    component.formLogin.setValue({ v_user: 'user1', v_password: 'pass1', v_ip: '' });
    component.login();

    expect(authServiceMock.getTokenApp).toHaveBeenCalledWith('10');
    expect(externalNavigationServiceMock.openInSameTab).toHaveBeenCalledWith('https://only-app');
  });

  it('returns to the local Legajos form after obtaining app 2 token', () => {
    const localLegajoUrl = 'http://localhost:4500/mi-legajo';
    authServiceMock.consumeLocalAppReturnUrl.and.returnValue(localLegajoUrl);

    component.openAppByToken('2', 'https://deployed-app');

    expect(authServiceMock.storeAppSession).toHaveBeenCalledWith('app-token', '2');
    expect(externalNavigationServiceMock.openInSameTab).toHaveBeenCalledWith(localLegajoUrl);
    expect(externalNavigationServiceMock.openInSameTab).not.toHaveBeenCalledWith('https://deployed-app');
  });

  it('opens password-change modal when backend indicates forced password change', () => {
    authServiceMock.getUserByToken.and.returnValue(of({
      id: 1,
      user: 'test',
      changepassword: 'True'
    }));
    authServiceMock.getListadoApps.and.returnValue(of({
      value: [
        { aplicaciones: { id_app: '10', url: 'https://only-app', application: 'APP', acronym: 'APP', image: null, ruta: null, rol: 'ROL' } }
      ]
    }));

    component.formLogin.setValue({ v_user: 'user1', v_password: 'pass1', v_ip: '' });
    component.login();

    expect(component.modalChangePasswOpen).toBeTrue();
    expect(authServiceMock.getListadoApps).toHaveBeenCalled();
  });

  it('does not open app before password change when changepassword is true and only one app exists', () => {
    const openSpy = spyOn(component, 'openAppByToken');
    authServiceMock.getUserByToken.and.returnValue(of({
      id: 1,
      user: 'test',
      changepassword: 'True'
    }));
    authServiceMock.getListadoApps.and.returnValue(of({
      value: [
        { aplicaciones: { id_app: '10', url: 'https://only-app', application: 'APP', acronym: 'APP', image: null, ruta: null, rol: 'ROL' } }
      ]
    }));

    component.formLogin.setValue({ v_user: 'user1', v_password: 'pass1', v_ip: '' });
    component.login();

    expect(component.modalChangePasswOpen).toBeTrue();
    expect(openSpy).not.toHaveBeenCalled();
  });

  it('opens password-change modal when changepassword comes as lowercase true', () => {
    authServiceMock.getUserByToken.and.returnValue(of({
      id: 1,
      user: 'test',
      changepassword: 'true'
    }));

    component.formLogin.setValue({ v_user: 'user1', v_password: 'pass1', v_ip: '' });
    component.login();

    expect(component.modalChangePasswOpen).toBeTrue();
    expect(authServiceMock.getListadoApps).toHaveBeenCalled();
  });

  it('after password change, opens the single app when pending target is single-app', () => {
    const openSpy = spyOn(component, 'openAppByToken');
    authServiceMock.getUserByToken.and.returnValue(of({
      id: 1,
      user: 'test',
      changepassword: 'True'
    }));
    authServiceMock.getListadoApps.and.returnValue(of({
      value: [
        { aplicaciones: { id_app: '10', url: 'https://only-app', application: 'APP', acronym: 'APP', image: null, ruta: null, rol: 'ROL' } }
      ]
    }));

    component.formLogin.setValue({ v_user: 'user1', v_password: 'pass1', v_ip: '' });
    component.login();
    component.formChangePassw.setValue({
      passwordOld: 'old-pass',
      passwordNew: 'new-pass',
      passwordNewRep: 'new-pass'
    });
    component.saveChangePassword();

    expect(openSpy).toHaveBeenCalledWith('10', 'https://only-app');
  });

  it('reauthenticates with the new password before post-change navigation', () => {
    authServiceMock.getUserByToken.and.returnValue(of({
      id: 1,
      user: 'test',
      changepassword: 'True'
    }));
    authServiceMock.getListadoApps.and.returnValue(of({
      value: [
        { aplicaciones: { id_app: '10', url: 'https://only-app', application: 'APP', acronym: 'APP', image: null, ruta: null, rol: 'ROL' } }
      ]
    }));

    component.formLogin.setValue({ v_user: 'user1', v_password: 'old-pass', v_ip: '127.0.0.1' });
    component.login();
    component.formChangePassw.setValue({
      passwordOld: 'old-pass',
      passwordNew: 'new-pass',
      passwordNewRep: 'new-pass'
    });
    component.saveChangePassword();

    expect(authServiceMock.login).toHaveBeenCalledWith('user1', 'new-pass', '127.0.0.1');
  });

  it('after password change, goes to list when pending target is list-app', () => {
    authServiceMock.getUserByToken.and.returnValue(of({
      id: 1,
      user: 'test',
      changepassword: 'True'
    }));
    authServiceMock.getListadoApps.and.returnValue(of({
      value: [
        { aplicaciones: { id_app: '1', url: 'https://a', application: 'A', acronym: 'A', image: null, ruta: null, rol: 'R1' } },
        { aplicaciones: { id_app: '2', url: 'https://b', application: 'B', acronym: 'B', image: null, ruta: null, rol: 'R2' } }
      ]
    }));

    component.formLogin.setValue({ v_user: 'user1', v_password: 'pass1', v_ip: '' });
    component.login();
    component.formChangePassw.setValue({
      passwordOld: 'old-pass',
      passwordNew: 'new-pass',
      passwordNewRep: 'new-pass'
    });
    component.saveChangePassword();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/list-app']);
  });

  it('does not submit password change when confirmation does not match', () => {
    component.userIdFromToken = 1;
    component.formChangePassw.setValue({
      passwordOld: 'old-pass',
      passwordNew: 'new-pass-1',
      passwordNewRep: 'new-pass-2'
    });

    component.saveChangePassword();

    expect(component.passwordDistinct).toBeTrue();
    expect(authServiceMock.updateUser).not.toHaveBeenCalled();
  });
});
