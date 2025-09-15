export interface Permission {
  id: number;
  name: string;
  description: string;
  category: string;
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions: Permission[];
  created_at?: string;
  updated_at?: string;
}

export interface Group {
  id: number;
  name: string;
  description: string;
  roles: Role[];
  users: number[];
  created_at?: string;
  updated_at?: string;
}
