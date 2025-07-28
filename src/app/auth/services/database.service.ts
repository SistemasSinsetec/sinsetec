// src/server/services/database.service.ts
import mysql from 'mysql2/promise';

interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  activo: number;
  intentos_fallidos: number;
  bloqueado_until: Date | null;
  created_at: Date;
  updated_at: Date;
}

class DatabaseService {
  private pool: mysql.Pool;

  constructor() {
    this.pool = mysql.createPool({
      host: 'localhost',
      user: 'tu_usuario',
      password: 'tu_contraseña',
      database: 'sinsetec_dev_sstservicios',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  async query<
    T extends mysql.RowDataPacket[] | mysql.OkPacket | mysql.ResultSetHeader
  >(sql: string, values?: any): Promise<T> {
    const [rows] = await this.pool.query<T>(sql, values);
    return rows;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const [users] = await this.query<mysql.RowDataPacket[]>(
      `SELECT id, username, email, password, activo, 
       intentos_fallidos, bloqueado_until 
       FROM usuarios WHERE email = ? AND activo = 1`,
      [email]
    );
    return (users[0] as User) || null;
  }

  async updateLoginAttempts(
    userId: number,
    attempts: number,
    blockUntil: Date | null = null
  ): Promise<void> {
    let query = 'UPDATE usuarios SET intentos_fallidos = ?';
    const params: any[] = [attempts];

    if (blockUntil) {
      query += ', bloqueado_until = ?';
      params.push(blockUntil);
    }

    query += ' WHERE id = ?';
    params.push(userId);

    await this.query<mysql.ResultSetHeader>(query, params);
  }

  async resetLoginAttempts(userId: number): Promise<void> {
    await this.query<mysql.ResultSetHeader>(
      `UPDATE usuarios 
       SET intentos_fallidos = 0, bloqueado_until = NULL 
       WHERE id = ?`,
      [userId]
    );
  }

  async createUser(
    username: string,
    email: string,
    password: string
  ): Promise<number> {
    const result = await this.query<mysql.ResultSetHeader>(
      `INSERT INTO usuarios 
       (username, email, password, activo, intentos_fallidos, created_at, updated_at) 
       VALUES (?, ?, ?, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [username, email, password]
    );
    return result.insertId;
  }
}

export default new DatabaseService();
