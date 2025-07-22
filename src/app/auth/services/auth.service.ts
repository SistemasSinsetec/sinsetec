import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private isAuth = false;

  constructor(private router: Router) {}

  login(credentials: { email: string; password: string }): boolean {
    // Aquí iría tu lógica real de autenticación
    // Esto es solo un ejemplo
    if (credentials.email && credentials.password) {
      this.isAuth = true;
      return true;
    }
    return false;
  }

  logout(): void {
    this.isAuth = false;
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.isAuth;
  }
}
