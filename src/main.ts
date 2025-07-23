import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

// Inicia solo el módulo sin componente
platformBrowserDynamic()
  .bootstrapModule(AppModule)
  .catch((err: Error) => console.error('Error:', err));
