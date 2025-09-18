import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // Añadir Router
import { Permission, Role, Group } from './permission.model';
import { PermissionService } from './permission.service';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-accesos-permisos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './accesos-permisos.component.html',
  styleUrls: ['./accesos-permisos.component.scss'],
})
export class AccessosPermisosComponent implements OnInit {
  permissions: Permission[] = [];
  roles: Role[] = [];
  groups: Group[] = [];

  selectedTab = 'permisos';
  searchPermission = '';
  searchRole = '';
  searchGroup = '';

  selectedPermission: Permission | null = null;
  selectedRole: Role | null = null;
  selectedGroup: Group | null = null;

  isEditingPermission = false;
  isEditingRole = false;
  isEditingGroup = false;

  constructor(
    private permissionService: PermissionService,
    public authService: AuthService,
    private router: Router // Inyectar Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.permissionService.permissions$.subscribe(
      (permissions: Permission[]) => {
        this.permissions = permissions;
      },
      (error) => {
        this.handlePermissionError(error);
      }
    );

    this.permissionService.roles$.subscribe(
      (roles: Role[]) => {
        this.roles = roles;
      },
      (error) => {
        this.handlePermissionError(error);
      }
    );

    this.permissionService.groups$.subscribe(
      (groups: Group[]) => {
        this.groups = groups;
      },
      (error) => {
        this.handlePermissionError(error);
      }
    );
  }

  private handlePermissionError(error: any): void {
    console.error('Error loading permissions data:', error);

    if (error.message.includes('Sesión expirada')) {
      // Verificar si realmente la sesión expiró o si es un error de permisos
      this.permissionService.checkSessionValidity();
    }
  }

  get filteredPermissions(): Permission[] {
    const searchTerm = this.searchPermission.toLowerCase();
    return this.permissions.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm) ||
        (p.description && p.description.toLowerCase().includes(searchTerm)) ||
        (p.category && p.category.toLowerCase().includes(searchTerm))
    );
  }

  get filteredRoles(): Role[] {
    const searchTerm = this.searchRole.toLowerCase();
    return this.roles.filter(
      (r) =>
        r.name.toLowerCase().includes(searchTerm) ||
        (r.description && r.description.toLowerCase().includes(searchTerm))
    );
  }

  get filteredGroups(): Group[] {
    const searchTerm = this.searchGroup.toLowerCase();
    return this.groups.filter(
      (g) =>
        g.name.toLowerCase().includes(searchTerm) ||
        (g.description && g.description.toLowerCase().includes(searchTerm))
    );
  }

  createPermission(): void {
    if (this.authService.hasPermission('permission_create')) {
      this.selectedPermission = {
        id: 0,
        name: '',
        description: '',
        category: '',
      };
      this.isEditingPermission = true;
    }
  }

  editPermission(permission: Permission): void {
    if (this.authService.hasPermission('permission_edit')) {
      this.selectedPermission = { ...permission };
      this.isEditingPermission = true;
    }
  }

  savePermission(): void {
    if (this.selectedPermission) {
      const operation =
        this.selectedPermission.id === 0
          ? this.permissionService.createPermission(this.selectedPermission)
          : this.permissionService.updatePermission(this.selectedPermission);

      operation.subscribe((success: boolean) => {
        if (success) {
          this.cancelEdit();
        }
      });
    }
  }

  deletePermission(id: number): void {
    if (this.authService.hasPermission('permission_delete')) {
      if (confirm('¿Está seguro de eliminar este permiso?')) {
        this.permissionService.deletePermission(id).subscribe();
      }
    }
  }

  createRole(): void {
    if (this.authService.hasPermission('role_create')) {
      this.selectedRole = {
        id: 0,
        name: '',
        description: '',
        permissions: [],
      };
      this.isEditingRole = true;
    }
  }

  editRole(role: Role): void {
    if (this.authService.hasPermission('role_edit')) {
      this.selectedRole = { ...role };
      this.isEditingRole = true;
    }
  }

  isPermissionInRole(permission: Permission): boolean {
    return (
      this.selectedRole?.permissions.some((p) => p.id === permission.id) ||
      false
    );
  }

  togglePermission(permission: Permission): void {
    if (!this.selectedRole) return;

    const index = this.selectedRole.permissions.findIndex(
      (p) => p.id === permission.id
    );
    if (index >= 0) {
      this.selectedRole.permissions.splice(index, 1);
    } else {
      this.selectedRole.permissions.push(permission);
    }
  }

  saveRole(): void {
    if (this.selectedRole) {
      const operation =
        this.selectedRole.id === 0
          ? this.permissionService.createRole(this.selectedRole)
          : this.permissionService.updateRole(this.selectedRole);

      operation.subscribe((success: boolean) => {
        if (success) {
          this.cancelEdit();
        }
      });
    }
  }

  deleteRole(id: number): void {
    if (this.authService.hasPermission('role_delete')) {
      if (confirm('¿Está seguro de eliminar este rol?')) {
        this.permissionService.deleteRole(id).subscribe();
      }
    }
  }

  createGroup(): void {
    if (this.authService.hasPermission('group_create')) {
      this.selectedGroup = {
        id: 0,
        name: '',
        description: '',
        roles: [],
        users: [],
      };
      this.isEditingGroup = true;
    }
  }

  editGroup(group: Group): void {
    if (this.authService.hasPermission('group_edit')) {
      this.selectedGroup = { ...group };
      this.isEditingGroup = true;
    }
  }

  isRoleInGroup(role: Role): boolean {
    return this.selectedGroup?.roles.some((r) => r.id === role.id) || false;
  }

  toggleRole(role: Role): void {
    if (!this.selectedGroup) return;

    const index = this.selectedGroup.roles.findIndex((r) => r.id === role.id);
    if (index >= 0) {
      this.selectedGroup.roles.splice(index, 1);
    } else {
      this.selectedGroup.roles.push(role);
    }
  }

  saveGroup(): void {
    if (this.selectedGroup) {
      const operation =
        this.selectedGroup.id === 0
          ? this.permissionService.createGroup(this.selectedGroup)
          : this.permissionService.updateGroup(this.selectedGroup);

      operation.subscribe((success: boolean) => {
        if (success) {
          this.cancelEdit();
        }
      });
    }
  }

  deleteGroup(id: number): void {
    if (this.authService.hasPermission('group_delete')) {
      if (confirm('¿Está seguro de eliminar este grupo?')) {
        this.permissionService.deleteGroup(id).subscribe();
      }
    }
  }

  cancelEdit(): void {
    this.selectedPermission = null;
    this.selectedRole = null;
    this.selectedGroup = null;
    this.isEditingPermission = false;
    this.isEditingRole = false;
    this.isEditingGroup = false;
  }

  logout(): void {
    // Implementar lógica de cierre de sesión
    this.authService.logout();
  }
}
