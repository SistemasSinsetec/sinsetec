import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const user = localStorage.getItem('currentUser');
    if (user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http
      .post<any>(`${environment.apiUrl}/login.php`, credentials)
      .pipe(
        map((response) => {
          if (response.success && response.token) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            this.currentUserSubject.next(response.user);
          }
          return response;
        })
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
    });
  }

  validateToken(): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      return of(false);
    }

    return this.http
      .get<{ valid: boolean }>(`${environment.apiUrl}/validate-token.php`, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response) => response.valid),
        catchError(() => of(false))
      );
  }

  hasPermission(permissionName: string): boolean {
    const user = this.currentUserSubject.value;
    if (!user || !user.roles) return false;

    return user.roles.some((role: any) =>
      role.permisos?.some(
        (permission: any) => permission.nombre === permissionName
      )
    );
  }

  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }
  register(userData: any): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/insert_usuario.php`,
      userData
    );
  }
}
