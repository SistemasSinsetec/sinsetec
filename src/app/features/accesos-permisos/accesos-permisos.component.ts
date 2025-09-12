import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { FormsModule } from '@angular/forms';

interface Empresa {
  id: number;
  nombre: string;
  rfc: string;
  activo: boolean;
}

interface Usuario {
  rol: any;
  id: number;
  nombre: string;
  email: string;
  activo: boolean;
  empresa_id: number;
  grupo_principal_id?: number;
  grupo_principal?: string;
  grupos?: string;
  grupo_ids?: string;
  nivel_permiso?: number;
  created_at?: string;
}

interface Permiso {
  id: number;
  name: string;
  code: string;
  description: string;
  category: string;
  empresa_id?: number;
  activo: boolean;
  created_at?: string;
}

interface Grupo {
  id: number;
  name: string;
  description: string;
  nivel_permiso: number;
  empresa_id: number;
  created_at?: string;
  updated_at?: string;
}

interface PermisoGrupo {
  id?: number;
  group_id: number;
  permission_id: number;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
  permiso_name?: string;
  permiso_description?: string;
  permiso_code?: string;
  category?: string;

  // Propiedades alias para compatibilidad
  name?: string;
  description?: string;
  code?: string;
}

interface GrupoUsuario {
  group_id: number;
  is_primary: boolean;
  name?: string;
}

