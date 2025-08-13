import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SolicitudesService } from './solicitudes.service';
import { HttpClientModule } from '@angular/common/http';

interface Solicitud {
  id: number;
  cliente: string;
  solicitante: string;
  partida: string;
  tipo_trabajo: string;
  naturaleza_trabajo: string;
  tipo_maquina: string;
  id_maquina: string;
  modelo_maquina: string;
  numero_serie: string;
  descripcion_adicional: string;
  fecha_solicitud: string;
  estado: string;
  seleccionada?: boolean;
  factura?: {
    numero: string;
    fecha: string;
    monto: number;
    descripcion: string;
  };
  cotizacion?: {
    numero: string;
    fecha: string;
    monto: number;
    descripcion: string;
  };
}

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule],
  templateUrl: './solicitudes.component.html',
  styleUrls: ['./solicitudes.component.scss'],
})
export class SolicitudesComponent implements OnInit {
  // Exponer Math al template
  Math = Math;

  solicitudes: Solicitud[] = [];
  solicitudesFiltradas: Solicitud[] = [];
  solicitudSeleccionada: Solicitud | null = null;
  solicitudAEliminar: Solicitud | null = null;
  solicitudDetalle: Solicitud | null = null;

  // Filtros y paginación
  terminoBusqueda: string = '';
  filtroEstado: string = '';
  paginaActual: number = 1;
  registrosPorPagina: number = 10;
  totalPaginas: number = 1;

  // Estados posibles
  estados: string[] = [
    'Pendiente',
    'En Proceso',
    'Completado',
    'Cancelado',
    'Facturado',
    'Enterado',
  ];

  // Variables para modales
  showDeleteModal: boolean = false;
  showViewModal: boolean = false;
  showEditModal: boolean = false;
  showFacturaModal: boolean = false;
  showEnteradoModal: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';

  // Variables para Factura/Cotización
  esCotizacion: boolean = false;
  numeroDocumento: string = '';
  fechaDocumento: string = new Date().toISOString().split('T')[0];
  monto: number = 0;
  descripcionDocumento: string = '';

  // Variables para Enterado
  comentarioEnterado: string = '';

  constructor(
    private solicitudesService: SolicitudesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarSolicitudes();
  }

  cargarSolicitudes(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.solicitudesService.getSolicitudes().subscribe({
      next: (response: any) => {
        // Verificar si la respuesta tiene el formato esperado
        if (response && Array.isArray(response)) {
          this.solicitudes = response.map((item: any) => ({
            ...item,
            seleccionada: false,
            fecha_solicitud: new Date(item.fecha_solicitud).toLocaleString(),
          }));
        } else if (response && response.data) {
          // Formato de respuesta con estructura {success, data, error}
          this.solicitudes = response.data.map((item: any) => ({
            ...item,
            seleccionada: false,
            fecha_solicitud: new Date(item.fecha_solicitud).toLocaleString(),
          }));
        } else {
          throw new Error('Formato de respuesta inesperado');
        }

        this.filtrarSolicitudes();
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error al cargar solicitudes:', err);
        this.errorMessage =
          err.message ||
          'Error al cargar las solicitudes. Por favor, intente nuevamente.';
        this.isLoading = false;
      },
    });
  }

  filtrarSolicitudes(): void {
    let resultado = this.solicitudes;

    // Aplicar filtro de búsqueda
    if (this.terminoBusqueda) {
      const termino = this.terminoBusqueda.toLowerCase();
      resultado = resultado.filter(
        (s) =>
          s.cliente.toLowerCase().includes(termino) ||
          s.solicitante.toLowerCase().includes(termino) ||
          s.id.toString().includes(termino)
      );
    }

    // Aplicar filtro de estado
    if (this.filtroEstado) {
      resultado = resultado.filter((s) => s.estado === this.filtroEstado);
    }

    this.solicitudesFiltradas = resultado;
    this.calcularPaginas();
  }

