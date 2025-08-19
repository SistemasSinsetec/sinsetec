import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../auth/services/auth.service';
import { FileSizePipe } from './file-size.pipe';

declare const pdfMake: any;

@Component({
  selector: 'app-register-refacciones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    HttpClientModule,
    FileSizePipe,
  ],
  templateUrl: './register-refacciones.component.html',
  styleUrls: [
    '../../shared/styles/toolbar.scss',
    './register-refacciones.component.scss',
  ],
})
export class RegisterRefaccionesComponent {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);

  refaccion = {
    cliente: '',
    empresa: '',
    claveInterna: '',
    nombre: '',
    modelo: '',
    disponible: true,
    archivos: [] as File[],
    previews: [] as string[],
    rack: '',
    cajon: '',
    categorias: [] as string[],
    descripcion: '',
    precio: 0,
    fechaRegistro: new Date().toISOString().split('T')[0],
  };

  opcionesDisponible = [
    { value: true, label: 'Sí' },
    { value: false, label: 'No' },
  ];

  categoriasPosibles = [
    { value: 'Mecánica', label: 'Mecánica' },
    { value: 'Eléctrica', label: 'Eléctrica' },
    { value: 'Hidráulica', label: 'Hidráulica' },
    { value: 'Electrónica', label: 'Electrónica' },
    { value: 'Neumática', label: 'Neumática' },
  ];

  currentStep = 1;
  totalSteps = 3;
  submittedStep1 = false;
  submittedStep2 = false;
  submittedStep3 = false;
  documentId: string;
  isLoading = false;

  constructor() {
    this.documentId = this.generateDocumentId();
  }

  generateDocumentId(): string {
    const date = new Date();
    return `RF-${date.getFullYear()}${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}${date
      .getDate()
      .toString()
      .padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  nextStep() {
    if (this.currentStep === 1 && !this.validateStep1()) {
      this.submittedStep1 = true;
      return;
    }
    if (this.currentStep === 2 && !this.validateStep2()) {
      this.submittedStep2 = true;
      return;
    }
    this.currentStep++;
  }

  prevStep() {
    this.currentStep--;
  }

  validateStep1(): boolean {
    return (
      !!this.refaccion.cliente &&
      !!this.refaccion.empresa &&
      !!this.refaccion.claveInterna &&
      !!this.refaccion.nombre
    );
  }

  validateStep2(): boolean {
    return this.refaccion.categorias.length > 0;
  }

  validateAllSteps(): boolean {
    return this.validateStep1() && this.validateStep2();
  }

  onFileChange(event: any) {
    this.refaccion.archivos = [];
    this.refaccion.previews = [];

    if (event.target.files && event.target.files.length > 0) {
      for (let i = 0; i < event.target.files.length; i++) {
        const file = event.target.files[i];
        this.refaccion.archivos.push(file);

        if (file.type.match('image.*')) {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            this.refaccion.previews.push(e.target.result);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  }

  removeFile(index: number) {
    this.refaccion.archivos.splice(index, 1);
    if (index < this.refaccion.previews.length) {
      this.refaccion.previews.splice(index, 1);
    }
  }

  toggleCategoria(categoria: string) {
    const index = this.refaccion.categorias.indexOf(categoria);
    if (index >= 0) {
      this.refaccion.categorias.splice(index, 1);
    } else {
      this.refaccion.categorias.push(categoria);
    }
  }

  onSubmit() {
    if (!this.validateAllSteps()) {
      alert('Complete todos los campos obligatorios');
      return;
    }

    this.isLoading = true;

    const formData = new FormData();
    formData.append('empresa', this.refaccion.empresa);
    formData.append('cliente', this.refaccion.cliente);
    formData.append('claveInterna', this.refaccion.claveInterna);
    formData.append('nombre', this.refaccion.nombre);
    formData.append('modelo', this.refaccion.modelo || '');
    formData.append('disponible', this.refaccion.disponible.toString());
    formData.append('rack', this.refaccion.rack || '');
    formData.append('cajon', this.refaccion.cajon || '');
    formData.append('descripcion', this.refaccion.descripcion || '');
    formData.append('precio', this.refaccion.precio.toString());
    formData.append('categorias', JSON.stringify(this.refaccion.categorias));
    formData.append('documentId', this.documentId);

    this.refaccion.archivos.forEach((file) => {
      formData.append('archivos[]', file, file.name);
    });

    const url = this.getBackendUrl('registro_refacciones.php');

    this.http.post(url, formData).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.success) {
          alert('✅ Refacción registrada correctamente');
          this.downloadPDF();
          this.resetForm();
        } else {
          alert(`❌ Error: ${response.message || 'No se pudo registrar'}`);
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error completo:', {
          status: err.status,
          urlIntentada: url,
          errorDetails: err,
          rutaFísicaRequerida:
            'C:\\xampp\\htdocs\\sinsetec-php\\registro_refacciones.php',
        });
        alert(
          `🚨 Error en la conexión (${err.status}):\n\nVerifica que:\n1. El archivo PHP existe en la ruta correcta\n2. El servidor está corriendo\n3. La URL es accesible: ${url}`
        );
      },
    });
  }

  private getBackendUrl(endpoint: string): string {
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    const basePath = '/sinsetec-php'; // Nota: sin .php en el nombre del directorio

    return isLocalhost
      ? `http://localhost:2898${basePath}/${endpoint}`
      : `https://tudominio.com${basePath}/${endpoint}`;
  }

  downloadPDF() {
    if (typeof pdfMake === 'undefined') {
      console.error('pdfMake no está disponible');
      return;
    }

    const docDefinition = this.getPdfDefinition();
    pdfMake
      .createPdf(docDefinition)
      .download(`Refaccion_${this.documentId}.pdf`);
  }

  private getPdfDefinition() {
    return {
      content: [
        { text: 'REGISTRO DE REFACCIÓN', style: 'header' },
        { text: `ID: ${this.documentId}`, style: 'subheader' },
        { text: `Fecha: ${this.refaccion.fechaRegistro}`, style: 'subheader' },
        { text: '1. INFORMACIÓN BÁSICA', style: 'sectionHeader' },
        {
          table: {
            widths: ['30%', '70%'],
            body: [
              ['Cliente:', this.refaccion.cliente || 'N/A'],
              ['Empresa:', this.refaccion.empresa || 'N/A'],
              ['Clave Interna:', this.refaccion.claveInterna || 'N/A'],
              ['Nombre:', this.refaccion.nombre || 'N/A'],
              ['Modelo:', this.refaccion.modelo || 'N/A'],
              ['Disponible:', this.refaccion.disponible ? 'Sí' : 'No'],
            ],
          },
          layout: 'noBorders',
        },
        { text: '2. ALMACENAMIENTO Y CATEGORÍAS', style: 'sectionHeader' },
        {
          table: {
            widths: ['30%', '70%'],
            body: [
              ['Rack:', this.refaccion.rack || 'N/A'],
              ['Cajón:', this.refaccion.cajon || 'N/A'],
              ['Categorías:', this.refaccion.categorias.join(', ') || 'N/A'],
            ],
          },
          layout: 'noBorders',
        },
        { text: '3. DESCRIPCIÓN', style: 'sectionHeader' },
        {
          text: this.refaccion.descripcion || 'Ninguna',
          margin: [0, 0, 0, 15],
        },
        { text: '4. PRECIO', style: 'sectionHeader' },
        {
          text: `$${this.refaccion.precio.toFixed(2)}`,
          margin: [0, 0, 0, 15],
        },
        {
          text: `Archivos adjuntos: ${
            this.refaccion.archivos.length > 0
              ? this.refaccion.archivos.map((f) => f.name).join(', ')
              : 'Ninguno'
          }`,
          style: 'sectionHeader',
          margin: [0, 0, 0, 5],
        },
      ],
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          color: '#1a365d',
          alignment: 'center',
          margin: [0, 0, 0, 10],
        },
        subheader: {
          fontSize: 12,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        sectionHeader: {
          fontSize: 14,
          bold: true,
          color: '#2c5282',
          margin: [0, 10, 0, 5],
        },
      },
      defaultStyle: {
        font: 'Helvetica',
        fontSize: 12,
      },
    };
  }

  resetForm() {
    this.refaccion = {
      cliente: '',
      empresa: '',
      claveInterna: '',
      nombre: '',
      modelo: '',
      disponible: true,
      archivos: [],
      previews: [],
      rack: '',
      cajon: '',
      categorias: [],
      descripcion: '',
      precio: 0,
      fechaRegistro: new Date().toISOString().split('T')[0],
    };

    this.currentStep = 1;
    this.submittedStep1 = false;
    this.submittedStep2 = false;
    this.submittedStep3 = false;
    this.documentId = this.generateDocumentId();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
