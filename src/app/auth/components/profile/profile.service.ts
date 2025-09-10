import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/services/auth.service';
import { environment } from 'src/environments/environment';

interface ProfileResponse {
  success: boolean;
  message?: string;
  user?: any;
}

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    });
  }

  getUserProfile(userId: number): Observable<ProfileResponse> {
    const params = new HttpParams().set('id', userId.toString());

    return this.http
      .get<ProfileResponse>(`${this.apiUrl}/profile.php`, {
        headers: this.getHeaders(),
        params: params,
      })
      .pipe(catchError(this.handleError));
  }

  // En profile.service.ts
  updateUserProfile(
    userId: number,
    profileData: any
  ): Observable<ProfileResponse> {
    const data = {
      id: userId,
      username: profileData.username,
      email: profileData.email,
      nombre_completo: profileData.nombre_completo,
      telefono: profileData.telefono,
      direccion: profileData.direccion,
      fecha_nacimiento: profileData.fecha_nacimiento,
      biografia: profileData.biografia,
    };

    return this.http
      .put<ProfileResponse>(`${this.apiUrl}/profile.php`, data, {
        headers: this.getHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  changePassword(
    userId: number,
    passwordData: any
  ): Observable<ProfileResponse> {
    const data = {
      id: userId,
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    };

    return this.http
      .post<ProfileResponse>(`${this.apiUrl}/change-password.php`, data, {
        headers: this.getHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'Error en el servidor';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.status === 0) {
      errorMessage = 'No se pudo conectar al servidor';
    } else if (error.status === 401) {
      errorMessage = 'No autorizado - Por favor inicia sesión nuevamente';
    } else if (error.status === 404) {
      errorMessage = 'Recurso no encontrado';
    }

    return throwError(() => new Error(errorMessage));
  }
}
