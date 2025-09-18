export interface Permission {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
}

export interface Role {
  id: number;
  nombre: string;
  descripcion?: string;
  permisos: Permission[];
}

export interface Group {
  id: number;
  nombre: string;
  descripcion: string;
  roles: Role[];
  usuarios: any[];
}
