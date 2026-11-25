import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';

describe('AuthService local application navigation', () => {
  let service: AuthService;

  beforeEach(() => {
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: HttpClient, useValue: {} },
        { provide: TokenService, useValue: {} }
      ]
    });

    service = TestBed.inject(AuthService);
  });

  afterEach(() => sessionStorage.clear());

  it('opens the local Personnel frontend for app 1 from the local login', () => {
    expect(window.location.hostname).toBe('localhost');
    expect(service.consumeLocalAppReturnUrl('1')).toBe('http://localhost:4300/');
  });

  it('opens local Legajos for app 2 from the local login', () => {
    expect(service.consumeLocalAppReturnUrl('2')).toBe('http://localhost:4500/mi-legajo');
  });

  it('does not override the destination for other applications', () => {
    expect(service.consumeLocalAppReturnUrl('3')).toBeNull();
  });

  it('consumes only the allowed local return URL', () => {
    sessionStorage.setItem('pending-local-legajo-return-url', 'http://localhost:4500/mi-legajo');

    expect(service.consumeLocalAppReturnUrl('2')).toBe('http://localhost:4500/mi-legajo');
    expect(sessionStorage.getItem('pending-local-legajo-return-url')).toBeNull();
  });

  it('uses the requested local return only when it matches the selected application', () => {
    sessionStorage.setItem('pending-local-legajo-return-url', 'http://localhost:4500/mi-legajo');

    expect(service.consumeLocalAppReturnUrl('1')).toBe('http://localhost:4300/');
    expect(sessionStorage.getItem('pending-local-legajo-return-url')).toBeNull();
  });
});
