// Este archivo define las rutas principales de la aplicacion Angular.
// Se utiliza el sistema de rutas de Angular para navegar entre componentes.

import { Routes } from '@angular/router';
import { LoginFormComponent } from './auth/components/login-form/login-form.component';
import { ListAppsComponent } from './list-apps/components/list-apps/list-apps.component';
import { authLoginGeneralGuard } from './admin/guards/auth-login-general.guard';

// Definicion de las rutas disponibles en la aplicacion
export const routes: Routes = [
    {
        // Compatibilidad con despliegues donde el prefijo llega como segmento de ruta
        path: 'login-general',
        pathMatch: 'full',
        redirectTo: ''
    },
    {
        // Ruta raiz: muestra el formulario de login
        path: '',
        component: LoginFormComponent
    },
    {
        // Ruta protegida: solo accesible si el usuario tiene token valido
        canActivate: [authLoginGeneralGuard],
        path: 'list-app',
        component: ListAppsComponent
    },
    {
        // Fallback para rutas no reconocidas
        path: '**',
        redirectTo: ''
    }
];
