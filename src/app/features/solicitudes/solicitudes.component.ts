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
}

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule],
  templateUrl: './solicitudes.component.html',
  styleUrls: ['./solicitudes.component.scss'],
})
export class SolicitudesComponent implements OnInit {
  mostrarFormularioEnterado() {
    throw new Error('Method not implemented.');
  }
  mostrarFormularioFactura() {
    throw new Error('Method not implemented.');
  }
  // Exponer Math al template
  Math = Math;

  solicitudes: Solicitud[] = [];
  solicitudesFiltradas: Solicitud[] = [];
  solicitudSeleccionada: Solicitud | null = null;
  solicitudAEliminar: Solicitud | null = null;

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
  isLoading: boolean = false;
  errorMessage: string = '';

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
      next: (data: any[]) => {
        this.solicitudes = data.map((item: any) => ({
          ...item,
          seleccionada: false,
          fecha_solicitud: new Date(item.fecha_solicitud).toLocaleString(),
        }));
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
    this.router.navigate(['/register-solicitudes', id]);
  }

  verDetalles(id: number): void {
    this.solicitudesService.getSolicitud(id).subscribe({
      next: (data: { id: any; cliente: any; estado: any }) => {
        alert(
          `Detalles de la solicitud:\nID: ${data.id}\nCliente: ${data.cliente}\nEstado: ${data.estado}`
        );
      },
      error: (err: any) => {
        console.error('Error al obtener detalles:', err);
        alert('Error al cargar los detalles de la solicitud');
      },
    });
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
            alert('Solicitud eliminada correctamente');
          },
          error: (err: any) => {
            console.error('Error al eliminar:', err);
            alert('Error al eliminar la solicitud');
          },
        });
    }
  }

  cancelarEliminacion(): void {
    this.showDeleteModal = false;
    this.solicitudAEliminar = null;
  }

  logout(): void {
    // Aquí deberías implementar la lógica de logout
    console.log('Usuario cerró sesión');
    // Ejemplo: limpiar localStorage y redirigir
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  cambiarTamanoPagina(): void {
    this.paginaActual = 1; // Resetear a la primera página
    this.calcularPaginas(); // Recalcular paginación
  }

  getPaginasVisibles(): number[] {
    const paginasVisibles = 5; // Número máximo de páginas a mostrar
    const paginas: number[] = [];

    let inicio = Math.max(
      1,
      this.paginaActual - Math.floor(paginasVisibles / 2)
    );
    const fin = Math.min(this.totalPaginas, inicio + paginasVisibles - 1);

    // Ajustar inicio si estamos cerca del final
    inicio = Math.max(1, fin - paginasVisibles + 1);

    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }

    return paginas;
  }

  exportarAExcel(): void {
    console.log('Exportando a Excel...');
    // Implementación real para exportar a Excel
  }

  exportarAPDF(): void {
    console.log('Exportando a PDF...');
    // Implementación real para exportar a PDF
  }
}
