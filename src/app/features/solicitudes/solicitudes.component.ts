import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SolicitudesService } from './solicitudes.service';
import { HttpClientModule } from '@angular/common/http';

interface PartidaDetalle {
  descripcion_articulo: string;
  cantidad: number;
  precio_unitario: number;
  total_partida: number;
}

interface SolicitudDetalles {
  hora: string;
  ubicacion: string;
  datos_contacto: string;
  tiempo_entrega: string;
  numero_partida: string;
  tipo_maquina_detalle: string;
  id_maquina_detalle: string;
  modelo_maquina_detalle: string;
  serial_maquina_detalle: string;
  descripcion_articulo: string;
  cantidad: number;
  precio_unitario: number;
  total_partida: number;
  subtotal: number;
  iva: number;
  total_general: number;
}

// Interfaz para detallesPartida con firma de índice
interface DetallesPartida {
  tipoTrabajo?: string;
  naturalezaTrabajo?: string;
  tipoMaquina?: string;
  numeroSerie?: string;
  idMaquina?: string;
  modeloMaquina?: string;
  hora?: string;
  contactoRecibe?: string;
  tiempoEntrega?: string;
  ubicacion?: string;
  [key: string]: any; // Firma de índice para permitir cualquier propiedad
}

interface Solicitud {
  id: number;
  cliente: string;
  solicitante: string;
  representante: string;
  proveedor: string;
  empresa: string;
  partida: string;
  tipo_trabajo: string;
  naturaleza_trabajo: string;
  comentario: string;
  estado: string;
  fecha_solicitud: string;
  recibido_por: string | null;
  fecha_recibido: string | null;

  // Campos de precios (mantenidos en tabla principal)
  descripcion_articulo: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  iva_percent: number;
  total_general: number;

  // Campos para detallesPartida e itemsFactura
  detalles?: Array<{
    id: number;
    numero_partida: number;
    tipo_trabajo: string;
    naturaleza_trabajo: string;
    tipo_maquina_detalle: string;
    modelo_maquina_detalle: string;
    serial_maquina_detalle: string;
    id_maquina_detalle: string;
    fecha: string;
    hora_inicio: string;
    hora_termino: string;
    ubicacion: string;
    datos_contacto: string;
    tiempo_entrega: string;
    descripcion_articulo: string;
    cantidad: number;
    precio_unitario: number;
    total_partida: number;
    subtotal: number;
    iva: number;
    total_general: number;
  }>;

  // Para UI
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
  convertirFechaParaInput(fecha: string | null): string {
    if (!fecha) return '';
    // Convierte la fecha al formato YYYY-MM-DDTHH:MM para input datetime-local
    const date = new Date(fecha);
    return date.toISOString().slice(0, 16);
  }
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

  // Métodos para facturación
  calcularSubtotal(): number {
    if (!this.solicitudDetalle) return 0;
    return this.solicitudDetalle.subtotal || 0;
  }

  calcularIVA(): number {
    if (!this.solicitudDetalle) return 0;
    const subtotal = this.solicitudDetalle.subtotal || 0;
    const ivaPercent = this.solicitudDetalle.iva_percent || 0;
    return subtotal * (ivaPercent / 100);
  }

  calcularTotalGeneral(): number {
    if (!this.solicitudDetalle) return 0;
    return this.solicitudDetalle.total_general || 0;
  }

