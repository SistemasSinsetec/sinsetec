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
export class SolicitudesService {
  private apiUrl = environment.apiUrl;
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    Accept: 'application/json',
  });

  constructor(private http: HttpClient) {}

  getSolicitudes(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}/solicitudes.php`, { headers: this.headers })
      .pipe(catchError(this.handleError));
  }

  getSolicitud(id: number): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/solicitudes.php?id=${id}`, {
        headers: this.headers,
      })
      .pipe(catchError(this.handleError));
  }

  crearSolicitud(solicitud: any): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/registro_solicitud.php`, solicitud, {
        headers: this.headers,
      })
      .pipe(catchError(this.handleError));
  }

  actualizarSolicitud(id: number, solicitud: any): Observable<any> {
    return this.http
      .put(`${this.apiUrl}/solicitudes.php?id=${id}`, solicitud, {
        headers: this.headers,
      })
      .pipe(catchError(this.handleError));
  }

  eliminarSolicitud(id: number): Observable<any> {
    return this.http
      .delete(`${this.apiUrl}/eliminar_solicitud.php?id=${id}`, {
        headers: this.headers,
      })
      .pipe(catchError(this.handleError));
  }

  registrarDocumento(id: number, documento: any): Observable<any> {
    return this.http
      .post(
        `${this.apiUrl}/registrar_documento.php`,
        { id, ...documento },
        { headers: this.headers }
      )
      .pipe(catchError(this.handleError));
  }

  actualizarEstado(id: number, datos: any): Observable<any> {
    return this.http
      .post(
        `${this.apiUrl}/actualizar_estado.php`,
        { id, ...datos },
        { headers: this.headers }
      )
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Error desconocido';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error del cliente: ${error.error.message}`;
    } else {
      errorMessage = `Código: ${error.status}\nMensaje: ${
        error.message
      }\nDetalles: ${error.error?.message || 'Sin detalles'}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
