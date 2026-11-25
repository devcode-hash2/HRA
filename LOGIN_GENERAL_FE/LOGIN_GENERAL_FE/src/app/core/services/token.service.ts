import { Injectable } from '@angular/core';
import { getCookie, setCookie, removeCookie } from 'typescript-cookie';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  private readonly MAIN_TOKEN_KEY = 'value-token';
  private readonly MAIN_REFRESH_TOKEN_KEY = 'value-refreshToken';
  private readonly APP_TOKEN_INDEX_KEY = 'value-app-token-ids';
  private idAppLogin: string = '';

  constructor() { }

  saveToken(value: string) {
    setCookie(this.MAIN_TOKEN_KEY, value, { expires: 1, path: '/' });
  }

  saveRefreshToken(value: string | undefined) {
    if (!value) {
      removeCookie(this.MAIN_REFRESH_TOKEN_KEY, { path: '/' });
      return;
    }
    setCookie(this.MAIN_REFRESH_TOKEN_KEY, value, { expires: 1, path: '/' });
  }

  saveTokenApp(value: string, idApp: string) {
    this.registerAppToken(idApp);
    setCookie(idApp, value, { expires: 1, path: '/' });
  }

  saveRefreshTokenApp(value: string, idApp: string) {
    const refreshTokenName = this.getRefreshTokenAppName(idApp);
    this.registerAppToken(idApp);
    setCookie(refreshTokenName, value, { expires: 1, path: '/' });
  }

  getToken() {
    return getCookie(this.MAIN_TOKEN_KEY);
  }

  getRefreshToken() {
    return getCookie(this.MAIN_REFRESH_TOKEN_KEY);
  }

  getTokenApp(idApp: string | null ) {
    return getCookie(idApp ?? '');
  }

  getRefreshTokenApp(idApp: string | null ) {
    if (!idApp) {
      return undefined;
    }
    return getCookie(this.getRefreshTokenAppName(idApp));
  }

  /**
   * Elimina solamente las credenciales primarias de sesión.
   * Se usa cuando se redirige a una app hija y se conservan sus cookies.
   */
  removeTokenListApp() {
    removeCookie(this.MAIN_TOKEN_KEY, { path: '/' });
    removeCookie(this.MAIN_REFRESH_TOKEN_KEY, { path: '/' });
  }

  /**
   * Elimina todas las credenciales de sesión (principal y apps).
   */
  removeAllSessionTokens() {
    const trackedAppIds = this.getTrackedAppTokenIds();

    this.removeTokenListApp();
    trackedAppIds.forEach((idApp) => this.removeTokenApp(idApp));
    removeCookie(this.APP_TOKEN_INDEX_KEY, { path: '/' });
  }

  /**
   * Elimina los tokens/cookies de una aplicación específica.
   * @param idApp Identificador de la aplicación
   */
  removeTokenApp(idApp: string) {
    removeCookie(idApp, { path: '/' });
    removeCookie(this.getRefreshTokenAppName(idApp), { path: '/' });
    removeCookie(`app${idApp}`, { path: '/' });
    this.unregisterAppToken(idApp);
  }

  /**
   * Decodifica de forma segura el payload de un JWT.
   */
  decodeJwtPayload(token: string | null | undefined): Record<string, unknown> | null {
    if (!token) {
      return null;
    }

    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }

    try {
      const base64Url = parts[1];
      const normalized = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
      const payload = atob(padded);
      const decoded = JSON.parse(payload);

      if (!decoded || typeof decoded !== 'object' || Array.isArray(decoded)) {
        return null;
      }
      return decoded as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  /**
   * Obtiene el `exp` (epoch seconds) de un JWT, si es válido.
   */
  getTokenExpirationEpochSeconds(token: string | null | undefined): number | null {
    const decoded = this.decodeJwtPayload(token);
    const exp = decoded?.['exp'];

    if (typeof exp !== 'number' || !Number.isFinite(exp)) {
      return null;
    }

    return exp;
  }

  /**
   * Determina si un JWT existe y no está expirado.
   */
  isTokenUsable(token: string | null | undefined): boolean {
    const expirationEpochSeconds = this.getTokenExpirationEpochSeconds(token);
    if (!expirationEpochSeconds) {
      return false;
    }
    return expirationEpochSeconds * 1000 > Date.now();
  }

  /**
   * Determina si la sesión principal (token de login general) es utilizable.
   */
  hasValidPrimarySession(): boolean {
    return this.isTokenUsable(this.getToken());
  }

  /**
   * Obtiene el id de la aplicación en la que se inició sesión.
   * @returns id de la aplicación
   */
  getIdAppLogin(): string {
    return this.idAppLogin;
  }

  /**
   * Establece el id de la aplicación en la que se inició sesión.
   * @param idAppLogin id de la aplicación
   */
  setIdAppLogin(idAppLogin: string): void {
    this.idAppLogin = idAppLogin;
  }

  private getRefreshTokenAppName(idApp: string): string {
    return `${idApp}-r`;
  }

  private getTrackedAppTokenIds(): string[] {
    const rawIds = getCookie(this.APP_TOKEN_INDEX_KEY);
    if (!rawIds) {
      return [];
    }

    return rawIds
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
  }

  private registerAppToken(idApp: string): void {
    const ids = new Set(this.getTrackedAppTokenIds());
    ids.add(idApp);
    setCookie(this.APP_TOKEN_INDEX_KEY, Array.from(ids).join(','), { expires: 1, path: '/' });
  }

  private unregisterAppToken(idApp: string): void {
    const ids = this.getTrackedAppTokenIds().filter((id) => id !== idApp);

    if (ids.length === 0) {
      removeCookie(this.APP_TOKEN_INDEX_KEY, { path: '/' });
      return;
    }

    setCookie(this.APP_TOKEN_INDEX_KEY, ids.join(','), { expires: 1, path: '/' });
  }
}
