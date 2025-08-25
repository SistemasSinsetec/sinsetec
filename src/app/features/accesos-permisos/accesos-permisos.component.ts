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
  id: number;
  empresa_id: number;
  nombre: string;
  email: string;
  password: string;
  rol: string;
  activo: boolean;
  fecha_registro: string;
  empresa?: Empresa;
}

interface Permiso {
  id: number;
  nombre: string;
  descripcion: string;
  clave: string;
  activo: boolean;
}

interface PermisoUsuario {
  id: number;
  usuario_id: number;
  permiso_id: number;
  concedido: boolean;
  fecha_asignacion: string;
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
  permisosUsuario: PermisoUsuario[] = [];

  empresaSeleccionada: Empresa | null = null;
  usuarioSeleccionado: Usuario | null = null;
  isLoading = true;
  buscadorUsuario = '';

  mostrarFormularioRegistro = false;
  nuevoUsuario: any = {
    nombre: '',
    email: '',
    password: '',
    rol: 'Usuario',
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales() {
    this.isLoading = true;

    // Cargar empresa del usuario actual
    this.http.get<Empresa>('/api/mi-empresa.php').subscribe({
      next: (empresa) => {
        this.empresaSeleccionada = empresa;
        this.cargarUsuariosEmpresa();
        this.cargarPermisos();
      },
      error: (error) => {
        console.error('Error cargando empresa:', error);
        this.isLoading = false;
      },
    });
  }

  cargarUsuariosEmpresa() {
    if (!this.empresaSeleccionada) return;

    this.http
      .get<Usuario[]>(
        `/api/usuarios-empresa.php?empresa_id=${this.empresaSeleccionada.id}`
      )
      .subscribe({
        next: (usuarios) => {
          this.usuarios = usuarios;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error cargando usuarios:', error);
          this.isLoading = false;
        },
      });
  }

  cargarPermisos() {
    this.http.get<Permiso[]>('/api/permisos.php').subscribe({
      next: (permisos) => {
        this.permisos = permisos;
        if (this.usuarioSeleccionado) {
          this.cargarPermisosUsuario(this.usuarioSeleccionado.id);
        }
      },
      error: (error) => {
        console.error('Error cargando permisos:', error);
      },
    });
  }

  cargarPermisosUsuario(usuarioId: number) {
    this.http
      .get<PermisoUsuario[]>(
        `/api/permisos-usuario.php?usuario_id=${usuarioId}`
      )
      .subscribe({
        next: (permisosUsuario) => {
          this.permisosUsuario = permisosUsuario;
        },
        error: (error) => {
          console.error('Error cargando permisos de usuario:', error);
        },
      });
  }

  seleccionarUsuario(usuario: Usuario) {
    this.usuarioSeleccionado = usuario;
    this.cargarPermisosUsuario(usuario.id);
  }

  tienePermiso(usuarioId: number, permisoId: number): boolean {
    const permiso = this.permisosUsuario.find(
      (pu) => pu.usuario_id === usuarioId && pu.permiso_id === permisoId
    );
    return permiso ? permiso.concedido : false;
  }

  togglePermiso(permisoId: number, concedido: boolean) {
    if (!this.usuarioSeleccionado) return;

    const payload = {
      usuario_id: this.usuarioSeleccionado.id,
      permiso_id: permisoId,
      concedido: concedido,
    };

    this.http.post('/api/actualizar-permiso.php', payload).subscribe({
      next: (response: any) => {
        const index = this.permisosUsuario.findIndex(
          (pu) =>
            pu.usuario_id === this.usuarioSeleccionado!.id &&
            pu.permiso_id === permisoId
        );

        if (index !== -1) {
          this.permisosUsuario[index].concedido = concedido;
        } else {
          this.permisosUsuario.push({
            id: response.id || Date.now(),
            usuario_id: this.usuarioSeleccionado!.id,
            permiso_id: permisoId,
            concedido: concedido,
            fecha_asignacion: new Date().toISOString(),
          });
        }
      },
      error: (error) => {
        console.error('Error actualizando permiso:', error);
        alert('Error al ac.tualizar el permiso');
      },
    });
  }

  registrarNuevoUsuario() {
    if (!this.empresaSeleccionada) {
      alert('No hay empresa seleccionada');
      return;
    }

    if (
      !this.nuevoUsuario.nombre ||
      !this.nuevoUsuario.email ||
      !this.nuevoUsuario.password
    ) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    const payload = {
      ...this.nuevoUsuario,
      empresa_id: this.empresaSeleccionada.id,
    };

    this.http.post('/api/registrar-usuario.php', payload).subscribe({
      next: (response: any) => {
        alert('Usuario registrado correctamente');
        this.mostrarFormularioRegistro = false;
        this.nuevoUsuario = {
          nombre: '',
          email: '',
          password: '',
          rol: 'Usuario',
        };
        this.cargarUsuariosEmpresa();
      },
      error: (error) => {
        console.error('Error registrando usuario:', error);
        alert(
          'Error al registrar el usuario: ' +
            (error.error?.message || error.message)
        );
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
      .post('/api/actualizar-usuario.php', {
        usuario_id: usuario.id,
        activo: nuevoEstado,
      })
      .subscribe({
        next: () => {
          usuario.activo = nuevoEstado;
          if (usuario.id === this.usuarioSeleccionado?.id) {
            this.usuarioSeleccionado.activo = nuevoEstado;
          }
        },
        error: (error) => {
          console.error('Error actualizando usuario:', error);
          alert('Error al actualizar el usuario');
        },
      });
  }

  get usuariosFiltrados(): Usuario[] {
    if (!this.buscadorUsuario) return this.usuarios;

    const termino = this.buscadorUsuario.toLowerCase();
    return this.usuarios.filter(
      (usuario) =>
        usuario.nombre.toLowerCase().includes(termino) ||
        usuario.email.toLowerCase().includes(termino) ||
        usuario.rol.toLowerCase().includes(termino)
    );
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
