import { provideServerRendering } from '@angular/ssr';
// src/app/app.config.server.ts
import { mergeApplicationConfig } from '@angular/core';
import { appConfig } from './app.config';

export const serverConfig = mergeApplicationConfig(appConfig, {
  providers: [provideServerRendering()],
});
