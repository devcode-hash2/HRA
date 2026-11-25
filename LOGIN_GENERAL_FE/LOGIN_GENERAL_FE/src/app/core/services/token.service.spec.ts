import { TestBed } from '@angular/core/testing';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenService);
    service.removeAllSessionTokens();
  });

  it('removes all session credentials on global logout', () => {
    service.saveToken('main-token');
    service.saveRefreshToken('main-refresh');
    service.saveTokenApp('app-token-1', '1');
    service.saveRefreshTokenApp('app-refresh-1', '1');
    service.saveTokenApp('app-token-2', '2');

    service.removeAllSessionTokens();

    expect(service.getToken()).toBeUndefined();
    expect(service.getRefreshToken()).toBeUndefined();
    expect(service.getTokenApp('1')).toBeUndefined();
    expect(service.getRefreshTokenApp('1')).toBeUndefined();
    expect(service.getTokenApp('2')).toBeUndefined();
  });

  it('returns false for corrupted or expired tokens', () => {
    expect(service.isTokenUsable('invalid-token')).toBeFalse();

    const expiredPayload = btoa(JSON.stringify({ exp: 1 }));
    const expiredToken = `header.${expiredPayload}.sig`;
    expect(service.isTokenUsable(expiredToken)).toBeFalse();
  });
});
