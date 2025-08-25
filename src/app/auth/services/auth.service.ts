import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';

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
    // LOG PARA VERIFICAR EL ENVIRONMENT
    console.log('✅ Environment cargado:', environment);
    console.log('✅ Modo producción:', environment.production);
    console.log('✅ API URL:', environment.apiUrl);

    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const userData = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');

    if (userData && token) {
      try {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
        console.log('✅ Usuario cargado desde localStorage:', user);
      } catch (e) {
        console.error('❌ Error parsing user data from storage:', e);
        this.clearAuthData();
      }
    } else {
      console.log('ℹ️ No hay datos de usuario en localStorage');
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

    const url = `${environment.apiUrl}/login.php`;
    console.log('🌐 Enviando login a:', url);
    console.log('🔐 Credenciales:', credentials);

    return this.http
      .post<LoginResponse>(url, credentials, {
        headers,
        observe: 'response',
        responseType: 'json',
      })
      .pipe(
        tap((response) => {
          console.log('📨 Respuesta completa del servidor:', response);
          console.log('📊 Status:', response.status);
          console.log('📋 Headers:', response.headers);
          console.log('📝 Body:', response.body);
        }),
        map((response) => {
          if (
            response.body?.success &&
            response.body.token &&
            response.body.user
          ) {
            console.log('✅ Login exitoso, guardando datos...');
            this.setAuthData(response.body.token, response.body.user);
          } else {
            console.warn('⚠️ Login no exitoso:', response.body);
          }
          return response.body as LoginResponse;
        }),
        catchError(this.handleError)
      );
  }

  register(userData: any): Observable<any> {
    const { confirmPassword, ...cleanData } = userData;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    const url = `${environment.apiUrl}/insert_usuario.php`;
    console.log('🌐 Enviando registro a:', url);
    console.log('📋 Datos de registro:', cleanData);

    return this.http
      .post(url, cleanData, {
        headers,
        withCredentials: false,
      })
      .pipe(
        tap((response) => {
          console.log('✅ Respuesta de registro:', response);
        }),
        catchError(this.handleRegisterError)
      );
  }

  private setAuthData(token: string, user: User): void {
    console.log('💾 Guardando datos de autenticación...');
    localStorage.setItem('token', token);
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
    console.log('✅ Datos guardados correctamente');
  }

  private clearAuthData(): void {
    console.log('🧹 Limpiando datos de autenticación...');
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    console.log('✅ Datos limpiados correctamente');
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('❌ Error en AuthService:', error);
    console.error('📊 Status error:', error.status);
    console.error('📋 Error headers:', error.headers);
    console.error('📝 Error body:', error.error);

    let errorMessage = 'Error durante el inicio de sesión';

    if (error.status === 0) {
      errorMessage = 'Error de conexión: No se pudo contactar al servidor';
    } else if (error.status === 200 && error.error instanceof ProgressEvent) {
      errorMessage =
        'Error de parsing: El servidor respondió pero con formato inválido';
    } else if (error.status === 400) {
      errorMessage = 'Datos inválidos proporcionados';
    } else if (error.status === 401) {
      errorMessage = 'Credenciales incorrectas';
    } else if (error.status === 404) {
      errorMessage = 'Endpoint no encontrado. Verifica la URL del servidor.';
    } else if (error.status === 500) {
      errorMessage = 'Error interno del servidor';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error('❌ Mensaje de error final:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  private handleRegisterError(error: HttpErrorResponse): Observable<never> {
    console.error('❌ Error en registro:', error);

    let errorMsg = 'Error en el registro';

    if (error.status === 0) {
      errorMsg = 'No se pudo conectar al servidor. Verifica tu conexión.';
    } else if (error.error instanceof ErrorEvent) {
      errorMsg = `Error del cliente: ${error.error.message}`;
    } else if (error.error?.message) {
      errorMsg = error.error.message;
    } else if (error.message) {
      errorMsg = error.message;
    } else if (error.status === 400) {
      errorMsg = 'Datos de registro inválidos';
    } else if (error.status === 409) {
      errorMsg = 'El usuario ya existe';
    } else if (error.status === 500) {
      errorMsg = 'Error interno del servidor durante el registro';
    }

    return throwError(() => new Error(errorMsg));
  }

  logout(): void {
    console.log('🚪 Cerrando sesión...');
    this.clearAuthData();
    this.router.navigate(['/login']);
    console.log('✅ Sesión cerrada correctamente');
  }

  isAuthenticated(): boolean {
    const isAuth = !!this.getToken();
    console.log('🔐 Usuario autenticado:', isAuth);
    return isAuth;
  }

  get currentUserValue(): User | null {
    const user = this.currentUserSubject.value;
    console.log('👤 Usuario actual:', user);
    return user;
  }

  getToken(): string | null {
    const token = localStorage.getItem('token');
    console.log('🔑 Token obtenido:', token ? 'Sí' : 'No');
    return token;
  }

  // Método adicional para debugging
  debugAuthState(): void {
    console.log('🐛 DEBUG - Estado de autenticación:');
    console.log('📍 Token en localStorage:', localStorage.getItem('token'));
    console.log(
      '📍 User en localStorage:',
      localStorage.getItem('currentUser')
    );
    console.log('📍 currentUserSubject:', this.currentUserSubject.value);
    console.log('📍 Environment:', environment);
  }
}
