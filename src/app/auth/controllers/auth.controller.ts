// src/server/controllers/auth.controller.ts
import { Request, Response } from 'express';
import db from '../services/database.service';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'tu_secreto_jwt';

class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // 1. Buscar usuario activo
      const user = await db.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado o cuenta inactiva',
        });
      }

      // 2. Verificar bloqueo temporal
      if (user.bloqueado_until && new Date(user.bloqueado_until) > new Date()) {
        return res.status(403).json({
          success: false,
          message: 'Cuenta temporalmente bloqueada por intentos fallidos',
          blocked_until: user.bloqueado_until,
        });
      }

      // 3. Verificar contraseña
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        // Actualizar intentos fallidos
        const newFailedAttempts = user.intentos_fallidos + 1;
        let blockUntil = null;

        if (newFailedAttempts >= 3) {
          blockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
        }

        await db.updateLoginAttempts(user.id, newFailedAttempts, blockUntil);

        return res.status(401).json({
          success: false,
          message: 'Contraseña incorrecta',
          attempts_left: 3 - newFailedAttempts,
        });
      }

      // 4. Resetear intentos fallidos
      await db.resetLoginAttempts(user.id);

      // 5. Generar token JWT
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      // 6. Responder con los datos del usuario
      return res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          created_at: user.created_at,
        },
      });
    } catch (error) {
      console.error('Error en login:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
      });
    }
  }

  async register(req: Request, res: Response) {
    try {
      const { username, email, password } = req.body;

      // 1. Validaciones básicas
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos',
        });
      }

      // 2. Verificar si el email ya existe
      const existingUser = await db.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado',
        });
      }

      // 3. Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // 4. Crear usuario
      const userId = await db.createUser(username, email, hashedPassword);

      // 5. Generar token
      const token = jwt.sign(
        {
          id: userId,
          username,
          email,
        },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      // 6. Responder
      return res.status(201).json({
        success: true,
        token,
        user: {
          id: userId,
          username,
          email,
          created_at: new Date().toISOString(),
        },
        message: 'Registro exitoso',
      });
    } catch (error) {
      console.error('Error en registro:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al registrar el usuario',
      });
    }
  }
}

export default new AuthController();
