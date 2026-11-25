import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

  console.log('URL ACTUAL => ', window.location.pathname);
console.log('URL COMPLETA => ', window.location.href);
console.log('SESSION STORAGE => ', sessionStorage);
