// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { APP_ROUTES } from './app.routes';
import { authInterceptor } from './auth/interceptors/auth.interceptor'; // <- Importar la función

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(APP_ROUTES),
    provideHttpClient(
      withInterceptors([authInterceptor]) // <- Usar la función aquí
    ),
    provideAnimations(),
  ],
};
