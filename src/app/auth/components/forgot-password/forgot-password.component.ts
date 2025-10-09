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
    //ngOnInit.-> se ejecuta cuando se carga el componente
    // Verificar si viene token en la URL (modo reset)
    const urlParams = new URLSearchParams(window.location.search);
    //urlParams.-> se utiliza para obtener los parámetros de la URL
    //window.location.search.-> se utiliza para obtener la URL actual
    //URLSearchParams.-> se utiliza para obtener los parámetros de la URL
    this.token = urlParams.get('token') || '';
    //this.- se utiliza para acceder a las propiedades y métodos del componente
    //tokrn.- se utiliza para almacenar el token obtenido de la URL

    if (this.token) {
      this.isResetMode = true;
      // Si viene token, se activa el modo reset
    }
  }

  // Solicitar enlace de recuperación
  onRequestSubmit() {
    //onRequestSubmit.-> se ejecuta cuando se envía el formulario
    if (this.requestForm.invalid) return;
    //this da acceso a requestform que da acceso al fomrulario y verifca si es valido y da un return si no lo es
    //requestform.-> se utiliza para acceder al formulario de solicitud
    //invalid.-> se utiliza para verificar si el formulario es inválido
    this.isLoading = true; //acede a isLoading para indicar si el componente esta cargando que es igual a verdad
    //isLoading.-> se utiliza para indicar si el componente esta cargando
    const email = this.requestForm.value.email;
    //consulta el email del formuelario de solicitud y valua el email

    const headers = new HttpHeaders({
      //headers.-> se utiliza para configurar los encabezados de la solicitud
      //HTTPHeaders.-> se utiliza para configurar los encabezados de la solicitud
      //se consulta los encabezados de la solicitud que es igual a new objeto que es HTTTPHeaders
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
