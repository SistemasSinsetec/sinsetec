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
  errorMessage: any;

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
      this.markFormGroupTouched(this.registerForm);

      if (this.registerForm.hasError('passwordMismatch')) {
        this.toastr.error('Las contraseñas no coinciden');
      } else {
        const invalidFields = this.getInvalidFields();
        this.toastr.warning(
          `Complete correctamente: ${invalidFields.join(', ')}`
        );
      }
      return;
    }

    const { confirmPassword, ...userData } = this.registerForm.value;

    this.authService.register(userData).subscribe({
      next: (response) => {
        if (response?.success) {
          this.toastr.success(
            `Registro exitoso. Bienvenido ${userData.username}`
          );
          this.router.navigate(['/auth/login']);
        } else {
          this.toastr.error(
            response?.message || 'Error al procesar el registro'
          );
        }
      },
      error: (err) => {
        const errorMessage =
          err?.message ||
          err?.error?.message ||
          'Error desconocido al intentar registrar';
        this.toastr.error(errorMessage);

        // Debug: Mostrar error completo en consola
        console.error('Error detallado:', err);
      },
    });
  }

  // Método auxiliar para marcar todos los campos como touched
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach((control) => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // Método auxiliar para obtener campos inválidos
  private getInvalidFields(): string[] {
    const invalidFields: string[] = [];

    Object.keys(this.registerForm.controls).forEach((key) => {
      const control = this.registerForm.get(key);
      if (control?.invalid) {
        invalidFields.push(this.getFieldName(key));
      }
    });

    return invalidFields;
  }

  // Método auxiliar para nombres descriptivos de campos
  private getFieldName(key: string): string {
    const fieldNames: { [key: string]: string } = {
      username: 'usuario',
      email: 'correo electrónico',
      password: 'contraseña',
      confirmPassword: 'confirmación de contraseña',
    };

    return fieldNames[key] || key;
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
