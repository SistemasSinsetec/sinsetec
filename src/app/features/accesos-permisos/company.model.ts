export interface Company {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
  created_at?: string;
  updated_at?: string;
}
