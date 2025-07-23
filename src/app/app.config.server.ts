// src/app/app.config.server.ts
import { mergeApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';

export const serverConfig = mergeApplicationConfig(appConfig, {
  providers: [provideServerRendering()],
});
