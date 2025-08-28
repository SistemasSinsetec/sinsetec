import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SolicitudesDetallesService {
  private apiUrl = environment.apiUrl;
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    Accept: 'application/json',
  });

  constructor(private http: HttpClient) {}

  // Obtener todos los detalles
  getDetalles(): Observable<any> {
    return this.http
      .get(`${this.apiUrl}/solicitudes_detalles.php`, { headers: this.headers })
      .pipe(catchError(this.handleError));
  }

  // Obtener detalle por ID
  getDetalle(id: number): Observable<any> {
    return this.http
      .get(`${this.apiUrl}/solicitudes_detalles.php?id=${id}`, {
        headers: this.headers,
      })
      .pipe(catchError(this.handleError));
  }

  // Obtener detalles por solicitud_id
  getDetallesPorSolicitud(solicitudId: number): Observable<any> {
    return this.http
      .get(
        `${this.apiUrl}/solicitudes_detalles.php?solicitud_id=${solicitudId}`,
        { headers: this.headers }
      )
      .pipe(catchError(this.handleError));
  }

  // Crear nuevo detalle
  crearDetalle(detalle: any): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/solicitudes_detalles.php`, detalle, {
        headers: this.headers,
      })
      .pipe(catchError(this.handleError));
  }

  // Actualizar detalle
  actualizarDetalle(id: number, detalle: any): Observable<any> {
    return this.http
      .put(`${this.apiUrl}/solicitudes_detalles.php?id=${id}`, detalle, {
        headers: this.headers,
      })
      .pipe(catchError(this.handleError));
  }

  // Eliminar detalle
  eliminarDetalle(id: number): Observable<any> {
    return this.http
      .delete(`${this.apiUrl}/solicitudes_detalles.php?id=${id}`, {
        headers: this.headers,
      })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Código: ${error.status}\nMensaje: ${error.message}`;
    }

    console.error('Error en SolicitudesDetallesService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
