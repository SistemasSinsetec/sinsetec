// main.ts - Versión corregida
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { LoginComponent } from './app/auth/components/login/login.component';
import { RootComponent } from './app/root.component'; // Cambia esto
import 'zone.js'; // 👈 Necesario para Angular

bootstrapApplication(RootComponent, appConfig).catch((err: any) =>
  console.error(err)
);
