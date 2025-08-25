import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

interface LoginResponse {
  success: boolean;
  message?: string;
  user?: {
    username: string;
    email: string;
    id: number;
  };
  token?: string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  isLoading = false;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberMe: [false],
  });

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      this.toastr.warning('Por favor complete todos los campos correctamente');
      return;
    }

    this.isLoading = true;
    const { email, password } = this.loginForm.value;

    this.authService
      .login({
        email: email as string,
        password: password as string,
      })
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.toastr.success(`Bienvenido ${response.user?.username}`);
            this.router.navigate(['/home']);
          } else {
            this.toastr.error(response.message || 'Error al iniciar sesión');
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.handleLoginError(err);
        },
      });
  }

  private handleLoginError(err: any): void {
    console.error('Error en login:', err);

    if (err instanceof HttpErrorResponse) {
      switch (err.status) {
        case 0:
          this.toastr.error(
            'No se pudo conectar al servidor. Verifica tu conexión.'
          );
          break;
        case 400:
          this.toastr.error('Datos inválidos. Verifica la información.');
          break;
        case 401:
          this.toastr.error(
            'Credenciales incorrectas. Verifica tu email y contraseña.'
          );
          break;
        case 500:
          this.toastr.error('Error interno del servidor. Intenta más tarde.');
          break;
        default:
          this.toastr.error(err.message || 'Error desconocido');
      }
    } else {
      this.toastr.error(err.message || 'Error de conexión');
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach((key) => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  navigateToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }
}
