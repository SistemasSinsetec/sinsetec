import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  intentos_fallidos: number;
  bloqueado_until: Date | null;
}

class DatabaseService {
  updateLoginAttempts(arg0: number, arg1: number, arg2: Date) {
    throw new Error('Method not implemented.');
  }
  resetLoginAttempts(arg0: number) {
    throw new Error('Method not implemented.');
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

  private async executeQuery(
    sql: string,
    values?: any[]
  ): Promise<mysql.RowDataPacket[] | mysql.ResultSetHeader> {
    const [result] = await this.pool.execute<
      mysql.RowDataPacket[] | mysql.ResultSetHeader
    >(sql, values);
    return result;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const result = (await this.executeQuery(
        'SELECT * FROM usuarios WHERE email = ?',
        [email]
      )) as mysql.RowDataPacket[];

      return (result[0] as User) || null;
    } catch (error) {
      console.error('Error al buscar usuario por email:', error);
      throw new Error('Error al buscar usuario');
    }
  }

  async createUser(
    username: string,
    email: string,
    password: string
  ): Promise<number> {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = (await this.executeQuery(
        `INSERT INTO usuarios 
         (username, email, password, intentos_fallidos, bloqueado_until)
         VALUES (?, ?, ?, 0, NULL)`,
        [username, email, hashedPassword]
      )) as mysql.ResultSetHeader;

      return result.insertId;
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw new Error('Error al crear usuario');
    }
  }

  // ... (resto de métodos permanecen igual)
}

export default new DatabaseService();
