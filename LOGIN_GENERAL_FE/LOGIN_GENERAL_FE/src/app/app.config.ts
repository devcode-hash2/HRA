import { ApplicationConfig, importProvidersFrom, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';

import { provideHttpClient, withFetch } from '@angular/common/http';
import { ToastrModule } from 'ngx-toastr';
import { ReactiveFormsModule } from '@angular/forms';
import { EnvironmentService } from './core/services/environment.service';

/**
 * Factory function para APP_INITIALIZER
 * Muestra la configuración del entorno en consola al iniciar la app
 */
function initializeEnvironmentLogging(envService: EnvironmentService) {
  return () => envService.logEnvironmentInfo();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
    provideRouter(routes),
    provideAnimations(),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeEnvironmentLogging,
      deps: [EnvironmentService],
      multi: true
    },
    importProvidersFrom(
      ToastrModule.forRoot(),
      ReactiveFormsModule,
    )]
};
