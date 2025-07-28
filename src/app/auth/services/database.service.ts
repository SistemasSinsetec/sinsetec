import mysql from 'mysql2/promise';

class DatabaseService {
  async updateLoginAttempts(
    userId: number,
    attempts: number,
    blockUntil: Date | null
  ): Promise<void> {
    await this.query(
      `UPDATE usuarios 
     SET intentos_fallidos = ?, bloqueado_until = ? 
     WHERE id = ?`,
      [attempts, blockUntil, userId]
    );
  }

  async resetLoginAttempts(userId: number): Promise<void> {
    await this.query(
      `UPDATE usuarios 
     SET intentos_fallidos = 0, bloqueado_until = NULL 
     WHERE id = ?`,
      [userId]
    );
  }
  private pool: mysql.Pool;

  constructor() {
    this.pool = mysql.createPool({
      host: process.env['DB_HOST'] || 'localhost',
      user: process.env['DB_USER'] || 'root',
      password: process.env['DB_PASSWORD'] || '',
      database: process.env['DB_NAME'] || 'sinsetec_dev_sstservicios',
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

  async getUserByEmail(email: string): Promise<any | null> {
    const [users] = await this.query<mysql.RowDataPacket[]>(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );
    return users[0] || null;
  }

  async createUser(
    username: string,
    email: string,
    password: string
  ): Promise<number> {
    const result = await this.query<mysql.ResultSetHeader>(
      `INSERT INTO usuarios 
       (username, email, password, activo, intentos_fallidos, created_at, updated_at) 
       VALUES (?, ?, ?, 1, 0, NOW(), NOW())`,
      [username, email, password]
    );
    return result.insertId;
  }
}

export default new DatabaseService();

export const isMainModule = (id: string) => id === import.meta.url;
