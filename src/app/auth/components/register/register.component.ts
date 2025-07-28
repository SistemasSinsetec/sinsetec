import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';

interface RegisterResponse {
  success: boolean;
  message?: string;
}

interface ApiError {
  error?: {
    message?: string;
  };
  message?: string;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class RegisterComponent {
  onRegister() {
    throw new Error('Method not implemented.');
  }
  goToLogin() {
    throw new Error('Method not implemented.');
  }
  registerForm: FormGroup;

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  constructor() {
    this.registerForm = this.fb.group(
      {
        username: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const formGroup = control as FormGroup;
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      if (this.registerForm.hasError('passwordMismatch')) {
        this.toastr.error('Las contraseñas no coinciden');
      } else {
        this.toastr.warning(
          'Por favor complete todos los campos correctamente'
        );
      }
      return;
    }

    const { username, email, password } = this.registerForm.value;

    this.authService
      .register({
        username: username as string,
        email: email as string,
        password: password as string,
      })
      .subscribe({
        next: (response: RegisterResponse) => {
          if (response.success) {
            this.router.navigate(['/home']);
            this.toastr.success(`Registro exitoso. Bienvenido ${username}`);
          } else {
            this.toastr.error(response.message || 'Error al registrarse');
          }
        },
        error: (err: ApiError) => {
          console.error('Register error:', err);
          this.toastr.error(
            err.error?.message || err.message || 'Error de conexión'
          );
        },
      });
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
