import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Seance, SalleDTO, SeanceSaveResponse } from '../../models';

@Injectable({ providedIn: 'root' })
export class SeanceService {
  private baseUrl = `${environment.apiClasseSeance}/api/seances`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<Seance[]> {
    return this.http.get<Seance[]>(this.baseUrl);
  }

  getById(id: number): Observable<Seance> {
    return this.http.get<Seance>(`${this.baseUrl}/${id}`);
  }

  getByClasseId(classeId: number): Observable<Seance[]> {
    return this.http.get<Seance[]>(`${this.baseUrl}/classe/${classeId}`);
  }

  // Récupère les salles depuis salles-materiels via RestTemplate côté backend
  getSalles(): Observable<SalleDTO[]> {
    return this.http.get<SalleDTO[]>(`${this.baseUrl}/salles`);
  }

  // classeId passé en query param : POST /api/seances?classeId=3
  create(seance: Seance, classeId?: number | null): Observable<SeanceSaveResponse> {
    const url = classeId ? `${this.baseUrl}?classeId=${classeId}` : this.baseUrl;
    const body = {
      dateDebut: seance.dateDebut,
      dateFin: seance.dateFin,
      type: seance.type,
      jour: seance.jour,
      salleId: seance.salleId,
    };
    return this.http.post<SeanceSaveResponse>(url, body);
  }

  // classeId passé en query param : PUT /api/seances/1?classeId=3
  update(id: number, seance: Seance, classeId?: number | null): Observable<SeanceSaveResponse> {
    const url = classeId ? `${this.baseUrl}/${id}?classeId=${classeId}` : `${this.baseUrl}/${id}`;
    const body = {
      dateDebut: seance.dateDebut,
      dateFin: seance.dateFin,
      type: seance.type,
      jour: seance.jour,
      salleId: seance.salleId,
    };
    return this.http.put<SeanceSaveResponse>(url, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  assignerClasse(seanceId: number, classeId: number): Observable<Seance> {
    return this.http.post<Seance>(`${this.baseUrl}/${seanceId}/classe/${classeId}`, {});
  }

  getOccupiedSalles(debut: string, fin: string, excludeId?: number | null): Observable<number[]> {
    let url = `${this.baseUrl}/salles/occupees?debut=${debut}&fin=${fin}`;
    if (excludeId) {
      url += `&excludeId=${excludeId}`;
    }
    return this.http.get<number[]>(url);
  }

  getOccupiedClasses(debut: string, fin: string, excludeId?: number | null): Observable<number[]> {
    let url = `${this.baseUrl}/classes/occupees?debut=${debut}&fin=${fin}`;
    if (excludeId) {
      url += `&excludeId=${excludeId}`;
    }
    return this.http.get<number[]>(url);
  }

  generatePlanning(classeId: number): Observable<Seance[]> {
    return this.http.post<Seance[]>(`${this.baseUrl}/planning/generate/${classeId}`, {});
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/stats`);
  }
}