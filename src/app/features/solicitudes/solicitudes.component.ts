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

  // Campos de la tabla de detalles
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

  // Nuevos campos requeridos por el template
  tipo_maquina: string;
  modelo_maquina: string;
  numero_serie: string;
  id_maquina: string;

  // Campos para detallesPartida e itemsFactura
  detallesPartida?: DetallesPartida;
  itemsFactura?: Array<{
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    iva: number;
    total: number;
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
    if (!this.solicitudDetalle?.itemsFactura) return 0;
    return this.solicitudDetalle.itemsFactura.reduce(
      (sum, item) => sum + item.precioUnitario * item.cantidad,
      0
    );
  }

  calcularIVA(): number {
    if (!this.solicitudDetalle?.itemsFactura) return 0;
    return this.solicitudDetalle.itemsFactura.reduce((sum, item) => {
      const subtotalItem = item.precioUnitario * item.cantidad;
      return sum + subtotalItem * (item.iva / 100);
    }, 0);
  }

  calcularTotalGeneral(): number {
    return this.calcularSubtotal() + this.calcularIVA();
  }

  calcularTotalItem(item: any): void {
    const subtotal = item.precioUnitario * item.cantidad;
    item.total = subtotal + subtotal * (item.iva / 100);
  }

  agregarItemFactura(): void {
    if (!this.solicitudDetalle) return;

    if (!this.solicitudDetalle.itemsFactura) {
      this.solicitudDetalle.itemsFactura = [];
    }

    this.solicitudDetalle.itemsFactura.push({
      descripcion: '',
      cantidad: 1,
      precioUnitario: 0,
      iva: 16,
      total: 0,
    });
  }

  eliminarItemFactura(index: number): void {
    if (this.solicitudDetalle?.itemsFactura) {
      this.solicitudDetalle.itemsFactura.splice(index, 1);
    }
  }

  actualizarDetallePartida(campo: string, valor: any): void {
    if (!this.solicitudDetalle) return;

    if (!this.solicitudDetalle.detallesPartida) {
      this.solicitudDetalle.detallesPartida = {};
    }

    this.solicitudDetalle.detallesPartida[campo] = valor;
  }

  // En el método cargarSolicitudes(), actualiza el mapeo de campos:
  cargarSolicitudes(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.solicitudesService.getSolicitudes().subscribe({
      next: (response: any) => {
        if (response && response.success && Array.isArray(response.data)) {
          this.solicitudes = response.data.map((item: any) => ({
            ...item,
            seleccionada: false,
            fecha_solicitud: new Date(item.fecha_solicitud).toLocaleString(),
            fecha_recibido: item.fecha_recibido
              ? new Date(item.fecha_recibido).toLocaleString()
              : null,

            // Mapeo de campos para compatibilidad con la interfaz
            tipo_maquina: item.tipo_maquina || '',
            modelo_maquina: item.modelo_maquina || '',
            numero_serie: item.numero_serie || '',
            id_maquina: item.id_maquina || '',
            hora: item.hora || '',
            ubicacion: item.ubicacion || '',
            datos_contacto: item.contacto_recibe || '', // Ajuste aquí
            tiempo_entrega: item.tiempo_entrega || '',
            descripcion_articulo: item.descripcion_articulo || '',
            cantidad: item.cantidad || 0,
            precio_unitario: item.precio_unitario || 0,
            total_partida: item.total_general || 0, // Ajuste aquí
            subtotal: item.subtotal || 0,
            iva: item.iva_percent || 0,
            total_general: item.total_general || 0,

            // Inicializar arrays vacíos
            detallesPartida: {
              tipoTrabajo: item.tipo_trabajo,
              naturalezaTrabajo: item.naturaleza_trabajo,
              tipoMaquina: item.tipo_maquina,
              numeroSerie: item.numero_serie,
              idMaquina: item.id_maquina,
              modeloMaquina: item.modelo_maquina,
              hora: item.hora,
              contactoRecibe: item.contacto_recibe,
              tiempoEntrega: item.tiempo_entrega,
              ubicacion: item.ubicacion,
            },
            itemsFactura: [
              {
                descripcion: item.descripcion_articulo || '',
                cantidad: item.cantidad || 0,
                precioUnitario: item.precio_unitario || 0,
                iva: item.iva_percent || 0,
                total: item.total_general || 0,
              },
            ],
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

  verDetalles(id: number): void {
    this.solicitudesService.getSolicitud(id).subscribe({
      next: (data: any) => {
        this.solicitudDetalle = {
          ...data,
          fecha_solicitud: new Date(data.fecha_solicitud).toLocaleString(),
          fecha_recibido: data.fecha_recibido
            ? new Date(data.fecha_recibido).toLocaleString()
            : null,

          // Mapeo de campos requeridos
          tipo_maquina: data.tipo_maquina || data.tipo_maquina_detalle || '',
          modelo_maquina:
            data.modelo_maquina || data.modelo_maquina_detalle || '',
          numero_serie: data.numero_serie || data.serial_maquina_detalle || '',
          id_maquina: data.id_maquina || data.id_maquina_detalle || '',

          // Campos de detalles
          hora: data.hora || '',
          ubicacion: data.ubicacion || '',
          datos_contacto: data.datos_contacto || '',
          tiempo_entrega: data.tiempo_entrega || '',
          numero_partida: data.numero_partida || '',
          tipo_maquina_detalle: data.tipo_maquina_detalle || '',
          id_maquina_detalle: data.id_maquina_detalle || '',
          modelo_maquina_detalle: data.modelo_maquina_detalle || '',
          serial_maquina_detalle: data.serial_maquina_detalle || '',
          descripcion_articulo: data.descripcion_articulo || '',
          cantidad: data.cantidad || 0,
          precio_unitario: data.precio_unitario || 0,
          total_partida: data.total_partida || 0,
          subtotal: data.subtotal || 0,
          iva: data.iva || 0,
          total_general: data.total_general || 0,

          // Inicializar arrays vacíos
          detallesPartida: data.detallesPartida || {},
          itemsFactura: data.itemsFactura || [],
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
      next: (data: any) => {
        this.solicitudDetalle = {
          ...data,
          fecha_solicitud: new Date(data.fecha_solicitud).toLocaleString(),
          fecha_recibido: data.fecha_recibido
            ? new Date(data.fecha_recibido).toLocaleString()
            : null,

          // Mapeo de campos requeridos
          tipo_maquina: data.tipo_maquina || data.tipo_maquina_detalle || '',
          modelo_maquina:
            data.modelo_maquina || data.modelo_maquina_detalle || '',
          numero_serie: data.numero_serie || data.serial_maquina_detalle || '',
          id_maquina: data.id_maquina || data.id_maquina_detalle || '',

          // Campos de detalles
          hora: data.hora || '',
          ubicacion: data.ubicacion || '',
          datos_contacto: data.datos_contacto || '',
          tiempo_entrega: data.tiempo_entrega || '',
          numero_partida: data.numero_partida || '',
          tipo_maquina_detalle: data.tipo_maquina_detalle || '',
          id_maquina_detalle: data.id_maquina_detalle || '',
          modelo_maquina_detalle: data.modelo_maquina_detalle || '',
          serial_maquina_detalle: data.serial_maquina_detalle || '',
          descripcion_articulo: data.descripcion_articulo || '',
          cantidad: data.cantidad || 0,
          precio_unitario: data.precio_unitario || 0,
          total_partida: data.total_partida || 0,
          subtotal: data.subtotal || 0,
          iva: data.iva || 0,
          total_general: data.total_general || 0,

          // Inicializar arrays vacíos
          detallesPartida: data.detallesPartida || {},
          itemsFactura: data.itemsFactura || [],
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

      // Preparar datos para enviar al backend
      const datosActualizacion = {
        // Campos de la tabla principal
        cliente: this.solicitudDetalle.cliente,
        solicitante: this.solicitudDetalle.solicitante,
        representante: this.solicitudDetalle.representante,
        proveedor: this.solicitudDetalle.proveedor,
        empresa: this.solicitudDetalle.empresa,
        partida: this.solicitudDetalle.partida,
        tipo_trabajo: this.solicitudDetalle.tipo_trabajo,
        naturaleza_trabajo: this.solicitudDetalle.naturaleza_trabajo,
        comentario: this.solicitudDetalle.comentario,
        estado: this.solicitudDetalle.estado,
        recibido_por: this.solicitudDetalle.recibido_por,
        fecha_recibido: this.solicitudDetalle.fecha_recibido,

        // Campos de la tabla de detalles
        hora: this.solicitudDetalle.hora,
        ubicacion: this.solicitudDetalle.ubicacion,
        datos_contacto: this.solicitudDetalle.datos_contacto,
        tiempo_entrega: this.solicitudDetalle.tiempo_entrega,
        numero_partida: this.solicitudDetalle.numero_partida,
        tipo_maquina_detalle: this.solicitudDetalle.tipo_maquina_detalle,
        id_maquina_detalle: this.solicitudDetalle.id_maquina_detalle,
        modelo_maquina_detalle: this.solicitudDetalle.modelo_maquina_detalle,
        serial_maquina_detalle: this.solicitudDetalle.serial_maquina_detalle,
        descripcion_articulo: this.solicitudDetalle.descripcion_articulo,
        cantidad: this.solicitudDetalle.cantidad,
        precio_unitario: this.solicitudDetalle.precio_unitario,
        total_partida: this.solicitudDetalle.total_partida,
        subtotal: this.solicitudDetalle.subtotal,
        iva: this.solicitudDetalle.iva,
        total_general: this.solicitudDetalle.total_general,

        // Nuevos campos
        tipo_maquina: this.solicitudDetalle.tipo_maquina,
        modelo_maquina: this.solicitudDetalle.modelo_maquina,
        numero_serie: this.solicitudDetalle.numero_serie,
        id_maquina: this.solicitudDetalle.id_maquina,

        // Campos para detallesPartida e itemsFactura
        detallesPartida: this.solicitudDetalle.detallesPartida,
        itemsFactura: this.solicitudDetalle.itemsFactura,
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
