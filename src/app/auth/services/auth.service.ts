import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  BehaviorSubject,
  catchError,
  map,
  Observable,
  tap,
  throwError,
} from 'rxjs';

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

interface RegisterResponse {
  success: boolean;
  message?: string;
}

@Injectable({ providedIn: 'root' })
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
      this.currentUserSubject.next(JSON.parse(userData));
    }
  }

  login(credentials: {
    email: string;
    password: string;
  }): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(
        `${environment.apiUrl}/login.php`, // Cambiado a ruta correcta
        credentials
      )
      .pipe(
        tap((response) => {
          if (response.success && response.token && response.user) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            this.currentUserSubject.next(response.user);
          }
        }),
        catchError((error) => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
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

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error';
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = `Código: ${error.status}\nMensaje: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }
}
