import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common'; // Importaciones necesarias

@Component({
  selector: 'app-refacciones',
  standalone: true,
  imports: [CommonModule, DatePipe], // Añade estas importaciones
  templateUrl: './refacciones.component.html',
  styleUrls: ['./refacciones.component.scss'],
})
export class RefaccionesComponent {
  refacciones: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargarHistorial();
  }

  cargarHistorial() {
    this.http.get('/api/refacciones.php').subscribe({
      next: (data: any) => (this.refacciones = data),
      error: (err) => console.error('Error al cargar historial:', err),
    });
  }

  editar(refaccion: any) {
    // Lógica para editar (puedes reutilizar tu formulario actual)
  }
}
