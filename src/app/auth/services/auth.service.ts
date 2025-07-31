import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

interface User {
  id: number;
  username: string;
  email: string;
  created_at?: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser = this.currentUserSubject.asObservable();

  constructor(private router: Router, private http: HttpClient) {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const userData = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');

    if (userData && token) {
      try {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
      } catch (e) {
        this.clearAuthData();
      }
    }
  }

  login(credentials: {
    email: string;
    password: string;
  }): Observable<LoginResponse> {
    console.log('Datos enviados al backend:', credentials); // <-- Agrega esto

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    const body = JSON.stringify(credentials);
    console.log('Cuerpo de la solicitud:', body); // <-- Agrega esto

    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/login.php`, body, { headers })
      .pipe(
        tap((response) => console.log('Respuesta del backend:', response)) // <-- Agrega esto
        // ... resto del código
      );
  }

  register(userData: any): Observable<any> {
    // Eliminar confirmPassword y preparar datos
    const { confirmPassword, ...cleanData } = userData;

    return this.http
      .post(`${environment.apiUrl}/insert_usuario.php`, cleanData, {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          Accept: 'application/json',
        }),
        withCredentials: false, // Cambiar a true solo si usas cookies/sesión
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error completo:', error);

          let errorMsg = 'Error en el servidor';
          if (error.status === 0) {
            errorMsg =
              'No se pudo conectar al servidor. Verifica tu conexión o que el servidor esté funcionando.';
          } else if (error.error instanceof ErrorEvent) {
            errorMsg = `Error del cliente: ${error.error.message}`;
          } else if (error.error?.message) {
            errorMsg = error.error.message;
          } else if (error.message) {
            errorMsg = error.message;
          }

          return throwError(() => ({
            message: errorMsg,
            details: error,
          }));
        })
      );
  }

  private setAuthData(token: string, user: User): void {
    localStorage.setItem('token', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ocurrió un error durante el inicio de sesión';

    if (error.status === 0) {
      errorMessage = 'Error de conexión: No se pudo contactar al servidor';
    } else if (error.status === 400) {
      errorMessage = 'Datos inválidos proporcionados';
    } else if (error.status === 401) {
      errorMessage = 'Credenciales incorrectas';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error('Error en AuthService:', error);
    return throwError(() => new Error(errorMessage));
  }

  logout(): void {
    this.clearAuthData();
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