  // En el método cargarSolicitudes(), actualiza el mapeo de campos:
  cargarSolicitudes(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.solicitudesService.getSolicitudes().subscribe({
      next: (response: any) => {
        if (response && response.success && Array.isArray(response.data)) {
          this.solicitudes = response.data.map((item: any) => {
            // Para la lista principal, usar información de la tabla principal
            // y tipo_trabajo de la primera partida si existe
            const tipoTrabajo =
              item.detalles && item.detalles.length > 0
                ? item.detalles[0].tipo_trabajo
                : item.tipo_trabajo || 'N/A';

            return {
              ...item,
              seleccionada: false,
              fecha_solicitud: new Date(item.fecha_solicitud).toLocaleString(),
              fecha_recibido: item.fecha_recibido
                ? new Date(item.fecha_recibido).toLocaleString()
                : null,
              tipo_trabajo: tipoTrabajo,

              // Campos de precios de la tabla principal
              descripcion_articulo: item.descripcion_articulo || '',
              cantidad: item.cantidad || 0,
              precio_unitario: item.precio_unitario || 0,
              subtotal: item.subtotal || 0,
              iva_percent: item.iva_percent || 0,
              total_general: item.total_general || 0,
            };
          });
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

  // También actualiza el método verDetalles()
  verDetalles(id: number): void {
    this.solicitudesService.getSolicitud(id).subscribe({
      next: (data: any) => {
        if (data && data.success) {
          const item = data.data;
          this.solicitudDetalle = {
            ...item,
            fecha_solicitud: new Date(item.fecha_solicitud).toLocaleString(),
            fecha_recibido: item.fecha_recibido
              ? new Date(item.fecha_recibido).toLocaleString()
              : null,

            // Campos de precios de la tabla principal
            descripcion_articulo: item.descripcion_articulo || '',
            cantidad: item.cantidad || 0,
            precio_unitario: item.precio_unitario || 0,
            subtotal: item.subtotal || 0,
            iva_percent: item.iva_percent || 0,
            total_general: item.total_general || 0,

            // Detalles de partidas
            detalles: item.detalles || [],

            // Para compatibilidad con el template (usar primera partida)
            tipo_trabajo:
              item.detalles && item.detalles.length > 0
                ? item.detalles[0].tipo_trabajo
                : item.tipo_trabajo || 'N/A',
            naturaleza_trabajo:
              item.detalles && item.detalles.length > 0
                ? item.detalles[0].naturaleza_trabajo
                : item.naturaleza_trabajo || 'N/A',
          };
          this.showViewModal = true;
        } else {
          throw new Error('Formato de respuesta inesperado');
        }
      },
      error: (err: any) => {
        console.error('Error al obtener detalles:', err);
        this.errorMessage = 'Error al cargar los detalles de la solicitud';
      },
    });
  }

  editarSolicitud(id: number): void {
    this.solicitudesService.getSolicitud(id).subscribe({
      next: (data: any) => {
        if (data && data.success) {
          const item = data.data;
          this.solicitudDetalle = {
            ...item,
            fecha_solicitud: new Date(item.fecha_solicitud).toLocaleString(),
            fecha_recibido: item.fecha_recibido
              ? new Date(item.fecha_recibido).toLocaleString()
              : null,

            // Campos de precios de la tabla principal
            descripcion_articulo: item.descripcion_articulo || '',
            cantidad: item.cantidad || 0,
            precio_unitario: item.precio_unitario || 0,
            subtotal: item.subtotal || 0,
            iva_percent: item.iva_percent || 0,
            total_general: item.total_general || 0,

            // Detalles de partidas
            detalles: item.detalles || [],

            // Para compatibilidad con el template
            tipo_trabajo:
              item.detalles && item.detalles.length > 0
                ? item.detalles[0].tipo_trabajo
                : item.tipo_trabajo || 'N/A',
            naturaleza_trabajo:
              item.detalles && item.detalles.length > 0
                ? item.detalles[0].naturaleza_trabajo
                : item.naturaleza_trabajo || 'N/A',
          };
          this.showEditModal = true;
        } else {
          throw new Error('Formato de respuesta inesperado');
        }
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

      // Preparar datos para enviar al backend
      const datosActualizacion = {
        // Campos de la tabla principal
        cliente: this.solicitudDetalle.cliente,
        solicitante: this.solicitudDetalle.solicitante,
        representante: this.solicitudDetalle.representante,
        proveedor: this.solicitudDetalle.proveedor,
        empresa: this.solicitudDetalle.empresa,
        comentario: this.solicitudDetalle.comentario,
        estado: this.solicitudDetalle.estado,
        recibido_por: this.solicitudDetalle.recibido_por,
        fecha_recibido: this.solicitudDetalle.fecha_recibido,

        // Campos de precios
        descripcion_articulo: this.solicitudDetalle.descripcion_articulo,
        cantidad: this.solicitudDetalle.cantidad,
        precio_unitario: this.solicitudDetalle.precio_unitario,
        subtotal: this.solicitudDetalle.subtotal,
        iva_percent: this.solicitudDetalle.iva_percent,
        total_general: this.solicitudDetalle.total_general,
      };

      this.solicitudesService
        .actualizarSolicitud(this.solicitudDetalle.id, datosActualizacion)
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

  // Métodos de utilidad para la UI
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

  confirmarEliminacion(solicitud: Solicitud): void {
    this.solicitudAEliminar = solicitud;
    this.showDeleteModal = true;
  }

  eliminarSolicitud(): void {
    if (this.solicitudAEliminar) {
      this.isLoading = true;
      this.solicitudesService
        .eliminarSolicitud(this.solicitudAEliminar.id)
        .subscribe({
          next: () => {
            this.cargarSolicitudes();
            this.showDeleteModal = false;
            this.solicitudAEliminar = null;
            this.isLoading = false;
          },
          error: (err: any) => {
            console.error('Error al eliminar:', err);
            this.errorMessage = 'Error al eliminar la solicitud y sus detalles';
            this.isLoading = false;
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

  // En solicitudes.component.ts, añadir esta función:
  obtenerClaseEstado(estado: string) {
    if (!estado) return 'estado-pendiente';

    if (estado.includes('Pendiente')) {
      return 'estado-pendiente';
    } else if (estado.includes('Completado')) {
      return 'estado-completado';
    } else if (estado.includes('Proceso')) {
      return 'estado-proceso';
    } else if (estado.includes('Cancelado')) {
      return 'estado-cancelado';
    } else if (estado.includes('Autorizado')) {
      return 'estado-autorizado';
    } else if (estado.includes('Entregado')) {
      return 'estado-entregado';
    } else if (estado.includes('Factura')) {
      return 'estado-factura';
    } else if (estado.includes('Cotizado')) {
      return 'estado-cotizado';
    }
    return 'estado-pendiente';
  }
}
