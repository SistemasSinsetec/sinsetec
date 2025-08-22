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
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import database from './app/auth/services/database.service';

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
    origin: 'http://localhost:4200',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas de API
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Campos requeridos faltantes' });
    }

    const userExists = await database.getUserByEmail(email);
    if (userExists) {
      return res.status(400).json({ error: 'Email ya registrado' });
    }

    const userId = await database.createUser(username, email, password);
    const token = jwt.sign(
      { id: userId },
      process.env['JWT_SECRET'] || 'secreto_temporal',
      { expiresIn: '1h' }
    );

    return res.status(201).json({
      success: true,
      user: { id: userId, username, email },
      token,
    });
  } catch (error) {
    console.error('Error en registro:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ... (resto del archivo permanece igual)

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
