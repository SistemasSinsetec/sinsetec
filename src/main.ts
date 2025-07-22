import { bootstrapApplication } from '@angular/platform-browser';
import { LoginComponent } from './app/auth/components/login/login.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideHttpClient } from '@angular/common/http';
import 'zone.js'; // Solo necesitas esta importación

bootstrapApplication(LoginComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    // Otros providers globales que necesites
  ],
}).catch((err) => console.error(err));
