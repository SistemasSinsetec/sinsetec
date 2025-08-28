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
    const datosFormateados = this.convertCamelToSnake(solicitud);
    return this.http
      .post(`${this.apiUrl}/solicitudes.php`, datosFormateados, {
        headers: this.headers,
        responseType: 'json' as const,
      })
      .pipe(catchError(this.handleError));
  }

  actualizarSolicitud(id: number, solicitud: any): Observable<any> {
    const datosFormateados = this.convertCamelToSnake(solicitud);
    return this.http
      .put(`${this.apiUrl}/solicitudes.php?id=${id}`, datosFormateados, {
        headers: this.headers,
        responseType: 'json' as const,
      })
      .pipe(catchError(this.handleError));
  }

  eliminarSolicitud(id: number): Observable<any> {
    return this.http
      .delete(`${this.apiUrl}/solicitudes.php?id=${id}`, {
        headers: this.headers,
        responseType: 'json' as const,
      })
      .pipe(catchError(this.handleError));
  }

  actualizarEstado(id: number, datos: any): Observable<any> {
    const datosFormateados = this.convertCamelToSnake(datos);
    return this.http
      .put(`${this.apiUrl}/solicitudes.php?id=${id}`, datosFormateados, {
        headers: this.headers,
        responseType: 'json' as const,
      })
      .pipe(catchError(this.handleError));
  }

  // Método auxiliar para convertir camelCase a snake_case
  private convertCamelToSnake(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;

    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const snakeKey = key.replace(
          /[A-Z]/g,
          (letter) => `_${letter.toLowerCase()}`
        );
        result[snakeKey] = obj[key];
      }
    }
    return result;
  }

  private handleError(error: HttpErrorResponse) {
    let errorDetails = 'Sin detalles';

    try {
      if (error.error instanceof ProgressEvent) {
        errorDetails =
          'Error de conexión - posible problema CORS o servidor no disponible';
      } else if (typeof error.error === 'string') {
        try {
          const parsedError = JSON.parse(error.error);
          errorDetails =
            parsedError.message || parsedError.error || 'Error desconocido';
        } catch (e) {
          errorDetails = error.error;
        }
      } else if (error.error && typeof error.error === 'object') {
        errorDetails =
          error.error.message ||
          error.error.error ||
          JSON.stringify(error.error);
      } else {
        errorDetails = error.message || 'Error desconocido';
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
