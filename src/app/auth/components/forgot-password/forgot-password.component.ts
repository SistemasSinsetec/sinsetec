import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);

  isLoading = false;
  isResetMode = false;
  token: string = '';

  // Formulario para solicitar recuperación
  requestForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  // Formulario para resetear contraseña
  resetForm = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]],
  });

  ngOnInit() {
    // Verificar si viene token en la URL (modo reset)
    const urlParams = new URLSearchParams(window.location.search);
    this.token = urlParams.get('token') || '';

    if (this.token) {
      this.isResetMode = true;
    }
  }

  // Solicitar enlace de recuperación
  onRequestSubmit() {
    if (this.requestForm.invalid) return;

    this.isLoading = true;
    const email = this.requestForm.value.email;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    const data = {
      action: 'request',
      email: email,
    };

    this.http
      .post<any>(`${environment.apiUrl}/forgot-password.php`, data, { headers })
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.toastr.success(response.message);
            this.router.navigate(['/login']);
          } else {
            this.toastr.error(response.message);
          }
        },
        error: (error) => {
          this.isLoading = false;
          if (error.error?.message) {
            this.toastr.error(error.error.message);
          } else {
            this.toastr.error('Error al procesar la solicitud');
          }
        },
      });
  }

  // Resetear contraseña
  onResetSubmit() {
    if (this.resetForm.invalid) return;

    const newPassword = this.resetForm.value.newPassword;
    const confirmPassword = this.resetForm.value.confirmPassword;

    if (newPassword !== confirmPassword) {
      this.toastr.error('Las contraseñas no coinciden');
      return;
    }

    this.isLoading = true;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    const data = {
      action: 'reset',
      token: this.token,
      newPassword: newPassword,
    };

    this.http
      .post<any>(`${environment.apiUrl}/forgot-password.php`, data, { headers })
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.toastr.success(response.message);
            this.router.navigate(['/login']);
          } else {
            this.toastr.error(response.message);
          }
        },
        error: (error) => {
          this.isLoading = false;
          if (error.error?.message) {
            this.toastr.error(error.error.message);
          } else {
            this.toastr.error('Error al procesar la solicitud');
          }
        },
      });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
