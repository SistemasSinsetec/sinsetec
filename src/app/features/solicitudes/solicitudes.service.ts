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
      .get<any[]>(`${this.apiUrl}/solicitudes.php`, {
        headers: this.headers,
        responseType: 'json' as const,
      })
      .pipe(catchError(this.handleError));
  }

  getSolicitud(id: number): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/solicitudes.php?id=${id}`, {
        headers: this.headers,
        responseType: 'json' as const,
      })
      .pipe(catchError(this.handleError));
  }

  crearSolicitud(solicitud: any): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/registro_solicitud.php`, solicitud, {
        headers: this.headers,
        responseType: 'json' as const,
      })
      .pipe(catchError(this.handleError));
  }

  actualizarSolicitud(id: number, solicitud: any): Observable<any> {
    return this.http
      .put(`${this.apiUrl}/solicitudes.php?id=${id}`, solicitud, {
        headers: this.headers,
        responseType: 'json' as const,
      })
      .pipe(catchError(this.handleError));
  }

  // MÉTODO CORREGIDO - SOLO LLAMA AL ENDPOINT PRINCIPAL
  eliminarSolicitud(id: number): Observable<any> {
    return this.http
      .delete(`${this.apiUrl}/solicitudes.php?id=${id}`, {
        headers: this.headers,
        responseType: 'json' as const,
      })
      .pipe(catchError(this.handleError));
  }

  actualizarEstado(id: number, datos: any): Observable<any> {
    return this.http
      .post(
        `${this.apiUrl}/actualizar_estado.php`,
        { id, ...datos },
        {
          headers: this.headers,
          responseType: 'json' as const,
        }
      )
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorDetails = 'Sin detalles';

    try {
      if (error.error instanceof ProgressEvent) {
        errorDetails =
          'Error de conexión - posible problema CORS o servidor no disponible';
      } else if (typeof error.error === 'string') {
        const parsedError = JSON.parse(error.error);
        errorDetails =
          parsedError.message || parsedError.error || 'Error desconocido';
      } else {
        errorDetails =
          error.error.message ||
          error.error.error ||
          JSON.stringify(error.error);
      }
    } catch (e) {
      errorDetails =
        error.message || 'Error al parsear la respuesta del servidor';
    }

    const errorMessage = `Código: ${error.status || 0}\nMensaje: ${
      error.message
    }\nDetalles: ${errorDetails}`;

    console.error('Error en SolicitudesService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
