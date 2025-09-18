import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PermissionService } from '../../../features/accesos-permisos/permission.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';

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
  private permissionService = inject(PermissionService); // ✅ nuevo
  private router = inject(Router);
  private toastr = inject(ToastrService);

  isLoading = false;

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberMe: [false], // 🔥 agregado
  });

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login({ email: email!, password: password! }).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.toastr.success(`Bienvenido ${response.user?.username}`);

          // 🔥 cargar permisos, roles y grupos solo después del login
          this.permissionService.initializeAfterLogin();

          this.router.navigate(['/home']);
        } else {
          this.toastr.error(response.message || 'Error al iniciar sesión');
        }
      },
      error: () => {
        this.isLoading = false;
        this.toastr.error('Error en el inicio de sesión');
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
