// src/app/features/register-solicitudes/register-solicitudes.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';

@Component({
  selector: 'app-register-solicitudes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register-solicitudes.component.html',
  styleUrls: [
    '../../shared/styles/toolbar.scss',
    './register-solicitudes.component.scss',
  ],
})
export class RegisterSolicitudesComponent {
  // Datos para los selects
  tiposTrabajo = [
    { value: 'MC', label: 'Mantenimiento Correctivo' },
    { value: 'MP', label: 'Mantenimiento Preventivo' },
    { value: 'DG', label: 'Diagnóstico' },
    { value: 'IN', label: 'Instalación' },
  ];

  naturalezasTrabajo = [
    { value: 'MEC', label: 'Mecánica' },
    { value: 'ELC', label: 'Eléctrica' },
    { value: 'ELE', label: 'Electrónica' },
    { value: 'HID', label: 'Hidráulica' },
  ];

  tiposMaquina = [
    { value: 'CNT', label: 'Centro de Maquinado' },
    { value: 'GEN', label: 'Generador' },
    { value: 'ELM', label: 'Equipo Eléctrico' },
    { value: 'OTRO', label: 'Otro' },
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
  };

  currentStep = 1;
  totalSteps = 3;

  constructor(private authService: AuthService, private router: Router) {}

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  onSubmit() {
    console.log('Solicitud enviada:', this.solicitud);
    // Aquí iría la lógica para guardar la solicitud
  }

  logout(): void {
    try {
      this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      this.router.navigate(['/login']);
    }
  }
}
