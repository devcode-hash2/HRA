import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ModalFirstComponent } from '../../../admin/components/modal-first/modal-first.component';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@services/auth.service';
import { ApiErrorMessageService } from '@services/api-error-message.service';
import { ExternalNavigationService } from '@services/external-navigation.service';
import { PasswordChangeHelperService } from '@services/password-change-helper.service';
import { Profile, UpdateUser, UserByToken, valueListApp } from '@models/auth.model';
import { ToastrService } from 'ngx-toastr';
import { faArrowRightFromBracket, faEye, faEyeSlash, faFloppyDisk, faLock, faUser, faXmark } from '@fortawesome/free-solid-svg-icons';
import { TokenService } from '@services/token.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-list-apps',
  imports: [FontAwesomeModule, CommonModule, ModalFirstComponent, ReactiveFormsModule],
  templateUrl: './list-apps.component.html',
  styleUrl: './list-apps.component.scss'
})
export class ListAppsComponent implements OnInit {
  faXmark = faXmark;
  faLock = faLock;
  faUser = faUser;
  faArrowRightFromBracket = faArrowRightFromBracket;
  faFloppyDisk = faFloppyDisk;
  faEyeSlash = faEyeSlash;
  faEye = faEye;

  timeLeft: number = 60;
  isRunning: boolean = false;

