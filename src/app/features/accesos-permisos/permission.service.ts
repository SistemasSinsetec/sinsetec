import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Permission, Role, Group } from './permission.model';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private permissionsSubject = new BehaviorSubject<Permission[]>([]);
  private rolesSubject = new BehaviorSubject<Role[]>([]);
  private groupsSubject = new BehaviorSubject<Group[]>([]);

  public permissions$ = this.permissionsSubject.asObservable();
  public roles$ = this.rolesSubject.asObservable();
  public groups$ = this.groupsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadInitialData();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token || ''}`,
    });
  }

  public loadInitialData(): void {
    this.loadPermissions();
    this.loadRoles();
    this.loadGroups();
  }

  // Métodos para Permisos
  private loadPermissions(): void {
    this.http
      .get<{ success: boolean; data: Permission[] }>(
        `${environment.apiUrl}/permisos.php`,
        { headers: this.getHeaders() }
      )
      .pipe(catchError(this.handleError))
      .subscribe((response) => {
        if (response.success) {
          this.permissionsSubject.next(response.data);
        }
      });
  }

  createPermission(permission: Omit<Permission, 'id'>): Observable<boolean> {
    return this.http
      .post<{ success: boolean; message: string }>(
        `${environment.apiUrl}/permisos.php`,
        permission,
        { headers: this.getHeaders() }
      )
      .pipe(
        map((response) => {
          if (response.success) {
            this.loadPermissions();
          }
          return response.success;
        }),
        catchError(this.handleError)
      );
  }

  updatePermission(permission: Permission): Observable<boolean> {
    return this.http
      .put<{ success: boolean; message: string }>(
        `${environment.apiUrl}/permisos.php`,
        permission,
        { headers: this.getHeaders() }
      )
      .pipe(
        map((response) => {
          if (response.success) {
            this.loadPermissions();
          }
          return response.success;
        }),
        catchError(this.handleError)
      );
  }

  deletePermission(id: number): Observable<boolean> {
    return this.http
      .delete<{ success: boolean; message: string }>(
        `${environment.apiUrl}/permisos.php?id=${id}`,
        { headers: this.getHeaders() }
      )
      .pipe(
        map((response) => {
          if (response.success) {
            this.loadPermissions();
          }
          return response.success;
        }),
        catchError(this.handleError)
      );
  }

  // Métodos para Roles
  private loadRoles(): void {
    this.http
      .get<{ success: boolean; data: Role[] }>(
        `${environment.apiUrl}/roles.php`,
        { headers: this.getHeaders() }
      )
      .pipe(catchError(this.handleError))
      .subscribe((response) => {
        if (response.success) {
          this.rolesSubject.next(response.data);
        }
      });
  }

  createRole(role: Omit<Role, 'id'>): Observable<boolean> {
    return this.http
      .post<{ success: boolean; message: string }>(
        `${environment.apiUrl}/roles.php`,
        role,
        { headers: this.getHeaders() }
      )
      .pipe(
        map((response) => {
          if (response.success) {
            this.loadRoles();
          }
          return response.success;
        }),
        catchError(this.handleError)
      );
  }

  updateRole(role: Role): Observable<boolean> {
    return this.http
      .put<{ success: boolean; message: string }>(
        `${environment.apiUrl}/roles.php`,
        role,
        { headers: this.getHeaders() }
      )
      .pipe(
        map((response) => {
          if (response.success) {
            this.loadRoles();
          }
          return response.success;
        }),
        catchError(this.handleError)
      );
  }

  deleteRole(id: number): Observable<boolean> {
    return this.http
      .delete<{ success: boolean; message: string }>(
        `${environment.apiUrl}/roles.php?id=${id}`,
        { headers: this.getHeaders() }
      )
      .pipe(
        map((response) => {
          if (response.success) {
            this.loadRoles();
          }
          return response.success;
        }),
        catchError(this.handleError)
      );
  }

  // Métodos para Grupos
  private loadGroups(): void {
    this.http
      .get<{ success: boolean; data: Group[] }>(
        `${environment.apiUrl}/grupos.php`,
        { headers: this.getHeaders() }
      )
      .pipe(catchError(this.handleError))
      .subscribe((response) => {
        if (response.success) {
          this.groupsSubject.next(response.data);
        }
      });
  }

  createGroup(group: Omit<Group, 'id'>): Observable<boolean> {
    return this.http
      .post<{ success: boolean; message: string }>(
        `${environment.apiUrl}/grupos.php`,
        group,
        { headers: this.getHeaders() }
      )
      .pipe(
        map((response) => {
          if (response.success) {
            this.loadGroups();
          }
          return response.success;
        }),
        catchError(this.handleError)
      );
  }

  updateGroup(group: Group): Observable<boolean> {
    return this.http
      .put<{ success: boolean; message: string }>(
        `${environment.apiUrl}/grupos.php`,
        group,
        { headers: this.getHeaders() }
      )
      .pipe(
        map((response) => {
          if (response.success) {
            this.loadGroups();
          }
          return response.success;
        }),
        catchError(this.handleError)
      );
  }

  deleteGroup(id: number): Observable<boolean> {
    return this.http
      .delete<{ success: boolean; message: string }>(
        `${environment.apiUrl}/grupos.php?id=${id}`,
        { headers: this.getHeaders() }
      )
      .pipe(
        map((response) => {
          if (response.success) {
            this.loadGroups();
          }
          return response.success;
        }),
        catchError(this.handleError)
      );
  }

  // Verificación de permisos
  userHasPermission(user: any, permissionName: string): boolean {
    if (!user || !user.roles) return false;

    return user.roles.some((role: Role) =>
      role.permissions.some((permission) => permission.name === permissionName)
    );
  }

  // Manejo de errores - CORREGIDO
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Ocurrió un error';

    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else if (error.status === 401) {
      errorMessage = 'No autorizado - Sesión expirada';
      // Solo limpiar datos, NO redirigir aquí
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      // La redirección debe manejarse en el componente
    } else if (error.status === 403) {
      errorMessage = 'Permisos insuficientes';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }

    console.error('Error en PermissionService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
