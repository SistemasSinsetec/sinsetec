// src/app/features/accesos-permisos/permission.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Permission, Role, Group } from './permission.model';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

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

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {
    // ❌ Ya no llamamos a loadInitialData aquí
  }

  // ✅ Se ejecuta después de login exitoso
  public initializeAfterLogin(): void {
    this.loadPermissions();
    this.loadRoles();
    this.loadGroups();
  }

  // =====================
  // LOADERS
  // =====================
  private loadPermissions(): void {
    this.http
      .get<{ success: boolean; data: Permission[] }>(
        `${environment.apiUrl}/permisos.php`
      )
      .pipe(catchError((error) => this.handleError(error)))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.permissionsSubject.next(response.data);
          }
        },
      });
  }

  private loadRoles(): void {
    this.http
      .get<{ success: boolean; data: Role[] }>(
        `${environment.apiUrl}/roles.php`
      )
      .pipe(catchError((error) => this.handleError(error)))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.rolesSubject.next(response.data);
          }
        },
      });
  }

  private loadGroups(): void {
    this.http
      .get<{ success: boolean; data: Group[] }>(
        `${environment.apiUrl}/grupos.php`
      )
      .pipe(catchError((error) => this.handleError(error)))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.groupsSubject.next(response.data);
          }
        },
      });
  }

  // =====================
  // SESSION CHECK
  // =====================
  checkSessionValidity(): void {
    this.authService.validateToken().subscribe((isValid) => {
      if (!isValid) {
        this.authService.logout();
        this.router.navigate(['/login']);
      }
    });
  }

  // =====================
  // PERMISSIONS CRUD
  // =====================
  createPermission(permission: Omit<Permission, 'id'>): Observable<boolean> {
    return this.http
      .post<{ success: boolean; message: string }>(
        `${environment.apiUrl}/permisos.php`,
        permission
      )
      .pipe(
        map((response) => {
          if (response.success) this.loadPermissions();
          return response.success;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  updatePermission(permission: Permission): Observable<boolean> {
    return this.http
      .put<{ success: boolean; message: string }>(
        `${environment.apiUrl}/permisos.php`,
        permission
      )
      .pipe(
        map((response) => {
          if (response.success) this.loadPermissions();
          return response.success;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  deletePermission(id: number): Observable<boolean> {
    return this.http
      .delete<{ success: boolean; message: string }>(
        `${environment.apiUrl}/permisos.php?id=${id}`
      )
      .pipe(
        map((response) => {
          if (response.success) this.loadPermissions();
          return response.success;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  // =====================
  // ROLES CRUD
  // =====================
  createRole(role: Omit<Role, 'id'>): Observable<boolean> {
    return this.http
      .post<{ success: boolean; message: string }>(
        `${environment.apiUrl}/roles.php`,
        role
      )
      .pipe(
        map((response) => {
          if (response.success) this.loadRoles();
          return response.success;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  updateRole(role: Role): Observable<boolean> {
    return this.http
      .put<{ success: boolean; message: string }>(
        `${environment.apiUrl}/roles.php`,
        role
      )
      .pipe(
        map((response) => {
          if (response.success) this.loadRoles();
          return response.success;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  deleteRole(id: number): Observable<boolean> {
    return this.http
      .delete<{ success: boolean; message: string }>(
        `${environment.apiUrl}/roles.php?id=${id}`
      )
      .pipe(
        map((response) => {
          if (response.success) this.loadRoles();
          return response.success;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  // =====================
  // GROUPS CRUD
  // =====================
  createGroup(group: Omit<Group, 'id'>): Observable<boolean> {
    return this.http
      .post<{ success: boolean; message: string }>(
        `${environment.apiUrl}/grupos.php`,
        group
      )
      .pipe(
        map((response) => {
          if (response.success) this.loadGroups();
          return response.success;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  updateGroup(group: Group): Observable<boolean> {
    return this.http
      .put<{ success: boolean; message: string }>(
        `${environment.apiUrl}/grupos.php`,
        group
      )
      .pipe(
        map((response) => {
          if (response.success) this.loadGroups();
          return response.success;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  deleteGroup(id: number): Observable<boolean> {
    return this.http
      .delete<{ success: boolean; message: string }>(
        `${environment.apiUrl}/grupos.php?id=${id}`
      )
      .pipe(
        map((response) => {
          if (response.success) this.loadGroups();
          return response.success;
        }),
        catchError((error) => this.handleError(error))
      );
  }

  // Asignar rol a usuario
  assignRoleToUser(usuario_id: number, rol_id: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/asignar_rol.php`, {
      usuario_id,
      rol_id,
    });
  }

  // Asignar grupo a usuario
  assignGroupToUser(usuario_id: number, grupo_id: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/asignar_grupo.php`, {
      usuario_id,
      grupo_id,
    });
  }

  // =====================
  // HELPER
  // =====================
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Ocurrió un error';
    if (error.status === 401) {
      errorMessage = 'No autorizado - Sesión expirada';
    } else if (error.status === 403) {
      errorMessage = 'Permisos insuficientes';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }
    console.error('Error en PermissionService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  // =====================
  // UTILS
  // =====================
  userHasPermission(user: any, permissionName: string): boolean {
    if (!user || !user.roles) return false;
    return user.roles.some((role: Role) =>
      role.permisos.some(
        (permission: Permission) => permission.nombre === permissionName
      )
    );
  }
}
