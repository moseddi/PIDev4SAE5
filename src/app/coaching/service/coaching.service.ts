import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Seance {
  id?: number;
  goodName: string;
  seanceDate: string;   // "YYYY-MM-DD"
  seanceTime: string;   // "HH:mm:ss"
  reservations?: Reservation[];
}

export interface Reservation {
  id?: number;
  studidname: string;
  merenumber: string;   // "YYYY-MM-DD"
  status: string;
  seance?: Seance;
}

@Injectable({ providedIn: 'root' })
export class CoachingService {
  //private baseUrl = '/Coaching-service/api';

  apiUrl = 'http://localhost:8089/Coaching-service';

  constructor(private http: HttpClient) {}

  // ---- Seances ----
  getAllSeances(): Observable<Seance[]> {
    return this.http.get<Seance[]>(`${this.apiUrl}/api/seances`);
  }

  getSeanceById(id: number): Observable<Seance> {
    return this.http.get<Seance>(`${this.apiUrl}/api/seances/${id}`);
  }

  createSeance(seance: Seance): Observable<Seance> {
    return this.http.post<Seance>(`${this.apiUrl}/api/seances`, seance);
  }

  updateSeance(id: number, seance: Seance): Observable<Seance> {
    return this.http.put<Seance>(`${this.apiUrl}/api/seances/${id}`, seance);
  }

  deleteSeance(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/seances/${id}`);
  }

  // ---- Reservations ----
  getAllReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/api/reservations`);
  }

  getReservationById(id: number): Observable<Reservation> {
    return this.http.get<Reservation>(`${this.apiUrl}/api/reservations/${id}`);
  }

  getReservationsBySeance(seanceId: number): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/api/seances/${seanceId}/reservations`);
  }

  createReservation(seanceId: number, reservation: Reservation): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.apiUrl}/api/seances/${seanceId}/reservations`, reservation);
  }

  updateReservation(id: number, reservation: Reservation): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.apiUrl}/api/reservations/${id}`, reservation);
  }

  deleteReservation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/reservations/${id}`);
  }
}
