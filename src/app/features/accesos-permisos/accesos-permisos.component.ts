import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-accesos-permisos',
  templateUrl: './accesos-permisos.component.html',
  styleUrls: ['./accesos-permisos.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
})
export class AccesosPermisosComponent {
  logout() {
    throw new Error('Method not implemented.');
  }
  refacciones: any[] = [];
  apiUrl = '/api/accesos.php';
  buscadorClave = '';
  isLoading = true;

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}
}
