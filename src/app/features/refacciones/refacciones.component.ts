import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-refacciones',
  templateUrl: './refacciones.component.html',
  styleUrls: ['./refacciones.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
})
export class RefaccionesComponent {
  mostrarEntregado() {
    throw new Error('Method not implemented.');
  }
  // Propiedades para paginación
  paginaActual: number = 1;
  registrosPorPagina: number = 10;
  totalPaginas: number = 1;

  // Propiedades para filtrado y búsqueda
  terminoBusqueda: string = '';
  filtroEstado: string = '';
  estados: string[] = ['Disponible', 'Agotado', 'Bajo stock', 'Reservado'];

  // Propiedades para datos
  refacciones: any[] = [];
  refaccionesFiltradas: any[] = [];
  refaccionesPaginadas: any[] = [];

  // Propiedades para selección y modales
  refaccionSeleccionada: any = null;
  refaccionAEliminar: any = null;
  refaccionDetalle: any = null;

  // Propiedades para modales
  showDeleteModal: boolean = false;
  showViewModal: boolean = false;
  showEditModal: boolean = false;
  showMovimientoModal: boolean = false;
  showNuevaRefaccionModal: boolean = false;

  // Propiedades para movimientos
  movimientoTipo: 'entrada' | 'salida' = 'entrada';
  movimientoCantidad: number = 0;
  movimientoResponsable: string = '';
  movimientoNotas: string = '';

  // Propiedades para nueva refacción
  nuevaRefaccion: any = {
    codigo: '',
    nombre: '',
    descripcion: '',
    proveedor: '',
    stock: 0,
    stock_minimo: 0,
    precio: 0,
    ubicacion: '',
  };

  // Estado y errores
  isLoading: boolean = true;
  errorMessage: string | null = null;

