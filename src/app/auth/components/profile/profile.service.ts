import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap, delay } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private apiUrl = `${environment.apiUrl}/usuarios`;
  private useMockData = true;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  getUserProfile(userId: number): Observable<any> {
    if (this.useMockData) {
      return of({
        success: true,
        user: {
          id: userId,
          username: 'usuario_ejemplo',
          email: 'ejemplo@email.com',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: new Date().toISOString(),
          intentos_falifdos: 0,
          bloqueado_unfil: null,
          perfil: {
            nombre_completo: 'Usuario de Ejemplo',
            telefono: '+1234567890',
            direccion: 'Dirección de ejemplo 123',
            fecha_nacimiento: '1990-01-01',
            genero: 'masculino',
            avatar: null,
            biografia: 'Esta es una biografía de ejemplo',
            website: 'https://ejemplo.com',
            redes_sociales: { twitter: '@ejemplo', facebook: 'ejemplo' },
            preferencias: { tema: 'claro', notificaciones: true },
          },
        },
      }).pipe(delay(800));
    }

    const url = `${this.apiUrl}/set_profile.php?id=${userId}`;
    console.log('Solicitando perfil desde:', url);

    return this.http.get(url, { headers: this.getHeaders() }).pipe(
      tap((response) => console.log('Respuesta del servidor:', response)),
      catchError(this.handleError)
    );
  }

  updateUserProfile(userId: number, userData: any): Observable<any> {
    if (this.useMockData) {
      return of({
        success: true,
        message: 'Perfil actualizado correctamente',
        user: userData,
      }).pipe(delay(800));
    }

    return this.http
      .put(`${this.apiUrl}/update_profile.php?id=${userId}`, userData, {
        headers: this.getHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  changePassword(userId: number, passwordData: any): Observable<any> {
    if (this.useMockData) {
      return of({
        success: true,
        message: 'Contraseña cambiada correctamente',
      }).pipe(delay(800));
    }

    return this.http
      .post(`${this.apiUrl}/change_password.php?id=${userId}`, passwordData, {
        headers: this.getHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error completo:', error);

    let errorMessage = 'Ocurrió un error inesperado';

    if (error.status === 404) {
      errorMessage =
        'Endpoint no encontrado. Verifica la configuración del servidor.';
    } else if (error.status === 401) {
      errorMessage = 'No autorizado. Token inválido o expirado.';
    } else if (error.status === 0) {
      errorMessage =
        'Error de conexión. Verifica que el servidor esté funcionando.';
    } else if (error.error instanceof ErrorEvent) {
      errorMessage = `Error del cliente: ${error.error.message}`;
    } else {
      errorMessage = `Error ${error.status}: ${error.message}`;
    }

    return throwError(() => new Error(errorMessage));
  }
}