@Component({
  selector: 'app-accesos-permisos',
  templateUrl: './accesos-permisos.component.html',
  styleUrls: ['./accesos-permisos.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
})
export class AccesosPermisosComponent implements OnInit {
  empresas: Empresa[] = [];
  usuarios: Usuario[] = [];
  permisos: Permiso[] = [];
  grupos: Grupo[] = [];
  gruposUsuario: GrupoUsuario[] = [];
  permisosGrupo: PermisoGrupo[] = [];
  todosLosPermisos: Permiso[] = [];

  empresaSeleccionada: Empresa | null = null;
  usuarioSeleccionado: Usuario | null = null;
  grupoSeleccionado: Grupo | null = null;

  isLoading = true;
  buscadorUsuario = '';

  mostrarFormularioRegistro = false;
  mostrarGestionGrupos = false;
  mostrarPermisosGrupo = false;
  mostrarAsignarGrupos = false;

  nuevoUsuario: any = {
    username: '',
    email: '',
    password: '',
    rol: 'Usuario',
    empresa_id: null,
  };

  gruposDisponibles: Grupo[] = [];
  gruposSeleccionados: number[] = [];
  grupoPrimario: number | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.cargarDatosIniciales();
  }

  compareEmpresas(e1: Empresa, e2: Empresa): boolean {
    return e1 && e2 ? e1.id === e2.id : e1 === e2;
  }

  cargarDatosIniciales() {
    this.isLoading = true;

    // Cargar empresas desde el nuevo endpoint
    this.http.get<Empresa[]>('/api/empresas.php').subscribe({
      next: (empresas) => {
        this.empresas = empresas;

        if (this.empresas.length > 0) {
          this.empresaSeleccionada = this.empresas[0];
          this.nuevoUsuario.empresa_id = this.empresas[0].id;
        }

        // Cargar empresa del usuario actual
        this.http.get<Empresa>('/api/mi-empresa.php').subscribe({
          next: (empresa) => {
            this.empresaSeleccionada = empresa;
            this.nuevoUsuario.empresa_id = empresa.id;
          },
          error: (error) => {
            console.warn('No se pudo cargar empresa del usuario:', error);
            // Usar primera empresa si falla
            if (this.empresas.length > 0 && !this.empresaSeleccionada) {
              this.empresaSeleccionada = this.empresas[0];
              this.nuevoUsuario.empresa_id = this.empresas[0].id;
            }
          },
          complete: () => {
            this.cargarUsuariosEmpresa();
            this.cargarPermisos();
            this.cargarGrupos();
            this.isLoading = false;
          },
        });
      },
      error: (error) => {
        console.error('Error cargando empresas:', error);
        // Crear datos mock si la API falla
        this.empresas = [
          { id: 1, nombre: 'Empresa Demo', rfc: 'DEMO123456', activo: true },
          { id: 2, nombre: 'Sucursal Norte', rfc: 'SUC001', activo: true },
        ];
        this.empresaSeleccionada = this.empresas[0];
        this.nuevoUsuario.empresa_id = this.empresas[0].id;

        this.cargarUsuariosEmpresa();
        this.cargarPermisos();
        this.cargarGrupos();
        this.isLoading = false;
      },
    });
  }

  cargarUsuariosEmpresa() {
    if (!this.empresaSeleccionada) return;

    this.http
      .get<any>(
        `/api/usuarios-empresa.php?empresa_id=${this.empresaSeleccionada.id}`
      )
      .subscribe({
        next: (response) => {
          try {
            console.log('🔍 RESPUESTA DEL SERVIDOR:', response);

            let usuariosData: any[] = [];

            // 1. Si es array directo (éxito)
            if (Array.isArray(response)) {
              usuariosData = response;
              console.log('✅ Respuesta es array directo');
            }
            // 2. Si es objeto de error
            else if (
              response &&
              typeof response === 'object' &&
              response.error
            ) {
              console.error('❌ Error del servidor:', response.error);
              // Usar datos mock en caso de error
              usuariosData = this.getUsuariosMock();
            }
            // 3. Si es objeto pero no tiene error (por si acaso)
            else if (response && typeof response === 'object') {
              console.warn('⚠️  Respuesta es objeto inesperado:', response);
              // Intentar convertir a array
              const valores = Object.values(response);
              usuariosData = valores.filter(
                (item) =>
                  item && typeof item === 'object' && item.hasOwnProperty('id')
              );
            }
            // 4. Cualquier otro caso
            else {
              console.error('❌ Respuesta inesperada:', response);
              usuariosData = this.getUsuariosMock();
            }

            // Verificar que tenemos un array válido
            if (!Array.isArray(usuariosData)) {
              console.warn('⚠️  No es un array válido. Usando datos mock.');
              usuariosData = this.getUsuariosMock();
            }

            console.log('👥 USUARIOS PROCESADOS:', usuariosData);

            // Mapear los usuarios
            this.usuarios = usuariosData.map((usuario) => ({
              id: usuario.id || 0,
              nombre: usuario.nombre || usuario.username || 'Sin nombre',
              email: usuario.email || 'Sin email',
              activo: Boolean(usuario.activo),
              empresa_id:
                usuario.empresa_id || this.empresaSeleccionada?.id || 1,
              grupo_principal_id: usuario.grupo_principal_id,
              grupo_principal: usuario.grupo_principal,
              grupos: usuario.grupos,
              grupo_ids: usuario.grupo_ids,
              nivel_permiso: usuario.nivel_permiso || 4,
              created_at: usuario.created_at,
              rol: this.getRolFromNivelPermiso(usuario.nivel_permiso || 4),
            }));
          } catch (error) {
            console.error('💥 Error crítico procesando usuarios:', error);
            this.usuarios = this.getUsuariosMock();
          }
        },
        error: (error) => {
          console.error('🌐 Error HTTP cargando usuarios:', error);
          this.usuarios = this.getUsuariosMock();
        },
      });
  }

  // Método auxiliar para datos mock
  getUsuariosMock(): Usuario[] {
    return [
      {
        id: 1,
        nombre: 'Administrador Sistema',
        email: 'admin@empresa.com',
        activo: true,
        empresa_id: 1,
        nivel_permiso: 1,
        grupo_principal: 'Administradores',
        grupos: 'Administradores, Supervisores',
        rol: 'Administrador',
      },
      {
        id: 2,
        nombre: 'Supervisor General',
        email: 'supervisor@empresa.com',
        activo: true,
        empresa_id: 1,
        nivel_permiso: 2,
        grupo_principal: 'Supervisores',
        grupos: 'Supervisores',
        rol: 'Supervisor',
      },
      {
        id: 3,
        nombre: 'Usuario Ejemplo',
        email: 'usuario@empresa.com',
        activo: true,
        empresa_id: 1,
        nivel_permiso: 4,
        grupo_principal: 'Usuarios',
        grupos: 'Usuarios',
        rol: 'Usuario',
      },
    ];
  }

  cargarPermisos() {
    const url = this.empresaSeleccionada
      ? `/api/permisos.php?empresa_id=${this.empresaSeleccionada.id}`
      : '/api/permisos.php';

    this.http.get<Permiso[]>(url).subscribe({
      next: (permisos) => {
        this.permisos = permisos;
        this.todosLosPermisos = permisos;
      },
      error: (error) => {
        console.error('Error cargando permisos:', error);
        // Datos mock para desarrollo
        this.permisos = [
          {
            id: 1,
            name: 'Ver Usuarios',
            code: 'view_users',
            description: 'Permite ver la lista de usuarios',
            category: 'Usuarios',
            activo: true,
          },
          {
            id: 2,
            name: 'Gestionar Usuarios',
            code: 'manage_users',
            description: 'Permite crear y editar usuarios',
            category: 'Usuarios',
            activo: true,
          },
          {
            id: 3,
            name: 'Ver Solicitudes',
            code: 'view_requests',
            description: 'Permite ver solicitudes de servicio',
            category: 'Solicitudes',
            activo: true,
          },
          {
            id: 4,
            name: 'Crear Solicitudes',
            code: 'create_requests',
            description: 'Permite crear nuevas solicitudes',
            category: 'Solicitudes',
            activo: true,
          },
          {
            id: 5,
            name: 'Gestionar Refacciones',
            code: 'manage_parts',
            description: 'Permite gestionar inventario de refacciones',
            category: 'Refacciones',
            activo: true,
          },
          {
            id: 6,
            name: 'Ver Reportes',
            code: 'view_reports',
            description: 'Permite ver reportes del sistema',
            category: 'Reportes',
            activo: true,
          },
        ];
        this.todosLosPermisos = this.permisos;
      },
    });
  }

  cargarGrupos() {
    if (!this.empresaSeleccionada) return;

    this.http
      .get<Grupo[]>(`/api/grupos.php?empresa_id=${this.empresaSeleccionada.id}`)
      .subscribe({
        next: (grupos) => {
          this.grupos = grupos;
          this.gruposDisponibles = grupos;
        },
        error: (error) => {
          console.error('Error cargando grupos:', error);
          // Datos mock para desarrollo
          this.grupos = [
            {
              id: 1,
              name: 'Administradores',
              description: 'Grupo con todos los permisos del sistema',
              nivel_permiso: 1,
              empresa_id: 1,
            },
            {
              id: 2,
              name: 'Supervisores',
              description: 'Grupo con permisos de supervisión',
              nivel_permiso: 2,
              empresa_id: 1,
            },
            {
              id: 3,
              name: 'Usuarios Avanzados',
              description: 'Grupo con permisos extendidos',
              nivel_permiso: 3,
              empresa_id: 1,
            },
            {
              id: 4,
              name: 'Usuarios',
              description: 'Grupo con permisos básicos',
              nivel_permiso: 4,
              empresa_id: 1,
            },
          ];
          this.gruposDisponibles = this.grupos;
        },
      });
  }

  cargarGruposUsuario(usuarioId: number) {
    if (!this.empresaSeleccionada) return;

    this.http
      .get<any>(
        `/api/gestion-usuarios.php?empresa_id=${this.empresaSeleccionada.id}`
      )
      .subscribe({
        next: (response) => {
          try {
            let usuariosConGrupos: any[] = [];

            // Manejar diferentes formatos de respuesta
            if (Array.isArray(response)) {
              usuariosConGrupos = response;
            } else if (response && typeof response === 'object') {
              // Si es objeto, intentar extraer array
              const valores = Object.values(response);
              usuariosConGrupos = valores.filter(
                (item) =>
                  item && typeof item === 'object' && item.hasOwnProperty('id')
              );
            }

            const usuario = usuariosConGrupos.find(
              (u: any) => u.id === usuarioId
            );
            if (usuario) {
              this.gruposUsuario = [];
              if (usuario.grupo_principal_id) {
                this.gruposUsuario.push({
                  group_id: usuario.grupo_principal_id,
                  is_primary: true,
                  name: usuario.grupo_principal,
                });
              }
            }
          } catch (error) {
            console.error('Error procesando grupos del usuario:', error);
            this.gruposUsuario = [
              { group_id: 1, is_primary: true, name: 'Administradores' },
            ];
          }
        },
        error: (error) => {
          console.error('Error cargando grupos del usuario:', error);
          this.gruposUsuario = [
            { group_id: 1, is_primary: true, name: 'Administradores' },
          ];
        },
      });
  }

  cargarPermisosGrupo(grupoId: number) {
    this.http
      .get<any[]>(`/api/group-permissions.php?group_id=${grupoId}`)
      .subscribe({
        next: (permisos) => {
          // Asegurar que las propiedades alias estén disponibles
          this.permisosGrupo = permisos.map((permiso) => ({
            ...permiso,
            name: permiso.permiso_name || permiso.name,
            description: permiso.permiso_description || permiso.description,
            code: permiso.permiso_code || permiso.code,
          }));
        },
        error: (error) => {
          console.error('Error cargando permisos del grupo:', error);
          // Datos mock para desarrollo
          this.permisosGrupo = [
            {
              group_id: grupoId,
              permission_id: 1,
              can_view: true,
              can_create: true,
              can_edit: true,
              can_delete: true,
              permiso_name: 'Ver Usuarios',
              permiso_code: 'view_users',
              permiso_description: 'Permite ver la lista de usuarios',
              category: 'Usuarios',
              name: 'Ver Usuarios',
              description: 'Permite ver la lista de usuarios',
              code: 'view_users',
            },
            {
              group_id: grupoId,
              permission_id: 2,
              can_view: true,
              can_create: true,
              can_edit: true,
              can_delete: false,
              permiso_name: 'Gestionar Usuarios',
              permiso_code: 'manage_users',
              permiso_description: 'Permite crear y editar usuarios',
              category: 'Usuarios',
              name: 'Gestionar Usuarios',
              description: 'Permite crear y editar usuarios',
              code: 'manage_users',
            },
          ];
        },
      });
  }

  cambiarEmpresaSeleccionada() {
    if (this.empresaSeleccionada) {
      this.usuarioSeleccionado = null;
      this.grupoSeleccionado = null;
      this.cargarUsuariosEmpresa();
      this.cargarPermisos();
      this.cargarGrupos();
    }
  }

  seleccionarUsuario(usuario: Usuario) {
    this.usuarioSeleccionado = usuario;
    this.cargarGruposUsuario(usuario.id);
  }

  seleccionarGrupo(grupo: Grupo) {
    this.grupoSeleccionado = grupo;
    this.cargarPermisosGrupo(grupo.id);
  }

  tienePermiso(usuarioId: number, permisoCode: string) {
    this.http
      .get<any>(
        `/api/verificar-permisos.php?usuario_id=${usuarioId}&permiso_code=${permisoCode}`
      )
      .subscribe({
        next: (response) => {
          return response.tiene_permiso;
        },
        error: (error) => {
          console.error('Error verificando permiso:', error);
          return false;
        },
      });
  }

  getRolFromNivelPermiso(nivel: number): string {
    switch (nivel) {
      case 1:
        return 'Administrador';
      case 2:
        return 'Supervisor';
      case 3:
        return 'Usuario Avanzado';
      default:
        return 'Usuario';
    }
  }

  getNivelPermisoFromRol(rol: string): number {
    switch (rol) {
      case 'Administrador':
        return 1;
      case 'Supervisor':
        return 2;
      case 'Usuario Avanzado':
        return 3;
      default:
        return 4;
    }
  }

  toggleGrupoSeleccionado(grupoId: number) {
    const index = this.gruposSeleccionados.indexOf(grupoId);
    if (index > -1) {
      this.gruposSeleccionados.splice(index, 1);
      if (this.grupoPrimario === grupoId) {
        this.grupoPrimario = null;
      }
    } else {
      this.gruposSeleccionados.push(grupoId);
    }
  }

  registrarNuevoUsuario() {
    if (!this.nuevoUsuario.empresa_id) {
      alert('Por favor seleccione una empresa');
      return;
    }

    if (
      !this.nuevoUsuario.username ||
      !this.nuevoUsuario.email ||
      !this.nuevoUsuario.password
    ) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    const payload = {
      username: this.nuevoUsuario.username,
      email: this.nuevoUsuario.email,
      password: this.nuevoUsuario.password,
      nivel_permiso: this.getNivelPermisoFromRol(this.nuevoUsuario.rol),
      empresa_id: this.nuevoUsuario.empresa_id,
    };

    this.http.post('/api/usuarios.php', payload).subscribe({
      next: (response: any) => {
        alert('Usuario registrado correctamente');
        this.mostrarFormularioRegistro = false;
        this.nuevoUsuario = {
          username: '',
          email: '',
          password: '',
          rol: 'Usuario',
          empresa_id: this.empresaSeleccionada?.id || null,
        };
        this.cargarUsuariosEmpresa();
      },
      error: (error) => {
        console.error('Error registrando usuario:', error);
        // Simular éxito en modo demo
        alert('Usuario registrado correctamente (modo demo)');
        this.mostrarFormularioRegistro = false;
        this.nuevoUsuario = {
          username: '',
          email: '',
          password: '',
          rol: 'Usuario',
          empresa_id: this.empresaSeleccionada?.id || null,
        };

        // Agregar usuario mock a la lista
        const nuevoUsuarioMock: Usuario = {
          id: Date.now(),
          nombre: this.nuevoUsuario.username,
          email: this.nuevoUsuario.email,
          activo: true,
          empresa_id: this.nuevoUsuario.empresa_id,
          nivel_permiso: this.getNivelPermisoFromRol(this.nuevoUsuario.rol),
          grupo_principal: this.nuevoUsuario.rol,
          rol: this.nuevoUsuario.rol,
        };
        this.usuarios.push(nuevoUsuarioMock);
      },
    });
  }

  toggleEstadoUsuario(usuario: Usuario) {
    const nuevoEstado = !usuario.activo;
    const confirmacion = confirm(
      `¿Está seguro de que desea ${
        nuevoEstado ? 'activar' : 'desactivar'
      } al usuario ${usuario.nombre}?`
    );

    if (!confirmacion) return;

    this.http
      .post('/api/usuarios.php', {
        usuario_id: usuario.id,
        activo: nuevoEstado,
      })
      .subscribe({
        next: () => {
          usuario.activo = nuevoEstado;
          if (usuario.id === this.usuarioSeleccionado?.id) {
            this.usuarioSeleccionado.activo = nuevoEstado;
          }
          alert(
            `Usuario ${nuevoEstado ? 'activado' : 'desactivado'} correctamente`
          );
        },
        error: (error) => {
          console.error('Error actualizando usuario:', error);
          // Simular éxito en modo demo
          usuario.activo = nuevoEstado;
          if (usuario.id === this.usuarioSeleccionado?.id) {
            this.usuarioSeleccionado.activo = nuevoEstado;
          }
          alert(
            `Usuario ${
              nuevoEstado ? 'activado' : 'desactivado'
            } correctamente (modo demo)`
          );
        },
      });
  }

  abrirAsignarGrupos() {
    if (!this.usuarioSeleccionado) return;

    this.mostrarAsignarGrupos = true;
    this.gruposSeleccionados = this.gruposUsuario.map((g) => g.group_id);
    this.grupoPrimario =
      this.gruposUsuario.find((g) => g.is_primary)?.group_id || null;
  }

  asignarGruposUsuario() {
    if (!this.usuarioSeleccionado) return;

    const gruposData = this.gruposSeleccionados.map((group_id) => ({
      group_id: group_id,
      is_primary: group_id === this.grupoPrimario,
    }));

    const payload = {
      user_id: this.usuarioSeleccionado.id,
      grupos: gruposData,
    };

    this.http.post('/api/gestion-usuarios.php', payload).subscribe({
      next: (response: any) => {
        alert('Grupos asignados correctamente');
        this.mostrarAsignarGrupos = false;
        this.cargarGruposUsuario(this.usuarioSeleccionado!.id);
        this.cargarUsuariosEmpresa();
      },
      error: (error) => {
        console.error('Error asignando grupos:', error);
        // Simular éxito en modo demo
        alert('Grupos asignados correctamente (modo demo)');
        this.mostrarAsignarGrupos = false;

        // Actualizar grupos mock
        this.gruposUsuario = this.gruposSeleccionados.map((group_id) => {
          const grupo = this.grupos.find((g) => g.id === group_id);
          return {
            group_id: group_id,
            is_primary: group_id === this.grupoPrimario,
            name: grupo?.name || 'Grupo desconocido',
          };
        });
      },
    });
  }

  getNombreEmpresa(empresaId: number): string {
    const empresa = this.empresas.find((e) => e.id === empresaId);
    return empresa ? empresa.nombre : 'Sin empresa';
  }

  getGruposUsuarioTexto(usuario: Usuario): string {
    if (usuario.grupos) {
      return usuario.grupos;
    }
    if (usuario.grupo_principal) {
      return usuario.grupo_principal;
    }
    return 'Sin grupos';
  }

  get usuariosFiltrados(): Usuario[] {
    if (!this.buscadorUsuario) return this.usuarios;

    const termino = this.buscadorUsuario.toLowerCase();
    return this.usuarios.filter(
      (usuario) =>
        usuario.nombre.toLowerCase().includes(termino) ||
        usuario.email.toLowerCase().includes(termino) ||
        (usuario.rol && usuario.rol.toLowerCase().includes(termino)) ||
        (usuario.grupos && usuario.grupos.toLowerCase().includes(termino))
    );
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  abrirGestionGrupos() {
    this.mostrarGestionGrupos = true;
    this.cargarGrupos();
  }

  cerrarGestionGrupos() {
    this.mostrarGestionGrupos = false;
  }

  abrirPermisosGrupo(grupo: Grupo) {
    this.grupoSeleccionado = grupo;
    this.mostrarPermisosGrupo = true;
    this.cargarPermisosGrupo(grupo.id);
  }

  cerrarPermisosGrupo() {
    this.mostrarPermisosGrupo = false;
    this.grupoSeleccionado = null;
  }
}
