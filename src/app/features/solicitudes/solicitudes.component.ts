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
  comentario: string;
  fecha_solicitud: string;
  estado: string;
  recibido_por?: string | null;
  fecha_recibido?: string | null;
  seleccionada?: boolean;
}

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule],
  templateUrl: './solicitudes.component.html',
  styleUrls: ['./solicitudes.component.scss'],
})
export class SolicitudesComponent implements OnInit {
  Math = Math;

  solicitudes: Solicitud[] = [];
  solicitudesFiltradas: Solicitud[] = [];
  solicitudSeleccionada: Solicitud | null = null;
  solicitudAEliminar: Solicitud | null = null;
  solicitudDetalle: Solicitud | null = null;

  terminoBusqueda: string = '';
  filtroEstado: string = '';
  paginaActual: number = 1;
  registrosPorPagina: number = 10;
  totalPaginas: number = 1;

  estados: string[] = [
    'Pendiente',
    'En Proceso',
    'Completado',
    'Cancelado',
    'Pendiente/Factura',
    'Pendiente/Cotizado',
    'Autorizado',
    'Procesado',
    'Entregado',
  ];

  showDeleteModal: boolean = false;
  showViewModal: boolean = false;
  showEditModal: boolean = false;
  showEntregaModal: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';

  recibidoPor: string = '';

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
        if (response && Array.isArray(response)) {
          this.solicitudes = response.map((item: any) => ({
            ...item,
            seleccionada: false,
            fecha_solicitud: new Date(item.fecha_solicitud).toLocaleString(),
            fecha_recibido: item.fecha_recibido
              ? new Date(item.fecha_recibido).toLocaleString()
              : null,
          }));
        } else if (response && response.data) {
          this.solicitudes = response.data.map((item: any) => ({
            ...item,
            seleccionada: false,
            fecha_solicitud: new Date(item.fecha_solicitud).toLocaleString(),
            fecha_recibido: item.fecha_recibido
              ? new Date(item.fecha_recibido).toLocaleString()
              : null,
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
          'Error al cargar las solicitudes. Por favor, intente nuevamente.';
        this.isLoading = false;
      },
    });
  }

  filtrarSolicitudes(): void {
    let resultado = this.solicitudes;

    if (this.terminoBusqueda) {
      const termino = this.terminoBusqueda.toLowerCase();
      resultado = resultado.filter(
        (s) =>
          s.cliente.toLowerCase().includes(termino) ||
          s.solicitante.toLowerCase().includes(termino) ||
          s.id.toString().includes(termino)
      );
    }

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

  verDetalles(id: number): void {
    this.solicitudesService.getSolicitud(id).subscribe({
      next: (data: Solicitud) => {
        this.solicitudDetalle = {
          ...data,
          fecha_solicitud: new Date(data.fecha_solicitud).toLocaleString(),
          fecha_recibido: data.fecha_recibido
            ? new Date(data.fecha_recibido).toLocaleString()
            : undefined,
        };
        this.showViewModal = true;
      },
      error: (err: any) => {
        console.error('Error al obtener detalles:', err);
        this.errorMessage = 'Error al cargar los detalles de la solicitud';
      },
    });
  }

  editarSolicitud(id: number): void {
    this.solicitudesService.getSolicitud(id).subscribe({
      next: (data: Solicitud) => {
        this.solicitudDetalle = {
          ...data,
          fecha_solicitud: new Date(data.fecha_solicitud).toLocaleString(),
          fecha_recibido: data.fecha_recibido
            ? new Date(data.fecha_recibido).toLocaleString()
            : undefined,
        };
        this.showEditModal = true;
      },
      error: (err: any) => {
        console.error('Error al cargar para editar:', err);
        this.errorMessage = 'Error al cargar la solicitud para editar';
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
  }

  // Método para cotización (estado Pendiente/Cotizado)
  crearCotizacionSimple(): void {
    if (!this.solicitudSeleccionada) {
      alert('Por favor seleccione una solicitud primero');
      return;
    }

    if (confirm('¿Desea marcar esta solicitud como PENDIENTE COTIZACIÓN?')) {
      this.isLoading = true;

      this.solicitudesService
        .actualizarSolicitud(this.solicitudSeleccionada.id, {
          estado: 'Pendiente/Cotizado',
        })
        .subscribe({
          next: () => {
            this.cargarSolicitudes();
            this.isLoading = false;
            alert('Solicitud marcada como PENDIENTE COTIZACIÓN');
          },
          error: (err: any) => {
            console.error('Error al actualizar estado:', err);
            this.errorMessage = 'Error al marcar como pendiente cotización';
            this.isLoading = false;
          },
        });
    }
  }

  // Método para factura (estado Pendiente/Factura)
  mostrarFormularioFactura(): void {
    if (!this.solicitudSeleccionada) {
      alert('Por favor seleccione una solicitud primero');
      return;
    }

    if (confirm('¿Desea marcar esta solicitud como PENDIENTE FACTURA?')) {
      this.isLoading = true;

      this.solicitudesService
        .actualizarSolicitud(this.solicitudSeleccionada.id, {
          estado: 'Pendiente/Factura',
        })
        .subscribe({
          next: () => {
            this.cargarSolicitudes();
            this.isLoading = false;
            alert('Solicitud marcada como PENDIENTE FACTURA');
          },
          error: (err: any) => {
            console.error('Error al actualizar estado:', err);
            this.errorMessage = 'Error al marcar como pendiente factura';
            this.isLoading = false;
          },
        });
    }
  }

  mostrarFormularioEntrega(): void {
    if (!this.solicitudSeleccionada) {
      alert('Por favor seleccione una solicitud primero');
      return;
    }

    this.recibidoPor = '';
    this.showEntregaModal = true;
  }

  confirmarEntrega(): void {
    if (!this.solicitudSeleccionada || !this.recibidoPor) return;

    this.isLoading = true;

    const datosEntrega = {
      estado: 'Entregado',
      recibido_por: this.recibidoPor,
      fecha_recibido: new Date().toISOString(),
    };

    this.solicitudesService
      .actualizarSolicitud(this.solicitudSeleccionada.id, datosEntrega)
      .subscribe({
        next: () => {
          this.cargarSolicitudes();
          this.showEntregaModal = false;
          this.isLoading = false;
          alert('Solicitud marcada como ENTREGADA');
        },
        error: (err: any) => {
          console.error('Error al marcar como entregado:', err);
          this.errorMessage = 'Error al marcar como entregado';
          this.isLoading = false;
        },
      });
  }

  // Función para obtener la clase CSS válida para el estado
  // Función para obtener la clase CSS válida para el estado
  obtenerClaseEstado(estado: string): string {
    // Mapear estados compuestos a clases simples
    if (estado.includes('/')) {
      // Para estados compuestos, usar la parte después de la barra
      return estado.split('/')[1].toLowerCase().trim();
    }

    // Para estados simples, convertir a minúsculas y eliminar espacios
    return estado.toLowerCase().replace(/\s+/g, '');
  }
}
