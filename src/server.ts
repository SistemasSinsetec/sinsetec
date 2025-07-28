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
import dotenv from 'dotenv';

// Configura variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const browserDistFolder = join(__dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Middlewares
app.use(
  cors({
    origin: 'http://localhost:4200', // Ajusta según tu frontend
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rutas de API
app.use('/api/auth', authRoutes); // Esta línea debe estar presente

// Archivos estáticos
app.use(express.static(browserDistFolder));

// Manejo de rutas Angular
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();

  angularApp
    .handle(req)
    .then((response: unknown) => {
      if (response) {
        const angularResponse = {
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

// Iniciar servidor
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 2898; // Usando tu puerto 2898
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
export default app;

// Manejo de errores
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
