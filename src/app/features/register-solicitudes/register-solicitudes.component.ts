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

  // Datos para los datalist
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

  // Modelo del formulario COMPLETO (con todos los campos)
  solicitud = {
    cliente: '',
    solicitante: '',
    representante: '',
    proveedor: '',
    empresa: '',
    contacto: '',
    ubicacion: '',
    descripcionServicio: '',
    iva: 16.0,
  };

  // Control del formulario
  currentStep = 1;
  totalSteps = 2;
  submittedStep1 = false;
  submittedStep2 = false;
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

    // Validar que todas las partidas tengan los campos obligatorios
    for (const partida of this.partidas) {
      if (!partida.tipoTrabajo || !partida.naturalezaTrabajo) {
        return false;
      }
    }

    return this.partidas.length > 0;
  }

  validateAllSteps(): boolean {
    return this.validateStep1() && this.validateStep2();
  }

  addPartida() {
    this.partidas.push({
      numeroPartida: this.partidas.length + 1,
      tipoTrabajo: '',
      naturalezaTrabajo: '',
      tipoMaquina: '',
      modeloMaquina: '',
      numeroSerie: '',
      idMaquina: '',
      hora: '',
      contactoRecibe: '',
      tiempoEntrega: '',
      descripcionArticulo: '',
      cantidad: 1,
      precioUnitario: 0,
      totalPartida: 0,
    });
    this.calcularTotales();
  }

  eliminarPartida(index: number) {
    if (this.partidas.length > 1) {
      this.partidas.splice(index, 1);

      // Renumerar las partidas restantes
      this.partidas.forEach((partida, i) => {
        partida.numeroPartida = i + 1;
      });

      this.calcularTotales();
    }
  }

  calcularSubtotal(): number {
    return this.partidas.reduce(
      (total, partida) => total + partida.totalPartida,
      0
    );
  }

  calcularIVA(): number {
    const subtotal = this.calcularSubtotal();
    return subtotal * (this.solicitud.iva / 100);
  }

  calcularTotalGeneral(): number {
    const subtotal = this.calcularSubtotal();
    const iva = this.calcularIVA();
    return subtotal + iva;
  }

  calcularTotales() {
    // Recalcular totales de cada partida
    this.partidas.forEach((partida) => {
      partida.totalPartida = partida.cantidad * partida.precioUnitario;
    });
  }

  onSubmit() {
    this.submittedStep1 = true;
    this.submittedStep2 = true;

    if (!this.validateStep1() || !this.validateStep2()) {
      this.showError('Por favor complete todos los campos requeridos');
      return;
    }

    this.isLoading = true;

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    // Preparar datos para enviar al backend
    const solicitudData = {
      // Campos de la tabla principal (solicitudes_servicios)
      cliente: this.solicitud.cliente,
      solicitante: this.solicitud.solicitante,
      representante: this.solicitud.representante || null,
      proveedor: this.solicitud.proveedor || null,
      empresa: this.solicitud.empresa || null,
      partida: 1, // Valor por defecto
      tipoTrabajo: this.partidas[0].tipoTrabajo, // Tomar de la primera partida
      naturalezaTrabajo: this.partidas[0].naturalezaTrabajo, // Tomar de la primera partida
      descripcionServicio: this.solicitud.descripcionServicio || null,

      // Campos de la tabla de detalles (solicitudes_detalles)
      numeroPartida: this.partidas[0].numeroPartida || 1,
      machineType: this.partidas[0].tipoMaquina || null,
      machineModel: this.partidas[0].modeloMaquina || null,
      machineSerial: this.partidas[0].numeroSerie || null,
      machineID: this.partidas[0].idMaquina || null,
      hora: this.partidas[0].hora || null,
      ubicacion: this.solicitud.ubicacion || null,
      datosContacto: this.solicitud.contacto || null,
      deliveryTime: this.partidas[0].tiempoEntrega || null,
      descripcionArticulo: this.partidas[0].descripcionArticulo || null,
      cantidad: this.partidas[0].cantidad || 1,
      precioUnitario: this.partidas[0].precioUnitario || 0.0,
      totalPartida: this.partidas[0].totalPartida || 0.0,
      subtotal: this.calcularSubtotal(),
      iva: this.calcularIVA(),
      totalGeneral: this.calcularTotalGeneral(),

      // Datos adicionales
      documentId: this.documentId,
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
      representante: '',
      proveedor: '',
      empresa: '',
      contacto: '',
      ubicacion: '',
      descripcionServicio: '',
      iva: 16.0,
    };

    this.partidas = [
      {
        numeroPartida: 1,
        tipoTrabajo: '',
        naturalezaTrabajo: '',
        tipoMaquina: '',
        modeloMaquina: '',
        numeroSerie: '',
        idMaquina: '',
        hora: '',
        contactoRecibe: '',
        tiempoEntrega: '',
        descripcionArticulo: '',
        cantidad: 1,
        precioUnitario: 0,
        totalPartida: 0,
      },
    ];

    this.currentStep = 1;
    this.submittedStep1 = false;
    this.submittedStep2 = false;
    this.documentId = this.generateDocumentId();
  }

  getLabel(options: any[], value: string): string {
    const exactMatch = options.find(
      (opt) => opt.value === value || opt.label === value
    );
    if (exactMatch) {
      return exactMatch.label;
    }
    return value || 'No especificado';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