  calcularPaginas(): void {
    this.totalPaginas =
      Math.ceil(this.solicitudesFiltradas.length / this.registrosPorPagina) ||
      1;
    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = this.totalPaginas;
    }
  }

  get solicitudesPaginadas(): Solicitud[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;
    return this.solicitudesFiltradas.slice(inicio, fin);
  }

  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
    }
  }

  seleccionarSolicitud(solicitud: Solicitud): void {
    this.solicitudSeleccionada = solicitud;
  }

  nuevaSolicitud(): void {
    this.router.navigate(['/register-solicitudes']);
  }

  editarSolicitud(id: number): void {
    this.solicitudesService.getSolicitud(id).subscribe({
      next: (data: Solicitud) => {
        this.solicitudDetalle = {
          ...data,
          fecha_solicitud: new Date(data.fecha_solicitud).toLocaleString(),
        };
        this.showEditModal = true;
      },
      error: (err: any) => {
        console.error('Error al cargar para editar:', err);
        this.errorMessage = 'Error al cargar la solicitud para editar';
      },
    });
  }

  verDetalles(id: number): void {
    this.solicitudesService.getSolicitud(id).subscribe({
      next: (data: Solicitud) => {
        this.solicitudDetalle = {
          ...data,
          fecha_solicitud: new Date(data.fecha_solicitud).toLocaleString(),
        };
        this.showViewModal = true;
      },
      error: (err: any) => {
        console.error('Error al obtener detalles:', err);
        this.errorMessage = 'Error al cargar los detalles de la solicitud';
      },
    });
  }

  guardarEdicion(): void {
    if (this.solicitudDetalle) {
      this.isLoading = true;
      this.solicitudesService
        .actualizarSolicitud(this.solicitudDetalle.id, this.solicitudDetalle)
        .subscribe({
          next: () => {
            this.cargarSolicitudes();
            this.showEditModal = false;
            this.isLoading = false;
          },
          error: (err: any) => {
            console.error('Error al actualizar:', err);
            this.errorMessage = 'Error al actualizar la solicitud';
            this.isLoading = false;
          },
        });
    }
  }

  confirmarEliminacion(solicitud: Solicitud): void {
    this.solicitudAEliminar = solicitud;
    this.showDeleteModal = true;
  }

  eliminarSolicitud(): void {
    if (this.solicitudAEliminar) {
      this.solicitudesService
        .eliminarSolicitud(this.solicitudAEliminar.id)
        .subscribe({
          next: () => {
            this.solicitudes = this.solicitudes.filter(
              (s) => s.id !== this.solicitudAEliminar?.id
            );
            this.filtrarSolicitudes();
            this.showDeleteModal = false;
            this.solicitudAEliminar = null;
          },
          error: (err: any) => {
            console.error('Error al eliminar:', err);
            this.errorMessage = 'Error al eliminar la solicitud';
          },
        });
    }
  }

  cancelarEliminacion(): void {
    this.showDeleteModal = false;
    this.solicitudAEliminar = null;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  cambiarTamanoPagina(): void {
    this.paginaActual = 1;
    this.calcularPaginas();
  }

  getPaginasVisibles(): number[] {
    const paginasVisibles = 5;
    const paginas: number[] = [];

    let inicio = Math.max(
      1,
      this.paginaActual - Math.floor(paginasVisibles / 2)
    );
    const fin = Math.min(this.totalPaginas, inicio + paginasVisibles - 1);

    inicio = Math.max(1, fin - paginasVisibles + 1);

    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }

    return paginas;
  }

  exportarAExcel(): void {
    console.log('Exportando a Excel...');
    // Implementación real iría aquí
  }

  mostrarFormularioFactura(): void {
    if (!this.solicitudSeleccionada) {
      alert('Por favor seleccione una solicitud primero');
      return;
    }

    // Resetear valores del formulario
    this.esCotizacion = false;
    this.numeroDocumento = '';
    this.fechaDocumento = new Date().toISOString().split('T')[0];
    this.monto = 0;
    this.descripcionDocumento = '';

    // Cargar datos de la solicitud
    this.solicitudesService
      .getSolicitud(this.solicitudSeleccionada.id)
      .subscribe({
        next: (data: Solicitud) => {
          this.solicitudDetalle = data;
          this.showFacturaModal = true;
        },
        error: (err: any) => {
          console.error('Error al cargar solicitud:', err);
          this.errorMessage = 'Error al cargar la solicitud';
        },
      });
  }

  guardarFactura(): void {
    if (!this.solicitudSeleccionada) return;

    this.isLoading = true;

    const documento = {
      tipo: this.esCotizacion ? 'cotizacion' : 'factura',
      numero: this.numeroDocumento,
      fecha: this.fechaDocumento,
      monto: this.monto,
      descripcion: this.descripcionDocumento,
    };

    this.solicitudesService
      .registrarDocumento(this.solicitudSeleccionada.id, documento)
      .subscribe({
        next: () => {
          this.cargarSolicitudes();
          this.showFacturaModal = false;
          this.isLoading = false;
          alert(
            `${
              this.esCotizacion ? 'Cotización' : 'Factura'
            } registrada correctamente`
          );
        },
        error: (err: any) => {
          console.error('Error al guardar documento:', err);
          this.errorMessage = `Error al registrar ${
            this.esCotizacion ? 'cotización' : 'factura'
          }`;
          this.isLoading = false;
        },
      });
  }

  mostrarFormularioEnterado(): void {
    if (!this.solicitudSeleccionada) {
      alert('Por favor seleccione una solicitud primero');
      return;
    }

    this.comentarioEnterado = '';
    this.showEnteradoModal = true;
  }

  confirmarEnterado(): void {
    if (!this.solicitudSeleccionada) return;

    this.isLoading = true;

    const datosEnterado = {
      estado: 'Enterado',
      comentario: this.comentarioEnterado,
    };

    this.solicitudesService
      .actualizarEstado(this.solicitudSeleccionada.id, datosEnterado)
      .subscribe({
        next: () => {
          this.cargarSolicitudes();
          this.showEnteradoModal = false;
          this.isLoading = false;
          alert('Solicitud marcada como ENTERADA');
        },
        error: (err: any) => {
          console.error('Error al marcar como enterado:', err);
          this.errorMessage = 'Error al marcar como enterado';
          this.isLoading = false;
        },
      });
  }
}
