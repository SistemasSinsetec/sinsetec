import { provideServerRendering } from '@angular/ssr';
// src/main.server.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { mergeApplicationConfig } from '@angular/core';
import { serverConfig } from './app/app.config.server';
import { LoginComponent } from './app/auth/components/login/login.component';

// Combina la configuración del cliente con la del servidor
const combinedConfig = mergeApplicationConfig(serverConfig, {
  providers: [provideServerRendering()],
});

const bootstrap = () => bootstrapApplication(LoginComponent, combinedConfig);

export default bootstrap;
