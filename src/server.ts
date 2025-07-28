import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import cors from 'cors';
import authRoutes from './app/auth/routes/auth.routes';

// Interfaz extendida para compatibilidad
interface AngularResponse {
  status?: number;
  statusText?: string;
  headers: Map<string, string>;
  body?: string;
  ok?: boolean;
  redirected?: boolean;
  type?: ResponseType;
  url?: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const browserDistFolder = join(__dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Configuración de timeout (eliminada la importación conflictiva de rxjs)
const timeoutDelay = 1000; // Tiempo en milisegundos
setTimeout(() => {
  console.log('Timeout ejecutado');
}, timeoutDelay);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use(express.static(browserDistFolder));

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();

  angularApp
    .handle(req)
    .then((response: unknown) => {
      if (response) {
        const angularResponse: AngularResponse = {
          status: 200,
          statusText: 'OK',
          headers: new Map(),
          body: '',
          ok: true,
          redirected: false,
          type: 'default',
          ...(response as object),
        };
        writeResponseToNodeResponse(
          angularResponse as unknown as Response,
          res
        );
      } else {
        next();
      }
    })
    .catch(next);
});

if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
export default app;
