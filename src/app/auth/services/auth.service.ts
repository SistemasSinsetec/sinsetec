import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { User } from '../../features/accesos-permisos/user.model';

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
        console.error('Error parsing user data from storage:', e);
        this.clearAuthData();
      }
    }
  }

  login(credentials: {
    email: string;
    password: string;
  }): Observable<LoginResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/login.php`, credentials, {
        headers,
      })
      .pipe(
        tap((response) => {
          if (response.success && response.token && response.user) {
            this.setAuthData(response.token, response.user);
          }
        }),
        catchError(this.handleError)
      );
  }

  register(userData: any): Observable<any> {
    const { confirmPassword, ...cleanData } = userData;

    return this.http
      .post(`${environment.apiUrl}/insert_usuario.php`, cleanData, {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          Accept: 'application/json',
        }),
        withCredentials: false,
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          let errorMsg = 'Error en el servidor';
          if (error.status === 0) {
            errorMsg = 'No se pudo conectar al servidor';
          } else if (error.error?.message) {
            errorMsg = error.error.message;
          }
          return throwError(() => ({ message: errorMsg }));
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
    } else if (error.status === 401) {
      errorMessage = 'Credenciales incorrectas';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }
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

  hasPermission(permissionName: string): boolean {
    const user = this.currentUserValue;
    if (!user || !user.roles) return false;

    return user.roles.some((role: any) =>
      role.permissions.some(
        (permission: any) => permission.name === permissionName
      )
    );
  }

  validateToken(): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('No token available'));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });

    return this.http
      .get<{ valid: boolean }>(`${environment.apiUrl}/validate-token.php`, {
        headers,
      })
      .pipe(
        map((response) => response.valid),
        catchError(() => of(false))
      );
  }
}
