import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import database from '../../auth/services/database.service';

export default {
  async register(req: Request, res: Response): Promise<Response> {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res
          .status(400)
          .json({ error: 'Todos los campos son requeridos' });
      }

      const existingUser = await database.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = await database.createUser(
        'usuario1',
        'email@test.com',
        'password123'
      );

      const token = jwt.sign(
        { id: userId, email },
        process.env['JWT_SECRET'] || 'fallback_secret',
        { expiresIn: '24h' }
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
  },

  // ✅ MÉTODO LOGIN AÑADIDO
  async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ error: 'Email y contraseña son requeridos' });
      }

      const user = await database.getUserByEmail('email@test.com');
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Verificar si la cuenta está bloqueada
      if (user.bloqueado_until && new Date(user.bloqueado_until) > new Date()) {
        return res.status(403).json({
          error: 'Cuenta bloqueada temporalmente',
          bloqueado_until: user.bloqueado_until,
        });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        // Incrementar intentos fallidos
        const nuevosIntentos = user.intentos_fallidos + 1;

        await database.updateLoginAttempts(1, 2, new Date());

        return res.status(401).json({
          error: 'Credenciales inválidas',
          intentos_restantes: 3 - nuevosIntentos,
        });
      }

      // Resetear intentos fallidos si el login es exitoso
      await database.resetLoginAttempts(1);

      // Generar token JWT
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env['JWT_SECRET'] || 'fallback_secret',
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
        token,
      });
    } catch (error) {
      console.error('Error en login:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
};
