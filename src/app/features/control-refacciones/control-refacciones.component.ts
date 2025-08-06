import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-control-refacciones',
  templateUrl: './control-refacciones.component.html',
  styleUrls: ['./control-refacciones.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink, RouterOutlet],
})
export class ControlRefaccionesComponent {
  // Modelo del artículo
  articulo = {
    clave: '',
    claveInterna: '',
    cantidad: 0,
    disponible: 0,
    unidadMedida: '',
    descripcion: '',
    condicion: '',
    costoCompra: 0,
    rack: '',
    cajon: '',
    apartado: '',
    categoria1: '',
    categoria2: '',
    categoria3: '',
    archivo: null as File | null,
  };

  // Estado de la aplicación
  estaEditando = false;
  archivoNombre = 'Sin Archivo';

  constructor(private authService: AuthService, private router: Router) {}

  // Método para cerrar sesión
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Método para manejar la selección de archivo
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.articulo.archivo = input.files[0];
      this.archivoNombre = this.articulo.archivo.name;
    }
  }

  // Método para guardar el artículo
  guardarArticulo(): void {
    console.log('Artículo guardado:', this.articulo);
    // Aquí iría la lógica para guardar en el backend
    alert('Artículo guardado correctamente');
    this.resetFormulario();
  }

  // Método para buscar artículo
  buscarArticulo(): void {
    // Datos de ejemplo para simular búsqueda
    const articuloEjemplo = {
      clave: 'REF-001',
      claveInterna: 'INT-001',
      cantidad: 10,
      disponible: 8,
      unidadMedida: 'Pieza',
      descripcion: 'Rodamiento de bolas 6204',
      condicion: 'Nuevo',
      costoCompra: 125.5,
      rack: 'A1',
      cajon: 'B2',
      apartado: 'C3',
      categoria1: 'Rodamientos',
      categoria2: 'Transmisión',
      categoria3: 'Mecánica',
      archivo: null,
    };

    this.articulo = { ...articuloEjemplo };
    this.estaEditando = true;
    this.archivoNombre = 'Sin Archivo';
  }

  // Método para nuevo artículo
  nuevoArticulo(): void {
    this.resetFormulario();
  }

  // Método para resetear el formulario
  private resetFormulario(): void {
    this.articulo = {
      clave: '',
      claveInterna: '',
      cantidad: 0,
      disponible: 0,
      unidadMedida: '',
      descripcion: '',
      condicion: '',
      costoCompra: 0,
      rack: '',
      cajon: '',
      apartado: '',
      categoria1: '',
      categoria2: '',
      categoria3: '',
      archivo: null,
    };
    this.archivoNombre = 'Sin Archivo';
    this.estaEditando = false;
  }
}
