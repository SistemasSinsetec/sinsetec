// auth.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isAuth = false;

  constructor(private router: Router) {}

  login(credentials: { username: string; password: string }): boolean {
    // Lógica de autenticación real iría aquí
    if (credentials.username && credentials.password) {
      this.isAuth = true;
      localStorage.setItem('isAuthenticated', 'true');
      return true;
    }
    return false;
  }

  register(user: {
    username: string;
    email: string;
    password: string;
  }): boolean {
    // Lógica de registro real iría aquí
    // Por ahora simulamos un registro exitoso
    this.isAuth = true;
    localStorage.setItem('isAuthenticated', 'true');
    return true;
  }

  logout(): void {
    this.isAuth = false;
    localStorage.removeItem('isAuthenticated');
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.isAuth || localStorage.getItem('isAuthenticated') === 'true';
  }

  requestPasswordReset(email: string): Promise<boolean> {
    // Simular envío de correo electrónico
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 1000);
    });
  }
}
