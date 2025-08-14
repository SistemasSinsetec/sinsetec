import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface Articulo {
  id: number;
  cliente: string;
  empresa: string;
  clave_interna: string;
  cantidad: number;
  disponible: boolean;
  unidad_medida: string;
  descripcion: string;
  estado_articulo: string;
  costo_compra: number;
  rack: string;
  cajon: string;
  categoria1: string;
  categoria2: string;
  categoria3: string;
  categoria4: string;
  categoria5: string;
  archivo: File | null;
  archivosAdjuntos: any[];
  solicitante: string;
  departamento: string;
  fecha_requerida: string;
  prioridad: string;
  notas_solicitud: string;
  estado_solicitud: string;
}

@Component({
  selector: 'app-control-refacciones',
  templateUrl: './control-refacciones.component.html',
  styleUrls: ['./control-refacciones.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink, RouterOutlet],
})
export class ControlRefaccionesComponent {
  articulo: Articulo = {
    id: 0,
    cliente: '',
    empresa: '',
    clave_interna: '',
    cantidad: 0,
    disponible: true,
    unidad_medida: '',
    descripcion: '',
    estado_articulo: '',
    costo_compra: 0,
    rack: '',
    cajon: '',
    categoria1: '',
    categoria2: '',
    categoria3: '',
    categoria4: '',
    categoria5: '',
    archivo: null,
    archivosAdjuntos: [],
    solicitante: '',
    departamento: '',
    fecha_requerida: new Date().toISOString().split('T')[0],
    prioridad: 'normal',
    notas_solicitud: '',
    estado_solicitud: 'pendiente',
  };

  estaEditando = false;
  mostrandoFormularioPedido = false;
  archivoNombre = 'Sin Archivo';
  buscadorClave = '';
  refacciones: any[] = [];
  apiUrl = '/api/refacciones.php'; // Ruta correcta con extensión .php

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.cargarRefacciones();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.articulo.archivo = input.files[0];
      this.archivoNombre = this.articulo.archivo.name;
      console.log('Archivo seleccionado:', this.articulo.archivo);
    }
  }

  guardarArticulo(): void {
    if (!this.articulo.clave_interna) {
      alert('La clave interna es obligatoria');
      return;
    }

    if (!this.articulo.descripcion) {
      alert('La descripción es obligatoria');
      return;
    }

    const formData = new FormData();

    // Solo incluir campos necesarios para evitar problemas
    const camposRequeridos: Array<keyof Articulo> = [
      'clave_interna',
      'descripcion',
      'cantidad',
      'cliente',
      'empresa',
      'unidad_medida',
      'costo_compra',
      'rack',
      'cajon',
      'categoria1',
      'categoria2',
      'categoria3',
      'categoria4',
      'categoria5',
    ];

    camposRequeridos.forEach((key) => {
      if (this.articulo[key] !== undefined && this.articulo[key] !== null) {
        formData.append(key, this.articulo[key].toString());
      }
    });

    if (this.articulo.archivo) {
      formData.append(
        'archivo',
        this.articulo.archivo,
        this.articulo.archivo.name
      );
    }

    // Debug: Mostrar contenido de FormData
    console.log('Contenido de FormData:');
    formData.forEach((value, key) => {
      console.log(key, value);
    });

    const httpOptions = {
      headers: new HttpHeaders({
        Accept: 'application/json',
        // No establecer Content-Type para FormData
      }),
    };

    if (this.estaEditando) {
      console.log(`Actualizando artículo ID: ${this.articulo.id}`);
      this.http
        .put(`${this.apiUrl}/${this.articulo.id}`, formData, httpOptions)
        .subscribe({
          next: (res) => {
            console.log('Respuesta del servidor:', res);
            alert('Artículo actualizado correctamente');
            this.cargarRefacciones();
            this.resetFormulario();
          },
          error: (err) => {
            console.error('Error al actualizar:', err);
            alert(`Error al actualizar el artículo: ${err.message}`);
          },
        });
    } else {
      console.log('Creando nuevo artículo');
      this.http.post(this.apiUrl, formData, httpOptions).subscribe({
        next: (res) => {
          console.log('Respuesta del servidor:', res);
          alert('Artículo creado correctamente');
          this.cargarRefacciones();
          this.resetFormulario();
        },
        error: (err) => {
          console.error('Error al crear:', err);
          alert(`Error al crear el artículo: ${err.message}`);
        },
      });
    }
  }

  cargarRefacciones() {
    console.log('Iniciando carga de refacciones desde:', this.apiUrl);
    this.http.get(this.apiUrl).subscribe({
      next: (data: any) => {
        console.log('Datos recibidos:', data);
        this.refacciones = data;
      },
      error: (err) => {
        console.error('Error completo al cargar refacciones:', err);
        console.error('URL solicitada:', err.url);
        console.error('Status:', err.status);
        console.error('Error details:', err.error);

        alert(
          'Error al cargar las refacciones. Verifica la conexión al servidor.'
        );

        // Datos de prueba para desarrollo
        console.warn('Usando datos de prueba para desarrollo');
        this.refacciones = [
          {
            id: 1,
            clave_interna: 'RF-001',
            descripcion: 'Ejemplo de refacción',
            cantidad: 10,
            disponible: true,
            cliente: 'Cliente Demo',
            empresa: 'Empresa Demo',
          },
        ];
      },
    });
  }

  buscarArticulo(): void {
    if (!this.buscadorClave.trim()) {
      this.cargarRefacciones();
      return;
    }

    const termino = this.buscadorClave.toLowerCase();
    this.refacciones = this.refacciones.filter(
      (r: { clave_interna: string; descripcion: string }) =>
        r.clave_interna.toLowerCase().includes(termino) ||
        r.descripcion.toLowerCase().includes(termino)
    );
  }

  seleccionarArticulo(refaccion: any): void {
    console.log('Seleccionando artículo:', refaccion);
    this.articulo = {
      ...this.articulo, // Mantener valores actuales
      ...refaccion, // Sobrescribir con los valores de la refacción seleccionada
      archivo: null,
      archivosAdjuntos: refaccion.archivosAdjuntos || [],
      fecha_requerida:
        refaccion.fecha_requerida || new Date().toISOString().split('T')[0],
      estado_solicitud: refaccion.estado_solicitud || 'pendiente',
      prioridad: refaccion.prioridad || 'normal',
    };
    this.estaEditando = true;
    this.archivoNombre = 'Sin Archivo';
    console.log('Artículo cargado para edición:', this.articulo);
  }

  nuevoArticulo(): void {
    console.log('Preparando formulario para nuevo artículo');
    this.resetFormulario();
  }

  eliminarArticulo(): void {
    if (!this.articulo.id) {
      alert('No hay artículo seleccionado para eliminar');
      return;
    }

    if (confirm('¿Estás seguro de eliminar este artículo?')) {
      console.log(`Eliminando artículo ID: ${this.articulo.id}`);
      this.http.delete(`${this.apiUrl}/${this.articulo.id}`).subscribe({
        next: () => {
          alert('Artículo eliminado correctamente');
          this.cargarRefacciones();
          this.resetFormulario();
        },
        error: (err) => {
          console.error('Error al eliminar:', err);
          alert('Error al eliminar el artículo');
        },
      });
    }
  }

  descargarArchivo(archivoId: number): void {
    console.log(`Descargando archivo ID: ${archivoId}`);
    const url = `${this.apiUrl}/archivo/${archivoId}`;
    window.open(url, '_blank');
  }

  eliminarArchivo(archivoId: number): void {
    if (confirm('¿Estás seguro de eliminar este archivo?')) {
      console.log(`Eliminando archivo ID: ${archivoId}`);
      this.http.delete(`${this.apiUrl}/archivo/${archivoId}`).subscribe({
        next: () => {
          this.articulo.archivosAdjuntos =
            this.articulo.archivosAdjuntos.filter((a) => a.id !== archivoId);
          alert('Archivo eliminado correctamente');
        },
        error: (err) => {
          console.error('Error al eliminar archivo:', err);
          alert('Error al eliminar el archivo');
        },
      });
    }
  }

  solicitarPedido(): void {
    if (!this.articulo.id) {
      alert('Primero selecciona una refacción');
      return;
    }
    console.log('Solicitando pedido para artículo ID:', this.articulo.id);
    this.mostrandoFormularioPedido = true;
  }

  enviarSolicitudPedido(): void {
    if (!this.articulo.solicitante) {
      alert('El nombre del solicitante es requerido');
      return;
    }

    console.log('Enviando solicitud de pedido:', this.articulo);

    if (this.articulo.estado_solicitud === 'aprobado') {
      this.articulo.disponible = false;
    }

    this.http
      .put(`${this.apiUrl}/${this.articulo.id}/solicitud`, this.articulo)
      .subscribe({
        next: () => {
          alert('Solicitud de pedido registrada correctamente');
          this.mostrandoFormularioPedido = false;
        },
        error: (err) => {
          console.error('Error al guardar solicitud:', err);
          alert('Error al registrar la solicitud');
        },
      });
  }

  cancelarSolicitud(): void {
    console.log('Cancelando solicitud de pedido');
    this.mostrandoFormularioPedido = false;
  }

  private resetFormulario(): void {
    console.log('Reseteando formulario');
    this.articulo = {
      id: 0,
      cliente: '',
      empresa: '',
      clave_interna: '',
      cantidad: 0,
      disponible: true,
      unidad_medida: '',
      descripcion: '',
      estado_articulo: '',
      costo_compra: 0,
      rack: '',
      cajon: '',
      categoria1: '',
      categoria2: '',
      categoria3: '',
      categoria4: '',
      categoria5: '',
      archivo: null,
      archivosAdjuntos: [],
      solicitante: '',
      departamento: '',
      fecha_requerida: new Date().toISOString().split('T')[0],
      prioridad: 'normal',
      notas_solicitud: '',
      estado_solicitud: 'pendiente',
    };
    this.archivoNombre = 'Sin Archivo';
    this.estaEditando = false;
    this.mostrandoFormularioPedido = false;
  }
}
