import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Salle } from '../../models';

@Injectable({ providedIn: 'root' })
export class SalleService {
  private baseUrl = `${environment.apiSallesMateriels}/api/salles`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Salle[]> {
    return this.http.get<Salle[]>(this.baseUrl);
  }

  getById(id: number): Observable<Salle> {
    return this.http.get<Salle>(`${this.baseUrl}/${id}`);
  }

  create(salle: Salle): Observable<Salle> {
    return this.http.post<Salle>(this.baseUrl, salle);
  }

  update(id: number, salle: Salle): Observable<Salle> {
    return this.http.put<Salle>(`${this.baseUrl}/${id}`, salle);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
