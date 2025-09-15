import { Role, Group } from './permission.model';

export interface User {
  id: number;
  username: string;
  email: string;
  nombre_completo?: string;
  telefono?: string;
  direccion?: string;
  fecha_nacimiento?: string;
  foto_perfil?: string;
  biografia?: string;
  isActive: boolean;
  roles: Role[];
  groups: Group[];
  companyId: number;
  intentos_fallidos?: number;
  bloqueado_until?: string | null;
  created_at?: string;
  updated_at?: string;
}
