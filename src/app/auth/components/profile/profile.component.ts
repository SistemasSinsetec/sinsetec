import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // ← RouterModule añadido
import { AuthService } from '../../services/auth.service';
import { ProfileService } from './profile.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], // ← RouterModule añadido aquí
})
export class ProfileComponent implements OnInit {
  userProfile: any = {
    username: '',
    email: '',
    created_at: '',
    updated_at: '',
    intentos_falifdos: 0,
    bloqueado_unfil: null,
  };

  isEditing = false;
  isLoading = false;
  message = '';
  messageType = '';

  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  showPasswordSection = false;

  constructor(
    private authService: AuthService,
    private profileService: ProfileService,
    private router: Router // ← Router inyectado
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  logout() {
    this.authService.logout();
  }

  // Métodos de navegación para el menú
  goToHome() {
    this.router.navigate(['/home']);
  }

  goToSolicitudes() {
    this.router.navigate(['/solicitudes']);
  }

  goToRegisterSolicitudes() {
    this.router.navigate(['/register-solicitudes']);
  }

  goToRefacciones() {
    this.router.navigate(['/refacciones']);
  }

  goToControlRefacciones() {
    this.router.navigate(['/control-refacciones']);
  }

  goToAccesosPermisos() {
    this.router.navigate(['/accesos-permisos']);
  }

  goToProfile() {
    this.router.navigate(['/profile']);
  }

  loadUserProfile(): void {
    this.isLoading = true;
    const currentUser = this.authService.currentUserValue;

    if (currentUser && currentUser.id) {
      this.profileService.getUserProfile(currentUser.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.userProfile = response.user;
            this.showMessage('Perfil cargado correctamente', 'success');
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error:', error.message);
          this.showMessage(error.message, 'error');
          this.isLoading = false;
        },
      });
    } else {
      this.showMessage('Usuario no autenticado', 'error');
      this.isLoading = false;
    }
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.loadUserProfile();
    }
  }

  updateProfile(): void {
    if (!this.userProfile.username || !this.userProfile.email) {
      this.showMessage('Nombre de usuario y email son requeridos', 'error');
      return;
    }

    this.isLoading = true;
    const currentUser = this.authService.currentUserValue;

    if (currentUser && currentUser.id) {
      // Preparar todos los datos del perfil para enviar
      console.log('Datos a enviar:', {
        username: this.userProfile.username,
        email: this.userProfile.email,
        nombre_completo: this.userProfile.nombre_completo,
        telefono: this.userProfile.telefono,
        direccion: this.userProfile.direccion,
        fecha_nacimiento: this.userProfile.fecha_nacimiento,
        biografia: this.userProfile.biografia,
      });

      this.profileService
        .updateUserProfile(currentUser.id, this.userProfile)
        .subscribe({
          next: (response) => {
            console.log('Respuesta del servidor:', response);
            if (response.success) {
              this.showMessage('Perfil actualizado correctamente', 'success');
              this.isEditing = false;
              // Actualizar los datos locales con TODOS los campos devueltos
              this.userProfile = {
                ...this.userProfile,
                ...response.user,
                // Asegurar que los campos que puedan ser null se muestren correctamente
                nombre_completo: response.user.nombre_completo,
                telefono: response.user.telefono,
                direccion: response.user.direccion,
                fecha_nacimiento: response.user.fecha_nacimiento,
                biografia: response.user.biografia,
              };
            } else {
              this.showMessage(
                response.message || 'Error al actualizar',
                'error'
              );
            }
            this.isLoading = false;
          },
          error: (error) => {
            this.showMessage(error.message, 'error');
            this.isLoading = false;
          },
        });
    }
  }

  changePassword(): void {
    if (!this.passwordData.currentPassword) {
      this.showMessage('La contraseña actual es requerida', 'error');
      return;
    }

    if (!this.passwordData.newPassword) {
      this.showMessage('La nueva contraseña es requerida', 'error');
      return;
    }

    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.showMessage('Las contraseñas no coinciden', 'error');
      return;
    }

    if (this.passwordData.newPassword.length < 6) {
      this.showMessage(
        'La nueva contraseña debe tener al menos 6 caracteres',
        'error'
      );
      return;
    }

    this.isLoading = true;
    const currentUser = this.authService.currentUserValue;

    if (currentUser && currentUser.id) {
      this.profileService
        .changePassword(currentUser.id, this.passwordData)
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.showMessage('Contraseña cambiada correctamente', 'success');
              this.passwordData = {
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
              };
              this.showPasswordSection = false;
            } else {
              this.showMessage(
                response.message || 'Error al cambiar contraseña',
                'error'
              );
            }
            this.isLoading = false;
          },
          error: (error) => {
            this.showMessage(error.message, 'error');
            this.isLoading = false;
          },
        });
    }
  }

  togglePasswordSection(): void {
    this.showPasswordSection = !this.showPasswordSection;
    if (!this.showPasswordSection) {
      this.passwordData = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      };
    }
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
      this.messageType = '';
    }, 5000);
  }

  formatDate(dateString: string): string {
    if (!dateString || dateString === 'NULL') return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  }
}
