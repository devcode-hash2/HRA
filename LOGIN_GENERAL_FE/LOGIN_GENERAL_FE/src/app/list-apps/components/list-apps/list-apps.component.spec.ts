import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '@services/auth.service';
import { ExternalNavigationService } from '@services/external-navigation.service';
import { TokenService } from '@services/token.service';

import { ListAppsComponent } from './list-apps.component';

describe('ListAppsComponent', () => {
  let component: ListAppsComponent;
  let fixture: ComponentFixture<ListAppsComponent>;

  const authServiceMock = {
    getUserByToken: jasmine.createSpy('getUserByToken').and.returnValue(of({
      id: 1,
      user: 'test',
      changepassword: 'False'
    })),
    getServerTime: jasmine.createSpy('getServerTime').and.returnValue(of({ value: Math.floor(Date.now() / 1000) })),
    getProfileListApp: jasmine.createSpy('getProfileListApp').and.returnValue(of({ value: { image: null, sex: 1 } })),
    getListadoApps: jasmine.createSpy('getListadoApps').and.returnValue(of({ value: [] })),
    getTokenApp: jasmine.createSpy('getTokenApp').and.returnValue(of({ value: 'app-token' })),
    storeAppSession: jasmine.createSpy('storeAppSession'),
    consumeLocalAppReturnUrl: jasmine.createSpy('consumeLocalAppReturnUrl').and.returnValue(null),
    renewSession: jasmine.createSpy('renewSession').and.returnValue(of({})),
    updateUser: jasmine.createSpy('updateUser'),
    logoutListApp: jasmine.createSpy('logoutListApp')
  };

  const tokenServiceMock = {
    getToken: jasmine.createSpy('getToken').and.returnValue('header.payload.signature'),
    decodeJwtPayload: jasmine.createSpy('decodeJwtPayload').and.returnValue({ exp: Math.floor(Date.now() / 1000) + 60 }),
    getTokenExpirationEpochSeconds: jasmine.createSpy('getTokenExpirationEpochSeconds').and.returnValue(Math.floor(Date.now() / 1000) + 60),
    getTokenApp: jasmine.createSpy('getTokenApp').and.returnValue(undefined)
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
    authServiceMock.getServerTime.calls.reset();
    authServiceMock.getProfileListApp.calls.reset();
    authServiceMock.getListadoApps.calls.reset();
    authServiceMock.getTokenApp.calls.reset();
    authServiceMock.storeAppSession.calls.reset();
    authServiceMock.consumeLocalAppReturnUrl.calls.reset();
    authServiceMock.consumeLocalAppReturnUrl.and.returnValue(null);
    authServiceMock.renewSession.calls.reset();
    authServiceMock.updateUser.calls.reset();
    authServiceMock.logoutListApp.calls.reset();
    tokenServiceMock.getToken.calls.reset();
    tokenServiceMock.decodeJwtPayload.calls.reset();
    tokenServiceMock.getTokenExpirationEpochSeconds.calls.reset();
    tokenServiceMock.getTokenApp.calls.reset();
    routerMock.navigate.calls.reset();
    toastrMock.error.calls.reset();
    toastrMock.success.calls.reset();
    toastrMock.warning.calls.reset();
    externalNavigationServiceMock.openInNewTab.calls.reset();
    externalNavigationServiceMock.openInSameTab.calls.reset();

    await TestBed.configureTestingModule({
      imports: [ListAppsComponent],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: TokenService, useValue: tokenServiceMock },
        { provide: ExternalNavigationService, useValue: externalNavigationServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ToastrService, useValue: toastrMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ListAppsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('fills displayed role from first app in list', () => {
    authServiceMock.getListadoApps.and.returnValue(of({
      value: [
        { aplicaciones: { id_app: '1', url: 'https://app', application: 'APP', acronym: 'APP', image: null, ruta: null, rol: 'ADMIN' } }
      ]
    }));

    component.ngOnInit();

    expect(component.displayedRole).toBe('ADMIN');
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

  it('opens app and stores app session from list', () => {
    tokenServiceMock.getTokenApp.and.returnValue(undefined);

    component.openAppByToken('https://app', '1');

    expect(authServiceMock.getTokenApp).toHaveBeenCalledWith('1');
    expect(authServiceMock.storeAppSession).toHaveBeenCalledWith('app-token', '1');
    expect(externalNavigationServiceMock.openInNewTab).toHaveBeenCalledWith('https://app');
  });

  it('returns to the local Legajos form after selecting app 2', () => {
    const localLegajoUrl = 'http://localhost:4500/mi-legajo';
    authServiceMock.consumeLocalAppReturnUrl.and.returnValue(localLegajoUrl);

    component.openAppByToken('https://deployed-app', '2');

    expect(authServiceMock.storeAppSession).toHaveBeenCalledWith('app-token', '2');
    expect(externalNavigationServiceMock.openInSameTab).toHaveBeenCalledWith(localLegajoUrl);
    expect(externalNavigationServiceMock.openInNewTab).not.toHaveBeenCalled();
  });
});
