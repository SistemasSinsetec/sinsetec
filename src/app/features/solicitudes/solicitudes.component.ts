import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/services/auth.service';

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
})
export class SolicitudesComponent {
  filtroCliente: string = '';
  filtroSolicitante: string = '';
  terminoBusqueda: string = '';
  paginaActual: number = 1;
  registrosPorPagina: number = 10;

  showEnteradoForm: boolean = false;
  showFacturaForm: boolean = false;
  showOrdenForm: boolean = false;

  esFactura: boolean = true;
  tipoEntrega: string = '';
  garantia: string = '';
  cantidad: number = 1;
  precioSinIVA: number = 0;
  observacionesFactura: string = '';
  fechaFactura: string = new Date().toISOString().split('T')[0];

  observacionesEnterado: string = '';
  fechaEnterado: string = new Date().toISOString().split('T')[0];

  observacionesOrden: string = '';
  fechaOrden: string = new Date().toISOString().split('T')[0];

  solicitudSeleccionada: Solicitud | null = null;

  solicitudes: Solicitud[] = [
    {
      id: 434,
      tipo: 'cotización',
      cliente: 'FCDM',
      solicitante: 'Octavio',
      fechaCreacion: new Date('2025-07-17T12:55:01'),
      creadoPor: 'reinsetec',
      estado: 'Capturado',
      descripcion: 'Trabajo de limpieza',
      seleccionada: false,
    },
    {
      id: 432,
      tipo: 'cotización',
      cliente: 'Motores Eléctricos FCDM',
      solicitante: 'Octavio Montoy',
      fechaCreacion: new Date('2025-06-27T13:13:05'),
      creadoPor: 'Lobofrán',
      estado: 'Capturado',
      descripcion:
        'Se tomó respaldo del disco mecánico de la máquina TOR-163 para cargar el respaldo en un emulador de Compact Flash para reemplazar el disco',
      seleccionada: false,
    },
  ];

  constructor(private authService: AuthService, private router: Router) {}

  solicitudesFiltradas(): Solicitud[] {
    return this.solicitudes.filter((solicitud) => {
      if (this.terminoBusqueda) {
        const termino = this.terminoBusqueda.toLowerCase();
        return (
          solicitud.cliente.toLowerCase().includes(termino) ||
          solicitud.solicitante.toLowerCase().includes(termino) ||
          solicitud.creadoPor.toLowerCase().includes(termino)
        );
      }
      return true;
    });
  }

  filtrarSolicitudes(): void {
    this.paginaActual = 1;
  }

  mostrarFormularioFactura(): void {
    if (!this.solicitudSeleccionada) {
      alert('Por favor, selecciona una solicitud de la tabla primero');
      return;
    }

    this.esFactura = this.solicitudSeleccionada.tipo !== 'cotización';
    this.tipoEntrega = '';
    this.garantia = '';
    this.cantidad = 1;
    this.precioSinIVA = 0;
    this.observacionesFactura = '';
    this.fechaFactura = new Date().toISOString().split('T')[0];

    this.showFacturaForm = true;
  }

  confirmarFactura(): void {
    if (this.solicitudSeleccionada) {
      this.solicitudSeleccionada.factura = {
        esFactura: this.esFactura,
        tipoEntrega: this.tipoEntrega,
        garantia: this.garantia,
        cantidad: this.cantidad,
        precioSinIVA: this.precioSinIVA,
        observaciones: this.observacionesFactura,
        fecha: new Date(this.fechaFactura),
      };

      this.solicitudSeleccionada.estado = this.esFactura
        ? 'Facturado'
        : 'Cotizado';
      this.solicitudSeleccionada.fechaProceso = new Date();
      this.solicitudSeleccionada.procesadoPor = 'Usuario actual';

      this.cancelarFactura();
    }
  }

  cancelarFactura(): void {
    this.showFacturaForm = false;
    this.solicitudSeleccionada = null;
    this.esFactura = true;
    this.tipoEntrega = '';
    this.garantia = '';
    this.cantidad = 1;
    this.precioSinIVA = 0;
    this.observacionesFactura = '';
    this.fechaFactura = new Date().toISOString().split('T')[0];
  }

  mostrarFormularioEnterado(): void {
    if (!this.solicitudSeleccionada) {
      alert('Por favor, selecciona una solicitud de la tabla primero');
      return;
    }
    this.showEnteradoForm = true;
  }

  seleccionarSolicitud(solicitud: Solicitud): void {
    this.solicitudSeleccionada = solicitud;
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
    this.solicitudSeleccionada = null;
    this.observacionesEnterado = '';
    this.fechaEnterado = new Date().toISOString().split('T')[0];
  }

  generarOrden(id: number): void {
    this.solicitudSeleccionada =
      this.solicitudes.find((s) => s.id === id) || null;
    if (this.solicitudSeleccionada) {
      this.showOrdenForm = true;
    }
  }

  confirmarOrden(): void {
    if (this.solicitudSeleccionada) {
      this.solicitudSeleccionada.estado = 'En proceso';
      this.solicitudSeleccionada.orden = {
        fecha: new Date(this.fechaOrden),
        observaciones: this.observacionesOrden,
      };
      this.solicitudSeleccionada.fechaProceso = new Date();
      this.solicitudSeleccionada.procesadoPor = 'Usuario actual';
      this.cancelarOrden();
    }
  }

  cancelarOrden(): void {
    this.showOrdenForm = false;
    this.observacionesOrden = '';
    this.fechaOrden = new Date().toISOString().split('T')[0];
  }

  get totalPaginas(): number {
    return Math.ceil(this.solicitudes.length / this.registrosPorPagina);
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
    }
  }

  editarSolicitud(id: number): void {
    console.log('Editar solicitud:', id);
  }

  eliminarSolicitud(id: number): void {
    console.log('Eliminar solicitud:', id);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getSolicitudesSeleccionadas(): Solicitud[] {
    return this.solicitudes.filter((s) => s.seleccionada);
  }
}
