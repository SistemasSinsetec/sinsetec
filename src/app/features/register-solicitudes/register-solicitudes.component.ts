import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import {
  HttpClient,
  HttpClientModule,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { AuthService } from '../../auth/services/auth.service';
import { map } from 'rxjs/operators';

declare const pdfMake: any;

@Component({
  selector: 'app-register-solicitudes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './register-solicitudes.component.html',
  styleUrls: [
    '../../shared/styles/toolbar.scss',
    './register-solicitudes.component.scss',
  ],
})
export class RegisterSolicitudesComponent {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Datos para los selects
  tiposTrabajo = [
    { value: 'Mantenimiento Correctivo', label: 'Mantenimiento Correctivo' },
    { value: 'Mantenimiento Preventivo', label: 'Mantenimiento Preventivo' },
    { value: 'Diagnóstico', label: 'Diagnóstico' },
    { value: 'Instalación', label: 'Instalación' },
  ];

  naturalezasTrabajo = [
    { value: 'Mecánica', label: 'Mecánica' },
    { value: 'Eléctrica', label: 'Eléctrica' },
    { value: 'Electrónica', label: 'Electrónica' },
    { value: 'Hidráulica', label: 'Hidráulica' },
  ];

  tiposMaquina = [
    { value: 'Centro de Maquinado', label: 'Centro de Maquinado' },
    { value: 'Generador', label: 'Generador' },
    { value: 'Equipo Eléctrico', label: 'Equipo Eléctrico' },
    { value: 'Otro', label: 'Otro' },
  ];

  // Modelo del formulario
  solicitud = {
    cliente: '',
    solicitante: '',
    partida: 1,
    tipoTrabajo: '',
    naturalezaTrabajo: '',
    tipoMaquina: '',
    idMaquina: '',
    modeloMaquina: '',
    numeroSerie: '',
    descripcionServicio: '',
    observacionesPartidas: '',
  };

  // Control del formulario
  currentStep = 1;
  totalSteps = 3;
  submittedStep1 = false;
  submittedStep2 = false;
  submittedStep3 = false;
  documentId: string;
  isLoading = false;
  partidas: any[] = [];

  constructor() {
    this.documentId = this.generateDocumentId();
    this.addPartida(); // Agregar una partida inicial
  }

  generateDocumentId(): string {
    const date = new Date();
    return `ST-${date.getFullYear()}${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}${date
      .getDate()
      .toString()
      .padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  nextStep() {
    if (this.currentStep === 1 && !this.validateStep1()) return;
    if (this.currentStep === 2 && !this.validateStep2()) return;
    this.currentStep++;
  }

  prevStep() {
    if (this.currentStep > 1) this.currentStep--;
  }

  validateStep1(): boolean {
    this.submittedStep1 = true;
    return !!this.solicitud.cliente && !!this.solicitud.solicitante;
  }

  validateStep2(): boolean {
    this.submittedStep2 = true;
    return (
      !!this.solicitud.tipoTrabajo &&
      !!this.solicitud.naturalezaTrabajo &&
      !!this.solicitud.tipoMaquina
    );
  }

  validateAllSteps(): boolean {
    return (
      this.validateStep1() &&
      this.validateStep2() &&
      !!this.solicitud.idMaquina &&
      !!this.solicitud.modeloMaquina &&
      !!this.solicitud.numeroSerie
    );
  }

  addPartida() {
    this.partidas.push({
      descripcion: '',
      cantidad: 1,
      precioUnitario: 0,
      total: 0,
    });
    this.solicitud.partida = this.partidas.length;
  }

  eliminarPartida(index: number) {
    if (this.partidas.length > 1) {
      this.partidas.splice(index, 1);
      this.solicitud.partida = this.partidas.length;
    }
  }

  calcularTotalPartida(partida: any) {
    partida.total = partida.cantidad * partida.precioUnitario;
  }

  calcularTotalGeneral(): number {
    return this.partidas.reduce((total, partida) => total + partida.total, 0);
  }

  onSubmit() {
    this.submittedStep3 = true;

    if (!this.validateAllSteps()) {
      this.showError('Por favor complete todos los campos requeridos');
      return;
    }

    this.isLoading = true;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    const solicitudData = {
      ...this.solicitud,
      documentId: this.documentId,
      partidas: this.partidas,
      totalGeneral: this.calcularTotalGeneral(),
    };

    const url = this.isDevelopment()
      ? '/api/registro_solicitud.php'
      : 'https://sinsetec.com.mx/api/registro_solicitud.php';

    this.http
      .post(url, solicitudData, { headers, responseType: 'text' })
      .pipe(
        map((response) => {
          try {
            return JSON.parse(response);
          } catch (e) {
            console.error('Failed to parse JSON:', response);
            throw new Error('Invalid JSON response');
          }
        })
      )
      .subscribe({
        next: (parsedResponse) => {
          if (parsedResponse?.success) {
            this.handleSuccess(parsedResponse);
          } else {
            this.handleError(
              new HttpErrorResponse({
                error: parsedResponse,
                status: 200,
                statusText: 'OK',
                url: url,
              })
            );
          }
        },
        error: (err) => {
          this.handleError(err);
        },
      });
  }

  private isDevelopment(): boolean {
    return window.location.href.includes('localhost');
  }

  private handleSuccess(response: any) {
    this.isLoading = false;
    this.showSuccess('Solicitud registrada exitosamente');
    this.downloadPDF();
    this.resetForm();
  }

  private handleError(err: HttpErrorResponse) {
    this.isLoading = false;

    console.group('Error Detallado');
    console.error('Status:', err.status);
    console.error('Status Text:', err.statusText);
    console.error('URL:', err.url);
    console.error('Error Object:', err.error);
    console.groupEnd();

    let userMessage = 'Ocurrió un error al procesar la solicitud';
    let technicalDetails = '';

    if (err.error instanceof ErrorEvent) {
      userMessage = 'Error de comunicación con el servidor';
      technicalDetails = err.error.message;
    } else if (err.status === 0) {
      userMessage = 'Error de conexión: No se pudo contactar al servidor';
      technicalDetails = 'Verifique su conexión a internet';
    } else if (err.status === 400) {
      userMessage = 'Datos incompletos o incorrectos';
      if (err.error?.missing_fields) {
        technicalDetails = `Faltan los siguientes campos: ${err.error.missing_fields.join(
          ', '
        )}`;
      }
    } else if (err.status === 200 && err.error) {
      if (err.error.message) {
        userMessage = err.error.message;
      }
      if (err.error.error) {
        technicalDetails = JSON.stringify(err.error.error, null, 2);
      }
    } else if (err.status === 500) {
      userMessage = 'Error interno del servidor';
      if (err.error?.error) {
        technicalDetails = `Detalles técnicos: ${JSON.stringify(
          err.error.error,
          null,
          2
        )}`;
      }
    }

    const fullMessage = `${userMessage}${
      technicalDetails ? '\n\n' + technicalDetails : ''
    }`;
    alert(fullMessage);
  }

  private showSuccess(message: string) {
    alert(`✅ ${message}`);
  }

  private showError(message: string) {
    alert(`❌ ${message}`);
  }

  resetForm() {
    this.solicitud = {
      cliente: '',
      solicitante: '',
      partida: 1,
      tipoTrabajo: '',
      naturalezaTrabajo: '',
      tipoMaquina: '',
      idMaquina: '',
      modeloMaquina: '',
      numeroSerie: '',
      descripcionServicio: '',
      observacionesPartidas: '',
    };

    this.partidas = [
      {
        descripcion: '',
        cantidad: 1,
        precioUnitario: 0,
        total: 0,
      },
    ];

    this.currentStep = 1;
    this.submittedStep1 = false;
    this.submittedStep2 = false;
    this.submittedStep3 = false;
    this.documentId = this.generateDocumentId();
  }

  downloadPDF() {
    if (typeof pdfMake === 'undefined') {
      console.error('pdfMake no está disponible');
      return;
    }

    const docDefinition = this.getPdfDefinition();
    pdfMake
      .createPdf(docDefinition)
      .download(`Solicitud_${this.documentId}.pdf`);
  }

  private getPdfDefinition() {
    return {
      content: [
        { text: 'SOLICITUD DE SERVICIO TÉCNICO', style: 'header' },
        { text: `Folio: ${this.documentId}`, style: 'subheader' },
        {
          text: `Fecha: ${new Date().toLocaleDateString()}`,
          style: 'subheader',
        },
        {
          canvas: [
            { type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1 },
          ],
        },

        { text: '1. INFORMACIÓN DEL CLIENTE', style: 'sectionHeader' },
        {
          table: {
            widths: ['30%', '70%'],
            body: [
              ['Cliente:', this.solicitud.cliente || 'N/A'],
              ['Solicitante:', this.solicitud.solicitante || 'N/A'],
              ['Partida:', this.solicitud.partida.toString() || '1'],
            ],
          },
          layout: 'noBorders',
        },

        { text: '2. DATOS TÉCNICOS', style: 'sectionHeader' },
        {
          table: {
            widths: ['30%', '70%'],
            body: [
              [
                'Tipo de trabajo:',
                this.getLabel(this.tiposTrabajo, this.solicitud.tipoTrabajo) ||
                  'N/A',
              ],
              [
                'Naturaleza:',
                this.getLabel(
                  this.naturalezasTrabajo,
                  this.solicitud.naturalezaTrabajo
                ) || 'N/A',
              ],
              [
                'Tipo de máquina:',
                this.getLabel(this.tiposMaquina, this.solicitud.tipoMaquina) ||
                  'N/A',
              ],
            ],
          },
          layout: 'noBorders',
        },

        { text: '3. DESCRIPCIÓN DEL SERVICIO', style: 'sectionHeader' },
        {
          table: {
            widths: ['30%', '70%'],
            body: [
              ['ID Máquina:', this.solicitud.idMaquina || 'N/A'],
              ['Modelo:', this.solicitud.modeloMaquina || 'N/A'],
              ['Número de serie:', this.solicitud.numeroSerie || 'N/A'],
            ],
          },
          layout: 'noBorders',
        },
        { text: 'Descripción adicional:', style: 'sectionHeader' },
        {
          text: this.solicitud.descripcionServicio || 'Ninguna',
          margin: [0, 0, 0, 20],
        },

        {
          canvas: [
            { type: 'line', x1: 0, y1: 5, x2: 515, y2: 5, lineWidth: 1 },
          ],
        },
        {
          text: 'Firma del solicitante: ___________________________',
          alignment: 'right',
        },
        {
          text: 'Firma del técnico: ___________________________',
          alignment: 'right',
          margin: [0, 0, 0, 20],
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
        subheader: { fontSize: 12, bold: true, margin: [0, 0, 0, 10] },
        sectionHeader: {
          fontSize: 14,
          bold: true,
          color: '#2c5282',
          margin: [0, 10, 0, 5],
        },
      },
      defaultStyle: { font: 'Helvetica', fontSize: 12 },
    };
  }

  getLabel(options: any[], value: string): string {
    return options.find((opt) => opt.value === value)?.label || '';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
