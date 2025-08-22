import { Routes } from '@angular/router';
import { AuthGuard } from './auth/guards/auth.guard';

export const APP_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/components/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./auth/components/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import(
        './auth/components/forgot-password/forgot-password.component'
      ).then((m) => m.ForgotPasswordComponent),
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'solicitudes',
    loadComponent: () =>
      import('./features/solicitudes/solicitudes.component').then(
        (m) => m.SolicitudesComponent
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'register-solicitudes',
    loadComponent: () =>
      import(
        './features/register-solicitudes/register-solicitudes.component'
      ).then((m) => m.RegisterSolicitudesComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'control-refacciones',
    loadComponent: () =>
      import(
        './features/register-refacciones/register-refacciones.component'
      ).then((m) => m.RegisterRefaccionesComponent), // Nombre coincide con la clase exportada
    canActivate: [AuthGuard],
  },
  {
    path: 'refacciones',
    loadComponent: () =>
      import('./features/refacciones/refacciones.component').then(
        (m) => m.RefaccionesComponent
      ),
    canActivate: [AuthGuard],
  },

  {
    path: 'accesos-permisos',
    loadComponent: () =>
      import('./features/accesos-permisos/accesos-permisos.component').then(
        (m) => m.AccesosPermisosComponent
      ),
    canActivate: [AuthGuard],
  },

  { path: '**', redirectTo: 'login' },
];
