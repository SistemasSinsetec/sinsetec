import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [CommonModule, ReactiveFormsModule], // Añade esto si usas standalone
  standalone: true, // Solo si estás usando componentes standalone
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm = this.fb.group(
    {
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: this.passwordMatchValidator }
  );

  passwordMatchValidator(form: any) {
    const password = form.get('password').value;
    const confirmPassword = form.get('confirmPassword').value;

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onRegister() {
    if (this.registerForm.invalid) return;

    const username = this.registerForm.value.username ?? '';
    const email = this.registerForm.value.email ?? '';
    const password = this.registerForm.value.password ?? '';

    if (this.authService.register({ username, email, password })) {
      this.router.navigate(['/home']);
    } else {
      // Mostrar error de registro
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