  private authService = inject(AuthService);
  private apiErrorMessageService = inject(ApiErrorMessageService);
  public toastrService = inject(ToastrService);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);
  private tokenService = inject(TokenService);
  private externalNavigationService = inject(ExternalNavigationService);
  private passwordChangeHelperService = inject(PasswordChangeHelperService);
  public imgb64 = inject(DomSanitizer);

  @ViewChild('passwordOldInput') passwordOldInput?: ElementRef<HTMLInputElement>;

  profile?: Profile;
  displayedRole: string = '';
  modalProfileOpen: boolean = false;
  modalConfirmSessionOpen: boolean = false;
  stateNav: boolean = false;
  activeMenuUser: boolean = false;
  modalChangePasswOpen: boolean = false;
  imageAplication: SafeResourceUrl | null = null;

  loading = false;
  hidePassOld = true;
  hidePassNew = true;
  hidePassNewRep = true;

  userByToken?: UserByToken;
  imgperfil: any;
  valueListApp: valueListApp[] = [];
  passwordDistinct: boolean = false;
  loadingIsOpen: boolean = false;
  msgConexionSession: string = "";

  userIdFromToken?: number;

  private timerSubscription?: Subscription;

  // Cache de apps que ya tienen token obtenido en esta sesión
  private tokenCache: Set<string> = new Set();
  // Timestamp de la última petición exitosa (para cooldown)
  private lastRequestTime: number = 0;
  // Cooldown entre peticiones en ms (para respetar rate limiting del servidor)
  private readonly REQUEST_COOLDOWN_MS = 2000;

  // sesionApp = setTimeout(() => this.openModalConfirmSession(), this.authService.isTokenExpiredApp());
  sesionApp: any;

  /**
   * Inicializa el componente, obtiene datos del usuario y carga el perfil y las aplicaciones.
   * NOTA: Las llamadas HTTP se encadenan para evitar race conditions.
   */
  ngOnInit(): void {
    this.loadingIsOpen = true;
    const userByToken$ = this.authService.getUserByToken();

    if (!userByToken$) {
      this.loadingIsOpen = false;
      this.logoutListAppMsg();
      return;
    }

    this.setupAutoLogout();

    // Primero obtenemos los datos del usuario del token
    userByToken$.subscribe({
      next: (data) => {
        this.userByToken = data;
        this.userIdFromToken = data.id;

        const userId = Number(data.id);

        // Ahora que tenemos el ID del usuario, hacemos las llamadas dependientes
        this.loadProfile(userId);
        this.loadApps(userId);
      },
      error: (error) => {
        this.loadingIsOpen = false;
        const message = this.apiErrorMessageService.extract(error, 'Error al obtener datos del usuario');
        this.toastrService.error(message, 'Single-Sign', { timeOut: 3200 });
      }
    });
  }

  /**
   * Carga el perfil del usuario.
   * @param userId ID del usuario
   */
  private loadProfile(userId: number): void {
    this.authService.getProfileListApp(userId).subscribe({
      next: (data) => {
        this.profile = data.value;

        if (this.profile.image != null) {
          this.imgperfil = this.imgb64.bypassSecurityTrustResourceUrl(`data:image/png;base64, ${this.profile.image}`);
        } else {
          if (this.profile.sex == 1) {
            this.imgperfil = 'assets/images/admin/photo-profile-male.jpg';
          }
          if (this.profile.sex == 2) {
            this.imgperfil = 'assets/images/admin/photo-profile-female.jpg';
          }
        }
      },
      error: (error) => {
        const message = this.apiErrorMessageService.extract(error, 'Error al cargar perfil');
        this.toastrService.error(message, 'Single-Sign', { timeOut: 3200 });
      }
    });
  }

  /**
   * Carga el listado de aplicaciones del usuario.
   * @param userId ID del usuario
   */
  private loadApps(userId: number): void {
    this.authService.getListadoApps(userId).subscribe({
      next: (resp) => {
        this.loadingIsOpen = false;
        this.valueListApp = resp.value;
        this.displayedRole = resp.value?.[0]?.aplicaciones?.rol ?? '';
      },
      error: (error) => {
        this.loadingIsOpen = false;
        const message = this.apiErrorMessageService.extract(error, 'Error al cargar aplicaciones');
        this.toastrService.error(message, 'Single-Sign', { timeOut: 3200 });
      }
    });
  }

  /**
   * Configura el cierre automático de sesión según el tiempo del servidor y expiración del token.
   */
  setupAutoLogout(): void {
    this.loading = true;
    this.authService.getServerTime().subscribe(response => {
      this.loading = false;
      const serverTime = response.value;
      const tokenApp = this.tokenService.getToken() ?? '';

      if (!this.tokenService.decodeJwtPayload(tokenApp)) {
        this.logoutListAppMsg();
        return;
      }

      const timeRemaining = this.isTokenExpiredApp(serverTime, tokenApp);

      if (timeRemaining > 0) {
        this.sesionApp = setTimeout(() => { this.openModalConfirmSession(); }, timeRemaining);
      } else {
        this.openModalConfirmSession();
      }
    });
  }

  /**
   * Calcula el tiempo restante antes de que expire el token de la app.
   * @param serverTime Tiempo actual del servidor (en segundos)
   * @param tokenApp Token JWT de la app
   * @returns Milisegundos restantes antes de la expiración
   */
  isTokenExpiredApp(serverTime: number, tokenApp: string): number {
    const expiryApp = this.tokenService.getTokenExpirationEpochSeconds(tokenApp);
    if (!expiryApp) {
      return 0;
    }
    return expiryApp * 1000 - serverTime * 1000;
  }

  /**
   * Inicia el temporizador de cuenta regresiva para el cierre de sesión.
   */
  startTimer() {
    this.isRunning = true; // Marca el cronómetro como activo
    this.timerSubscription = interval(1000).subscribe({
      next: () => {
        if (this.timeLeft > 0) {
          this.timeLeft--; // Decrementa el tiempo restante
        } else {
          this.timerSubscription?.unsubscribe(); // Detiene el cronómetro al llegar a 0
          this.isRunning = false; // Marca el cronómetro como inactivo
          this.logoutListApp(); // Llama a la acción al finalizar
        }
      }
    });
  }

  formChangePassw = this.formBuilder.group({
    passwordOld: ['', [Validators.required]],
    passwordNew: ['', [Validators.required]],
    passwordNewRep: ['', [Validators.required]],
  });

  /**
   * Devuelve el control de un campo de un formulario.
   * @param campo Nombre del campo
   * @param form FormGroup
   * @returns AbstractControl o null
   */
  getFieldForm(campo: string, form: FormGroup): AbstractControl | null {
    return form.get(campo);
  }

  /**
   * Indica si un campo de formulario es inválido y fue tocado.
   * @param campo Nombre del campo
   * @param form FormGroup
   * @returns boolean
   */
  getInvalidForm(campo: string, form: FormGroup) {
    return this.getFieldForm(campo, form)?.touched && this.getFieldForm(campo, form)?.invalid;
  }

  /**
   * Sanitiza una imagen en base64 para mostrarla de forma segura.
   * @param image Imagen en base64
   * @returns SafeResourceUrl
   */
  public sanitizeImage(image: string) {
    return this.imgb64.bypassSecurityTrustUrl('data:image/png;base64,' + image);
  }

  /**
   * Solicita el token de una app y abre la aplicación en una nueva pestaña.
   * Implementa cache de tokens y cooldown para respetar rate limiting del servidor.
   * @param url URL de la aplicación
   * @param idApp ID de la aplicación
   */
  openAppByToken(url: string, idApp: string) {
    // Guard: evitar clics múltiples mientras hay una petición en curso
    if (this.loadingIsOpen) {
      return;
    }

    // Si ya tenemos el token en cache, abrir directamente sin petición al servidor
    const existingToken = this.tokenService.getTokenApp(idApp);
    if (existingToken && this.tokenCache.has(idApp)) {
      this.openAppDestination(url, idApp);
      return;
    }

    // Verificar cooldown para respetar rate limiting del servidor
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.REQUEST_COOLDOWN_MS) {
      // Silenciosamente ignorar clics durante el cooldown
      return;
    }

    this.loadingIsOpen = true;
    this.authService.getTokenApp(idApp).subscribe({
      next: (resp) => {
        this.authService.storeAppSession(resp.value, idApp);

        // Guardar en cache y actualizar timestamp
        this.tokenCache.add(idApp);
        this.lastRequestTime = Date.now();

        this.loadingIsOpen = false;
        this.openAppDestination(url, idApp);
      },
      error: (error) => {
        this.loadingIsOpen = false;
        const message = this.apiErrorMessageService.extract(error, 'Error al obtener token de aplicación');
        this.toastrService.error(message, 'Single-Sign', { timeOut: 3200 });
      }
    });
  }

  private openAppDestination(url: string | null, idApp: string): void {
    const localReturnUrl = this.authService.consumeLocalAppReturnUrl(idApp);
    if (localReturnUrl) {
      this.externalNavigationService.openInSameTab(localReturnUrl);
    } else if (url) {
      this.externalNavigationService.openInNewTab(url);
    }
  }

  /**
   * Abre el modal de confirmación de cierre de sesión.
   */
  openModalConfirmSession() {
    this.startTimer();
    this.modalConfirmSessionOpen = true;
  }

  /**
   * Acción al confirmar la renovación de sesión (renueva token o cierra sesión).
   */
  actionModalConfirmSession() {
    this.loading = true;
    this.msgConexionSession = "Estableciendo conexión";
    this.timerSubscription?.unsubscribe(); // Detiene cualquier cronómetro activo
    this.isRunning = false; // Marca el cronómetro como inactivo

    this.authService.renewSession().subscribe({
      next: () => {
        this.loading = false;
        this.modalConfirmSessionOpen = false;
        this.timeLeft = 60;
        this.setupAutoLogout();
        this.msgConexionSession = "";
      },
      error: (error) => {
        this.loading = false;
        this.msgConexionSession = "";
        this.logoutListApp();
        const message = this.apiErrorMessageService.extract(error, 'Error al renovar sesión');
        this.toastrService.error(message, 'Single-Sign', { timeOut: 3200 });
      }
    })
  }

  /**
   * Cierra el modal de confirmación de sesión y realiza logout.
   */
  closeModalConfirmSession() {
    this.modalConfirmSessionOpen = false;
    this.logoutListApp();
  }

  /**
   * Alterna el menú de usuario en la interfaz.
   */
  toggleMenuUser(event: MouseEvent) {
    event.stopPropagation();
    this.activeMenuUser = !this.activeMenuUser;
  }

  /**
   * Cierra el menú de usuario si se hace clic fuera.
   */
  onClickOutside() {
    if (!this.activeMenuUser) return;
    if (this.activeMenuUser) this.activeMenuUser = !this.activeMenuUser;
  }

  /**
   * Abre el modal de perfil de usuario.
   */
  openModalProfile() {
    this.modalProfileOpen = true;
  }

  /**
   * Abre el modal para cambiar la contraseña y enfoca el input.
   */
  openModalChangePassw() {
    this.formChangePassw.reset();
    this.passwordDistinct = false;
    this.modalChangePasswOpen = true;
    if (this.passwordOldInput) {
      this.setFocus(this.passwordOldInput.nativeElement);
    }
  }

  /**
   * Guarda el cambio de contraseña del usuario.
   */
  saveChangePassword() {
    this.passwordDistinct = false;

    if (this.formChangePassw.valid) {
      if (this.passwordChangeHelperService.hasMismatch(this.formChangePassw.getRawValue())) {
        this.passwordDistinct = true;
        return;
      }

      this.loading = true;
      this.formChangePassw?.disable();
      const changes: UpdateUser = this.passwordChangeHelperService.buildUpdatePayload(
        this.userIdFromToken,
        this.formChangePassw.getRawValue()
      );

      this.authService.updateUser(changes).subscribe({
        next: () => {
          this.loading = false;
          this.formChangePassw?.enable();

          this.modalChangePasswOpen = false;

          // Forzar logout y redirigir al login porque el backend invalida los tokens tras cambio de contraseña
          this.authService.logoutListApp();
          this.toastrService.success("Contraseña actualizada. Por favor inicie sesión nuevamente.", 'Acceso', { timeOut: 4000 });
          this.router.navigate(['./']);
        },
        error: (error) => {
          this.loading = false;
          this.formChangePassw?.enable();
          const message = this.apiErrorMessageService.extract(error, 'Error al cambiar contraseña');
          this.toastrService.error(message, 'Acceso', { timeOut: 3200 });
        }
      });
    } else {
      this.formChangePassw.markAllAsTouched();
    }
  }

  /**
   * Envía el foco a un input específico.
   * @param inputElement Elemento input HTML
   */
  setFocus(inputElement: HTMLInputElement) {
    setTimeout(() => {
      inputElement.focus();
    }, 0);
  }

  /**
   * Cierra la sesión y redirige al login.
   */
  logout() {
    this.authService.logoutListApp();
    this.router.navigate(['./']);
  }

  /**
   * Cierra todos los modales abiertos.
   */
  closeModal() {
    this.modalProfileOpen = false;
    this.modalChangePasswOpen = false;
    this.passwordDistinct = false;
  }

  /**
   * Muestra un mensaje de advertencia por cierre automático de sesión.
   */
  showMsgLogout() {
    this.toastrService.warning('Sesión expirada.', 'Acceso', {
      timeOut: 3000,
    });
  }

  /**
   * Cierra la sesión global y redirige al login.
   */
  logoutListApp() {
    this.authService.logoutListApp();
    this.router.navigate(['./']);
  }

  /**
   * Cierra la sesión global mostrando mensaje de expiración.
   */
  logoutListAppMsg() {
    this.showMsgLogout();
    this.authService.logoutListApp();
    this.router.navigate(['./']);
  }
}
