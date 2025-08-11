import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/services/auth.service';
import { animate, style, transition, trigger } from '@angular/animations';

interface Solicitud {
  id: number;
  tipo: string;
  cliente: string;
  solicitante: string;
  fechaCreacion: Date;
  creadoPor: string;
  fechaAutorizado?: Date;
  autorizadoPor?: string;
  fechaProceso?: Date;
  procesadoPor?: string;
  estado: string;
  descripcion?: string;
  seleccionada?: boolean;
  enterado?: {
    fecha: Date;
    observaciones: string;
  };
  factura?: {
    esFactura: boolean;
    tipoEntrega?: string;
    garantia?: string;
    cantidad?: number;
    precioSinIVA?: number;
    observaciones?: string;
    fecha?: Date;
  };
  orden?: {
    fecha: Date;
    observaciones: string;
  };
}

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './solicitudes.component.html',
  styleUrls: ['./solicitudes.component.scss'],
  animations: [
    trigger('modalAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translate(-50%, -60%)' }),
        animate(
          '200ms ease-out',
          style({ opacity: 1, transform: 'translate(-50%, -50%)' })
        ),
      ]),
      transition(':leave', [
        animate(
          '150ms ease-in',
          style({ opacity: 0, transform: 'translate(-50%, -60%)' })
        ),
      ]),
    ]),
  ],
})
export class SolicitudesComponent {
  terminoBusqueda: string = '';
  filtroEstado: string = '';
  paginaActual: number = 1;
  registrosPorPagina: number = 10;
  ordenCampo: string = 'fechaCreacion';
  ordenDireccion: string = 'desc';
  totalPaginas: number = 1;
  paginasVisiblesArray: number[] = [];

  showEnteradoForm: boolean = false;
  showFacturaForm: boolean = false;
  showDeleteModal: boolean = false;

  esCotizacion: boolean = false;
  esFactura: boolean = true;
  tipoEntrega: string = '';
  garantia: string = '';
  cantidad: number = 1;
  precioSinIVA: number = 0;
  observacionesFactura: string = '';
  fechaFactura: string = new Date().toISOString().split('T')[0];

  observacionesEnterado: string = '';
  fechaEnterado: string = new Date().toISOString().split('T')[0];

  solicitudSeleccionada: Solicitud | null = null;
  solicitudAEliminar: Solicitud | null = null;

  estados: string[] = [
    'Capturado',
    'Autorizado',
    'Procesado',
    'Facturado',
    'Enterado',
    'Cotizado',
  ];

  solicitudes: Solicitud[] = [];

  constructor(private authService: AuthService, private router: Router) {
    this.calcularPaginas();
  }

  // Métodos privados para filtrado y ordenación
  private aplicarFiltros(solicitudes: Solicitud[]): Solicitud[] {
    return solicitudes
      .filter((solicitud) => {
        if (this.terminoBusqueda) {
          const termino = this.terminoBusqueda.toLowerCase();
          return (
            solicitud.cliente.toLowerCase().includes(termino) ||
            solicitud.solicitante.toLowerCase().includes(termino) ||
            solicitud.creadoPor.toLowerCase().includes(termino) ||
            solicitud.id.toString().includes(termino)
          );
        }
        return true;
      })
      .filter((solicitud) => {
        if (this.filtroEstado) {
          return solicitud.estado === this.filtroEstado;
        }
        return true;
      });
  }

  private aplicarOrden(solicitudes: Solicitud[]): Solicitud[] {
    return [...solicitudes].sort((a, b) => {
      if (this.ordenCampo === 'fechaCreacion') {
        return this.ordenDireccion === 'asc'
          ? a.fechaCreacion.getTime() - b.fechaCreacion.getTime()
          : b.fechaCreacion.getTime() - a.fechaCreacion.getTime();
      } else {
        const campoA = a[this.ordenCampo as keyof Solicitud];
        const campoB = b[this.ordenCampo as keyof Solicitud];

        if (typeof campoA === 'string' && typeof campoB === 'string') {
          return this.ordenDireccion === 'asc'
            ? campoA.localeCompare(campoB)
            : campoB.localeCompare(campoA);
        }
        return 0;
      }
    });
  }

  // Métodos públicos
  solicitudesFiltradas(): Solicitud[] {
    const filtradas = this.aplicarFiltros(this.solicitudes);
    return this.aplicarOrden(filtradas);
  }

  calcularPaginas(): void {
    const filtradas = this.aplicarFiltros(this.solicitudes);
    this.totalPaginas = Math.ceil(filtradas.length / this.registrosPorPagina);
    this.actualizarPaginasVisibles();
  }

  actualizarPaginasVisibles(): void {
    const paginas: number[] = [];
    const paginasAMostrar = 5;

    let inicio = Math.max(
      1,
      this.paginaActual - Math.floor(paginasAMostrar / 2)
    );
    let fin = Math.min(this.totalPaginas, inicio + paginasAMostrar - 1);

    if (fin - inicio + 1 < paginasAMostrar) {
      inicio = Math.max(1, fin - paginasAMostrar + 1);
    }

    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }

