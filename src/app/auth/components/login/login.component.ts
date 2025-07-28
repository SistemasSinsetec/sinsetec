import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';

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

interface ApiError {
  error?: {
    message?: string;
  };
  message?: string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  // FORMULARIO ACTUALIZADO (elige UNA de las dos opciones)

  // OPCIÓN 1: Usar EMAIL como campo principal (recomendado)
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberMe: [false],
  });

  // OPCIÓN 2: Usar USERNAME como campo principal (si prefieres username)
  /*
  loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    rememberMe: [false]
  });
  */

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.toastr.warning('Por favor complete todos los campos correctamente');
      return;
    }

    // Actualiza según la opción elegida
    const credentials = this.loginForm.value;

    this.authService
      .login({
        email: credentials.email as string, // Usar esto si elegiste Opción 1
        // username: credentials.username as string,  // Usar esto si elegiste Opción 2
        password: credentials.password as string,
      })
      .subscribe({
        next: (response: LoginResponse) => {
          if (response.success && response.token) {
            this.router.navigate(['/home']);
            this.toastr.success(`Bienvenido ${response.user?.username}`);
          } else {
            this.toastr.error(response.message || 'Error al iniciar sesión');
          }
        },
        error: (err: ApiError) => {
          console.error('Login error:', err);
          this.toastr.error(
            err.error?.message || err.message || 'Error de conexión'
          );
        },
      });
  }

  navigateToForgotPassword(): void {
    this.router.navigate(['/auth/forgot-password']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/auth/register']);
  }
}
