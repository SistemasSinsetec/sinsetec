import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SolicitudesService {
  private apiUrl = environment.apiUrl;
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
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
      .post(
        `${this.apiUrl}/registro_solicitud.php`,
        JSON.stringify(solicitud),
        {
          headers: this.headers,
        }
      )
      .pipe(catchError(this.handleError));
  }

  actualizarSolicitud(id: number, solicitud: any): Observable<any> {
    return this.http
      .put(
        `${this.apiUrl}/solicitudes.php?id=${id}`,
        JSON.stringify(solicitud),
        {
          headers: this.headers,
        }
      )
      .pipe(catchError(this.handleError));
  }

  eliminarSolicitud(id: number): Observable<any> {
    return this.http
      .delete(`${this.apiUrl}/eliminar_solicitud.php?id=${id}`, {
        headers: this.headers,
      })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    console.error('Ocurrió un error:', error);
    return throwError(
      () =>
        new Error(
          error.message ||
            'Error en el servicio de solicitudes; por favor intente nuevamente.'
        )
    );
  }
}
