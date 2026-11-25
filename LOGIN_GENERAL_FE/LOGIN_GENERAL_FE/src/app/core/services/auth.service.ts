import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';
import { tap } from 'rxjs/operators';
import { TokenService } from '@services/token.service';
import { ResponseLogin, UpdateUser, ResponseListaApp, ResponseMenuApp, ResponseProfile, ResponseGetTokenApp, ResponseTimeNowServe } from '@models/auth.model';
// import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  apiUrl = environment.url_api;
  private readonly localLegajoReturnStorageKey = 'pending-local-legajo-return-url';
  private readonly localApplicationReturnUrls: Readonly<Record<string, string>> = {
    '1': 'http://localhost:4300/',
    '2': 'http://localhost:4500/mi-legajo'
  };
  // private router = inject(Router);

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
  ) { }

  login(v_user: string, v_password: string, v_ip: string) {
    return this.http.post<ResponseLogin>(`${this.apiUrl}/Authentication/PostLogin`, {
      v_user,
      v_password,
      v_ip
    })
    .pipe(
      tap(response => {
        this.tokenService.saveToken(response.value.access_Token);
        this.tokenService.saveRefreshToken(response.value.refresh_Token);
      })
    );
  }

  renewSession() {
    var v_ACCESS_TOKEN: string = this.tokenService.getToken() ?? '';
    var v_REFRESH_TOKEN: string = this.tokenService.getRefreshToken() ?? '';
    return this.http.post<ResponseLogin>(`${environment.url_api}/Authentication/Post_refresh_token`, {
      v_ACCESS_TOKEN,
      v_REFRESH_TOKEN
    }).pipe(
      tap(response => {
        this.tokenService.saveToken(response.value.access_Token);
        this.tokenService.saveRefreshToken(response.value.refresh_Token);
      })
    );
  }

  /**
   * Obtiene el token de una aplicación específica usando su id.
   * @param idApp Identificador de la aplicación
   * @returns Observable con el token de la app
   */
  getTokenApp(idApp: string) {
    var obj = {
      i_ID_APP: idApp
    }
    const token: string = this.tokenService.getToken() ?? '';
    return this.http.post<ResponseGetTokenApp>(`${environment.url_api}/Authentication/Post_token_app`, obj, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  /**
   * Decodifica el token JWT y obtiene información básica del usuario.
   * @returns Observable con los datos del usuario extraídos del token
   */
  getUserByToken() {
    const token = this.tokenService.getToken();
    const decoded = this.tokenService.decodeJwtPayload(token);

    if (!decoded) {
      return null;
    }

    const id = Number(decoded['IDUser']);
    if (!Number.isFinite(id)) {
      return null;
    }

    const userRaw = decoded['User_name'] ?? decoded['dniUser'] ?? '';
    const changepasswordRaw = decoded['Change_password'] ?? '';

    return of({
      id,
      user: String(userRaw),
      changepassword: String(changepasswordRaw)
    });
  }

  /**
   * Persiste el contexto de autenticación para una app específica.
   * Se usa desde login y listado para mantener el mismo criterio de apertura.
   */
  storeAppSession(token: string, idApp: string): void {
    this.tokenService.saveTokenApp(token, idApp);
    this.tokenService.saveTokenApp('app', `app${idApp}`);
    this.tokenService.setIdAppLogin(idApp);
  }

  rememberLocalAppReturnUrl(returnUrl: string | null): void {
    const allowedReturnUrl = Object.values(this.localApplicationReturnUrls)
      .find(url => url === returnUrl);
    if (
      window.location.hostname !== 'localhost' ||
      !allowedReturnUrl
    ) {
      sessionStorage.removeItem(this.localLegajoReturnStorageKey);
      return;
    }

    sessionStorage.setItem(this.localLegajoReturnStorageKey, allowedReturnUrl);
  }

  consumeLocalAppReturnUrl(idApp: string): string | null {
    const localReturnUrl = this.localApplicationReturnUrls[idApp];
    if (!localReturnUrl || window.location.hostname !== 'localhost') {
      return null;
    }

    const returnUrl = sessionStorage.getItem(this.localLegajoReturnStorageKey);
    sessionStorage.removeItem(this.localLegajoReturnStorageKey);
    return returnUrl === localReturnUrl ? returnUrl : localReturnUrl;
  }

  /**
   * Obtiene el perfil del usuario para el listado de aplicaciones.
   * @param idUser ID del usuario
   * @returns Observable con el perfil del usuario
   */
  getProfileListApp(idUser: number){
    const token: string = this.tokenService.getToken() ?? '';

    return this.http.get<ResponseProfile>(`${this.apiUrl}/Authentication/Get_user_profile?I_ID_USER=${idUser}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }}
    );
  }

  /**
   * Obtiene la hora actual del servidor.
   * @returns Observable con la hora del servidor
   */
  getServerTime(): Observable<ResponseTimeNowServe> {
    return this.http.get<ResponseTimeNowServe>(`${this.apiUrl}/Authentication/Get_time_server`);
  }

  /**
   * Obtiene el listado de aplicaciones disponibles para el usuario.
   * @param idUser ID del usuario
   * @returns Observable con el listado de aplicaciones
   */
  getListadoApps(idUser: number) {
    const token: string = this.tokenService.getToken() ?? '';
      return this.http.get<ResponseListaApp>(`${this.apiUrl}/Application/Get_lista_app?V_ID_USER=${idUser}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  }

  /**
   * Actualiza la contraseña del usuario.
   * @param dto Objeto con los datos de cambio de contraseña
   * @returns Observable con la respuesta del backend
   */
  updateUser(dto: UpdateUser) {
    const token: string = this.tokenService.getToken() ?? '';
    return this.http.post<UpdateUser>(`${this.apiUrl}/Authentication/Post_change_password`, dto, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  /**
   * Elimina los tokens de todas las aplicaciones (logout global).
   */
  logoutListApp() {
    this.tokenService.removeAllSessionTokens();
  }

  /**
   * Indica si existe una sesión principal válida.
   */
  hasValidSession(): boolean {
    return this.tokenService.hasValidPrimarySession();
  }
}
