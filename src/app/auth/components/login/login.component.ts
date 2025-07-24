import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',  // ← Debe coincidir con lo usado en main.ts
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    rememberMe: [false],
  });

  onLogin() {
    if (this.loginForm.invalid) return;

    const username = this.loginForm.value.username ?? '';
    const password = this.loginForm.value.password ?? '';

    if (this.authService.login({ username, password })) {
      this.router.navigate(['/home']);
    } else {
      // Mostrar error de autenticación
    }
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }
}