  // URL de la API
  apiUrl = '/api/refacciones.php';
  Math: any;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.cargarRefacciones();
  }

  // Cargar refacciones desde la API
  cargarRefacciones() {
    this.isLoading = true;
    this.http.get(this.apiUrl).subscribe({
      next: (data: any) => {
        this.isLoading = false;
        if (Array.isArray(data)) {
          this.refacciones = data;
          this.filtrarRefacciones();
        } else if (typeof data === 'string') {
          try {
            this.refacciones = JSON.parse(data);
            this.filtrarRefacciones();
          } catch (e) {
            console.error('Error al parsear respuesta:', e);
            this.errorMessage = 'Error al procesar los datos del servidor';
          }
        } else {
          console.error('Formato de respuesta inesperado:', data);
          this.errorMessage = 'Formato de datos inesperado del servidor';
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al cargar refacciones:', err);
        this.errorMessage = 'Error al cargar las refacciones desde el servidor';
      },
    });
  }

  // Filtrar refacciones según búsqueda y estado
  filtrarRefacciones() {
    let resultados = [...this.refacciones];

    // Filtrar por término de búsqueda
    if (this.terminoBusqueda.trim()) {
      const termino = this.terminoBusqueda.toLowerCase();
      resultados = resultados.filter(
        (r) =>
          (r.codigo && r.codigo.toLowerCase().includes(termino)) ||
          (r.nombre && r.nombre.toLowerCase().includes(termino)) ||
          (r.proveedor && r.proveedor.toLowerCase().includes(termino))
      );
    }

    // Filtrar por estado
    if (this.filtroEstado) {
      resultados = resultados.filter(
        (r) => this.verificarEstadoRefaccion(r) === this.filtroEstado
      );
    }

    this.refaccionesFiltradas = resultados;
    this.totalPaginas = Math.ceil(
      this.refaccionesFiltradas.length / this.registrosPorPagina
    );
    this.actualizarPaginacion();
  }

  // Verificar estado de la refacción (lógica simplificada)
  verificarEstadoRefaccion(refaccion: any): string {
    if (refaccion.stock <= 0) return 'Agotado';
    if (refaccion.stock_minimo && refaccion.stock < refaccion.stock_minimo)
      return 'Bajo stock';
    return 'Disponible';
  }

  // Métodos de paginación
  cambiarPagina(pagina: number) {
    this.paginaActual = pagina;
    this.actualizarPaginacion();
  }

  cambiarTamanoPagina() {
    this.paginaActual = 1;
    this.totalPaginas = Math.ceil(
      this.refaccionesFiltradas.length / this.registrosPorPagina
    );
    this.actualizarPaginacion();
  }

  actualizarPaginacion() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;
    this.refaccionesPaginadas = this.refaccionesFiltradas.slice(inicio, fin);
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

  // Métodos para selección y acciones
  seleccionarRefaccion(refaccion: any) {
    this.refaccionSeleccionada = refaccion;
  }

  verDetalles(id: string) {
    this.isLoading = true;
    this.http.get(`${this.apiUrl}?id=${id}`).subscribe({
      next: (data: any) => {
        this.isLoading = false;
        this.refaccionDetalle = data;
        this.showViewModal = true;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al cargar detalles:', err);
        this.errorMessage = 'Error al cargar los detalles de la refacción';
      },
    });
  }

  editarRefaccion(id: string) {
    this.isLoading = true;
    this.http.get(`${this.apiUrl}?id=${id}`).subscribe({
      next: (data: any) => {
        this.isLoading = false;
        this.refaccionDetalle = { ...data };
        this.showEditModal = true;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al cargar para editar:', err);
        this.errorMessage = 'Error al cargar la refacción para editar';
      },
    });
  }

  guardarEdicion() {
    this.isLoading = true;
    this.http
      .put(
        `${this.apiUrl}?id=${this.refaccionDetalle.id}`,
        this.refaccionDetalle
      )
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.showEditModal = false;
          this.cargarRefacciones();
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error al guardar cambios:', err);
          this.errorMessage = 'Error al guardar los cambios de la refacción';
        },
      });
  }

  // Métodos para eliminar refacción
  confirmarEliminacion(refaccion: any) {
    this.refaccionAEliminar = refaccion;
    this.showDeleteModal = true;
  }

  cancelarEliminacion() {
    this.showDeleteModal = false;
    this.refaccionAEliminar = null;
  }

  eliminarRefaccion() {
    this.isLoading = true;
    this.http
      .delete(`${this.apiUrl}?id=${this.refaccionAEliminar.id}`)
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.showDeleteModal = false;
          this.cargarRefacciones();
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error al eliminar:', err);
          this.errorMessage = 'Error al eliminar la refacción';
        },
      });
  }

  // Métodos para movimientos (entradas/salidas)
  registrarEntrada() {
    if (!this.refaccionSeleccionada) {
      this.errorMessage = 'Debe seleccionar una refacción primero';
      return;
    }
    this.movimientoTipo = 'entrada';
    this.movimientoCantidad = 0;
    this.movimientoResponsable = '';
    this.movimientoNotas = '';
    this.showMovimientoModal = true;
  }

  registrarSalida() {
    if (!this.refaccionSeleccionada) {
      this.errorMessage = 'Debe seleccionar una refacción primero';
      return;
    }
    this.movimientoTipo = 'salida';
    this.movimientoCantidad = 0;
    this.movimientoResponsable = '';
    this.movimientoNotas = '';
    this.showMovimientoModal = true;
  }

  confirmarMovimiento() {
    if (!this.movimientoCantidad || this.movimientoCantidad <= 0) {
      this.errorMessage = 'La cantidad debe ser mayor que cero';
      return;
    }

    if (
      this.movimientoTipo === 'salida' &&
      this.movimientoCantidad > this.refaccionSeleccionada.stock
    ) {
      this.errorMessage = 'No hay suficiente stock para esta salida';
      return;
    }

    this.isLoading = true;
    const movimiento = {
      refaccion_id: this.refaccionSeleccionada.id,
      tipo: this.movimientoTipo,
      cantidad: this.movimientoCantidad,
      responsable: this.movimientoResponsable,
      notas: this.movimientoNotas,
      fecha: new Date().toISOString(),
    };

    this.http.post(`${this.apiUrl}/movimientos`, movimiento).subscribe({
      next: () => {
        this.isLoading = false;
        this.showMovimientoModal = false;
        this.cargarRefacciones();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al registrar movimiento:', err);
        this.errorMessage = 'Error al registrar el movimiento';
      },
    });
  }

  // Métodos para nueva refacción
  // Método (renombrar)
  abrirModalNuevaRefaccion() {
    this.nuevaRefaccion = {
      codigo: '',
      nombre: '',
      descripcion: '',
      proveedor: '',
      stock: 0,
      stock_minimo: 0,
      precio: 0,
      ubicacion: '',
    };
    this.showNuevaRefaccionModal = true;
  }

  guardarNuevaRefaccion() {
    if (!this.nuevaRefaccion.codigo || !this.nuevaRefaccion.nombre) {
      this.errorMessage = 'Código y nombre son campos requeridos';
      return;
    }

    this.isLoading = true;
    this.http.post(this.apiUrl, this.nuevaRefaccion).subscribe({
      next: () => {
        this.isLoading = false;
        this.showNuevaRefaccionModal = false;
        this.cargarRefacciones();
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al crear refacción:', err);
        this.errorMessage = 'Error al crear la nueva refacción';
      },
    });
  }

  // Método para cerrar sesión
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