    this.paginasVisiblesArray = paginas;
  }

  // Métodos de autenticación
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Métodos de navegación
  nuevaSolicitud(): void {
    this.router.navigate(['/register-solicitudes']);
  }

  verDetalles(id: number): void {
    console.log('Ver detalles de solicitud:', id);
    // Implementa la lógica para ver detalles aquí
  }

  editarSolicitud(id: number): void {
    this.router.navigate(['/register-solicitudes', id]);
  }

  // Métodos de selección
  seleccionarSolicitud(solicitud: Solicitud): void {
    this.solicitudSeleccionada = solicitud;
  }

  // Métodos de facturación
  // Métodos de facturación
  mostrarFormularioFactura(): void {
    if (!this.solicitudSeleccionada) {
      alert('Por favor, selecciona una solicitud de la tabla primero');
      return;
    }
    this.esCotizacion = false;
    this.esFactura = true;
    this.tipoEntrega = '';
    this.garantia = '';
    this.cantidad = 1;
    this.precioSinIVA = 0;
    this.showFacturaForm = true;
  }

  confirmarFactura(): void {
    if (this.solicitudSeleccionada) {
      this.solicitudSeleccionada.estado = this.esCotizacion
        ? 'Cotizado'
        : 'Facturado';
      this.solicitudSeleccionada.factura = {
        esFactura: this.esFactura,
        tipoEntrega: this.tipoEntrega,
        garantia: this.garantia,
        cantidad: this.cantidad,
        precioSinIVA: this.precioSinIVA,
        observaciones: this.observacionesFactura,
        fecha: new Date(this.fechaFactura),
      };
      this.cancelarFactura();
    }
  }

  cancelarFactura(): void {
    this.showFacturaForm = false;
  }

  // Métodos para el botón Enterado
  mostrarFormularioEnterado(): void {
    if (!this.solicitudSeleccionada) {
      alert('Por favor, selecciona una solicitud de la tabla primero');
      return;
    }
    this.fechaEnterado = new Date().toISOString().split('T')[0];
    this.observacionesEnterado = '';
    this.showEnteradoForm = true;
  }

  confirmarEnterado(): void {
    if (this.solicitudSeleccionada) {
      this.solicitudSeleccionada.estado = 'Enterado';
      this.solicitudSeleccionada.enterado = {
        fecha: new Date(this.fechaEnterado),
        observaciones: this.observacionesEnterado,
      };
      this.cancelarEnterado();
    }
  }

  cancelarEnterado(): void {
    this.showEnteradoForm = false;
    this.observacionesEnterado = '';
    this.fechaEnterado = new Date().toISOString().split('T')[0];
  }

  // Métodos de eliminación
  confirmarEliminacion(solicitud: Solicitud): void {
    this.solicitudAEliminar = solicitud;
    this.showDeleteModal = true;
  }

  eliminarSolicitud(): void {
    if (this.solicitudAEliminar) {
      this.solicitudes = this.solicitudes.filter(
        (s) => s.id !== this.solicitudAEliminar?.id
      );
      this.cancelarEliminacion();
      this.calcularPaginas();
    }
  }

  cancelarEliminacion(): void {
    this.showDeleteModal = false;
    this.solicitudAEliminar = null;
  }

  // Métodos de ordenación
  ordenarPor(campo: string): void {
    if (this.ordenCampo === campo) {
      this.ordenDireccion = this.ordenDireccion === 'asc' ? 'desc' : 'asc';
    } else {
      this.ordenCampo = campo;
      this.ordenDireccion = 'asc';
    }
    this.calcularPaginas();
  }

  // Métodos de paginación
  cambiarTamanoPagina(): void {
    this.paginaActual = 1;
    this.calcularPaginas();
  }

  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.actualizarPaginasVisibles();
    }
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.irAPagina(this.paginaActual - 1);
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.irAPagina(this.paginaActual + 1);
    }
  }

  indiceInicioPagina(): number {
    return (this.paginaActual - 1) * this.registrosPorPagina + 1;
  }

  indiceFinPagina(): number {
    return Math.min(
      this.paginaActual * this.registrosPorPagina,
      this.aplicarFiltros(this.solicitudes).length
    );
  }

  paginasVisibles(): number[] {
    return this.paginasVisiblesArray;
  }

  // Métodos para checkboxes
  toggleCotizacion(): void {
    this.esCotizacion = !this.esCotizacion;
    if (this.esCotizacion) {
      this.esFactura = false;
    }
  }

  toggleFactura(): void {
    this.esFactura = !this.esFactura;
    if (this.esFactura) {
      this.esCotizacion = false;
    }
  }

  // Método para filtrar solicitudes cuando cambian los parámetros
  filtrarSolicitudes(): void {
    this.paginaActual = 1;
    this.calcularPaginas();
  }
}
