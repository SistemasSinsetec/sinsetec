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

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class RegisterComponent {
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

    const { username, email, password, confirmPassword } =
      this.registerForm.value;

    this.authService
      .register({
        username,
        email,
        password,
        confirmPassword,
      })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastr.success(`Registro exitoso. Bienvenido ${username}`);
            this.router.navigate(['/login']);
          } else {
            this.toastr.error(response.message || 'Error al registrarse');
          }
        },
        error: (err) => {
          let errorMessage = 'Error de conexión';
          if (err.error?.message) {
            errorMessage = err.error.message;
          } else if (err.message) {
            errorMessage = err.message;
          }
          this.toastr.error(errorMessage);
        },
      });
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
