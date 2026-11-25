import { CommonModule, NgTemplateOutlet } from '@angular/common';
import { AfterViewInit, CUSTOM_ELEMENTS_SCHEMA, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faEyeSlash, faFloppyDisk, faLock, faXmark } from '@fortawesome/free-solid-svg-icons';
import { UpdateUser, UserByToken, valueListApp } from '@models/auth.model';
import { AuthService } from '@services/auth.service';
import { ApiErrorMessageService } from '@services/api-error-message.service';
import { ExternalNavigationService } from '@services/external-navigation.service';
import { PasswordChangeHelperService } from '@services/password-change-helper.service';
import { ToastrService } from 'ngx-toastr';
import { ModalFirstComponent } from '../../../admin/components/modal-first/modal-first.component';
import { map, switchMap, throwError } from 'rxjs';

@Component({
  selector: 'app-login-form',
  imports: [ReactiveFormsModule, FontAwesomeModule, CommonModule, ModalFirstComponent],
  templateUrl: './login-form.component.html',
  styleUrl: './login-form.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class LoginFormComponent implements OnInit, AfterViewInit {
  constructor(
  ) { }
  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private apiErrorMessageService = inject(ApiErrorMessageService);
  public toastr = inject(ToastrService);
  private router = inject(Router);
  private externalNavigationService = inject(ExternalNavigationService);
  private passwordChangeHelperService = inject(PasswordChangeHelperService);

  @ViewChild('usernameInput') usernameInput?: ElementRef<HTMLInputElement>;
  @ViewChild('passwordOldInput') passwordOldInput?: ElementRef<HTMLInputElement>;

  modalChangePasswOpen: boolean = false;
  hidePassOld = true;
  hidePassNew = true;
  hidePassNewRep = true;
  loading = false;
  userByToken?: UserByToken;

  formChangePassw = this.formBuilder.group({
    passwordOld: ['', [Validators.required]],
    passwordNew: ['', [Validators.required]],
    passwordNewRep: ['', [Validators.required]],
  });

  faEye = faEye;
  faEyeSlash = faEyeSlash;
  faXmark = faXmark;
  faLock = faLock;
  faFloppyDisk = faFloppyDisk;

  modalProfileOpen: boolean = false;
  passwordDistinct: boolean = false;
  userIdFromToken?: number;
  private postChangeTarget: 'single-app' | 'list-app' | null = null;
  private postChangeSingleAppId: string | null = null;
  private postChangeSingleAppUrl: string | null = null;
  private pendingLoginUser: string | null = null;
  private pendingLoginIp: string = '';

  /**
   * Inicializa el componente, resetea el formulario y obtiene el usuario por token.
   */
  ngOnInit() {
    this.authService.rememberLocalAppReturnUrl(
      new URLSearchParams(window.location.search).get('returnUrl')
    );
    this.formLogin.reset();

    this.authService.getUserByToken()?.subscribe(data => {
      this.userIdFromToken = data.id;
    })
  }

  ngAfterViewInit(): void {
    if (this.usernameInput) {
      this.setFocus(this.usernameInput.nativeElement);
    }
  }

  /**
   * Devuelve el control del campo 'v_user' del formulario de login.
   */
  get getUserFieldForm() {
    return this.formLogin.get('v_user');
  }
  /**
   * Indica si el campo 'v_user' es válido y fue tocado.
   */
  get isUserFieldValidForm() {
    return this.formLogin.get('v_user')?.touched && this.formLogin.get('v_user')?.valid;
  }
  /**
   * Indica si el campo 'v_user' es inválido y fue tocado.
   */
  get isUserFieldInvalidForm() {
    return this.formLogin.get('v_user')?.touched && this.formLogin.get('v_user')?.invalid;
  }

  /**
   * Devuelve el control del campo 'v_password' del formulario de login.
   */
  get getPasswordFieldForm() {
    return this.formLogin.get('v_password');
  }
  /**
   * Indica si el campo 'v_password' es válido y fue tocado.
   */
  get isPasswordFieldValidForm() {
    return this.formLogin.get('v_password')?.touched && this.formLogin.get('v_password')?.valid;
  }
  /**
   * Indica si el campo 'v_password' es inválido y fue tocado.
   */
  get isPasswordFieldInvalidForm() {
    return this.formLogin.get('v_password')?.touched && this.formLogin.get('v_password')?.invalid;
  }

  title = 'Single-Sign';
  hidePass = true;
  aplicaciones: valueListApp[] = [];

  formLogin = this.formBuilder.nonNullable.group({
    v_user: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
    v_password: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
    v_ip: ''
  });

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
   * Devuelve el control de un campo de un formulario.
   * @param campo Nombre del campo
   * @param form FormGroup
   * @returns AbstractControl o null
   */
  getFieldForm(campo: string, form: FormGroup): AbstractControl | null {
    return form.get(campo);
  }

  /**
   * Guarda el cambio de contraseña del usuario desde el formulario de cambio de contraseña.
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
      const rawChanges = this.formChangePassw.getRawValue();

      const changes: UpdateUser = this.passwordChangeHelperService.buildUpdatePayload(
        this.userIdFromToken,
        rawChanges
      );

      this.authService.updateUser(changes).pipe(
        switchMap(() => this.reauthenticateAfterPasswordChange(rawChanges.passwordNew ?? ''))
      ).subscribe({
        next: () => {
          this.loading = false;
          this.formChangePassw?.enable();

          this.formLogin.reset();
          this.modalChangePasswOpen = false;
          this.toastr.success("Contraseña actualizada.", 'Acceso', { timeOut: 3000 });
          this.executePostChangeNavigation();
        },
        error: (error) => {
          this.loading = false;
          this.formChangePassw?.enable();
          const statusCode = this.apiErrorMessageService.getStatusCode(error);
          const message = this.apiErrorMessageService.extract(
            error,
            'La contraseña cambió, pero no se pudo reautenticar. Inicie sesión nuevamente.'
          );
          this.toastr.error(message, 'Acceso', { timeOut: 3500 });
          if (statusCode === 401 || statusCode === 403 || message.includes('reautenticar') || message.includes('sesión')) {
            this.authService.logoutListApp();
          }
        }
      });

    } else {
      this.formChangePassw.markAllAsTouched();
    }
  }

  /**
   * Solicita el token de una app y redirige a la aplicación si la URL existe.
   * @param idApp ID de la aplicación
   * @param url URL de la aplicación
   */
  openAppByToken(idApp: string, url: string | null) {
    this.authService.getTokenApp(idApp).subscribe({
      next: (resp) => {
        this.authService.storeAppSession(resp.value, idApp);
        this.loading = false;
        const localReturnUrl = this.authService.consumeLocalAppReturnUrl(idApp);
        if (localReturnUrl) {
          this.externalNavigationService.openInSameTab(localReturnUrl);
          return;
        }
        if (url) {
          this.externalNavigationService.openInSameTab(url);
        }
      },
      error: (error) => {
        this.loading = false;
        const message = this.apiErrorMessageService.extract(error, 'No se pudo abrir la aplicación seleccionada.');
        this.toastr.error(message, 'Single-Sign', { timeOut: 3200 });
      }
    })
  }

  /**
   * Realiza el login del usuario, maneja el flujo de cambio de contraseña y navegación según la cantidad de apps.
   */
  login() {
    if (this.formLogin.valid) {
      this.loading = true;
      this.formLogin.disable();
      const { v_user, v_password, v_ip } = this.formLogin.getRawValue();
      this.pendingLoginUser = v_user;
      this.pendingLoginIp = v_ip ?? '';
      this.authService.login(v_user, v_password, v_ip).pipe(
        switchMap(() => {
          const userByToken$ = this.authService.getUserByToken();
          if (!userByToken$) {
            throw new Error('No se pudo leer la sesión del token');
          }
          return userByToken$;
        }),
        switchMap((data) => {
          this.userByToken = data;
          this.userIdFromToken = data.id;
          return this.authService.getListadoApps(data.id).pipe(
            map((response) => ({ apps: response.value, changePassword: this.mustChangePassword(data.changepassword) }))
          );
        })
      ).subscribe({
        next: ({ apps, changePassword }) => {
          this.formLogin.enable();
          this.aplicaciones = apps;
          const cantidadApp = this.aplicaciones.length;

          if (cantidadApp === 0) {
            this.loading = false;
            this.authService.logoutListApp();
            this.toastr.error('No tiene aplicaciones asignadas.', 'Acceso', { timeOut: 3200 });
            return;
          }

          if (changePassword) {
            this.loading = false;
            this.formChangePassw.reset();
            this.passwordDistinct = false;

            if (cantidadApp === 1) {
              const app = this.aplicaciones[0].aplicaciones;
              this.postChangeTarget = 'single-app';
              this.postChangeSingleAppId = app.id_app;
              this.postChangeSingleAppUrl = app.url;
            } else {
              this.postChangeTarget = 'list-app';
              this.postChangeSingleAppId = null;
              this.postChangeSingleAppUrl = null;
            }

            if (this.passwordOldInput) {
              this.setFocus(this.passwordOldInput.nativeElement);
            }

            this.modalChangePasswOpen = true;
            return;
          }

          if (cantidadApp > 1) {
            this.loading = false;
            this.router.navigate(['/list-app']);
            return;
          }

          if (cantidadApp === 1) {
            const app = this.aplicaciones[0].aplicaciones;
            this.openAppByToken(app.id_app, app.url);
            return;
          }

          this.loading = false;
          this.toastr.error('No se pudo resolver destino de aplicaciones.', 'Acceso', { timeOut: 3200 });
        },
        error: (error) => {
          this.formLogin.enable();
          this.loading = false;
          this.authService.logoutListApp();
          const message = this.apiErrorMessageService.extract(error, 'No fue posible iniciar sesión. Verifique sus credenciales.');
          this.toastr.error(message, 'Single-Sign', { timeOut: 3200 });
        }
      });
    } else {
      this.formLogin.markAllAsTouched();
    }
  }

  /**
   * Normaliza el flag de cambio obligatorio de contraseña proveniente del token.
   */
  private mustChangePassword(changePasswordFlag: unknown): boolean {
    if (typeof changePasswordFlag === 'boolean') {
      return changePasswordFlag;
    }

    const normalized = String(changePasswordFlag ?? '').trim().toLowerCase();
    return normalized === 'true' || normalized === '1';
  }

  private executePostChangeNavigation(): void {
    if (this.postChangeTarget === 'single-app' && this.postChangeSingleAppId) {
      this.openAppByToken(this.postChangeSingleAppId, this.postChangeSingleAppUrl);
      return;
    }

    if (this.postChangeTarget === 'list-app') {
      this.router.navigate(['/list-app']);
      return;
    }

    if (this.aplicaciones.length > 1) {
      this.router.navigate(['/list-app']);
      return;
    }

    if (this.aplicaciones.length === 1) {
      const app = this.aplicaciones[0].aplicaciones;
      this.openAppByToken(app.id_app, app.url);
      return;
    }

    this.toastr.error('No tiene aplicaciones asignadas.', 'Acceso', { timeOut: 3200 });
  }

  private reauthenticateAfterPasswordChange(newPassword: string) {
    const loginUser = (this.pendingLoginUser ?? this.userByToken?.user ?? '').trim();

    if (!loginUser || !newPassword) {
      return throwError(() => new Error('No se pudieron recuperar credenciales para reautenticar.'));
    }

    return this.authService.login(loginUser, newPassword, this.pendingLoginIp).pipe(
      map(() => void 0)
    );
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
   * Cierra todos los modales abiertos.
   */
  closeModal() {
    this.modalProfileOpen = false;
    this.modalChangePasswOpen = false;
    this.passwordDistinct = false;
  }
}
