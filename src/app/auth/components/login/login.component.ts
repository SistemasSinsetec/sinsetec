import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
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

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberMe: [false],
  });

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.toastr.warning('Por favor complete todos los campos correctamente');
      return;
    }

    const { email, password } = this.loginForm.value;

    this.authService
      .login({
        email: email as string,
        password: password as string,
      })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastr.success(`Bienvenido ${response.user?.username}`);
            this.router.navigate(['/home']);
          } else {
            this.toastr.error(response.message || 'Error al iniciar sesión');
          }
        },
        error: (err) => {
          this.toastr.error(err.message || 'Error de conexión');
          console.error('Error en login:', err);
        },
      });
  }

  navigateToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }
}
