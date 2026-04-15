import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Materiel } from '../../models';

const API = `${environment.apiSallesMateriels}/api/materiels`;

/** POST/PUT /api/materiels return this shape when save succeeds. */
export interface MaterielSaveResponse {
  materiel: Materiel;
  warnings: string[];
}

@Injectable({ providedIn: 'root' })
export class MaterielService {
  constructor(private http: HttpClient) {}

  getAll(): Observable<Materiel[]> {
    return this.http.get<Materiel[]>(API);
  }

  getById(id: number): Observable<Materiel> {
    return this.http.get<Materiel>(`${API}/${id}`);
  }

  create(
    nom: string,
    status: string,
    quantiteTotale: number,
    quantiteAssociee: number,
    seuilMaintenance: number,
    salleId?: number | null
  ): Observable<MaterielSaveResponse> {
    const url = salleId != null && salleId > 0 ? `${API}?salleId=${salleId}` : API;
    return this.http.post<MaterielSaveResponse>(url, { nom, status, quantiteTotale, quantiteAssociee, seuilMaintenance });
  }

  update(
    id: number,
    nom: string,
    status: string,
    quantiteTotale: number,
    quantiteAssociee: number,
    seuilMaintenance: number,
    salleId?: number | null
  ): Observable<MaterielSaveResponse> {
    const url = salleId != null ? `${API}/${id}?salleId=${salleId}` : `${API}/${id}`;
    return this.http.put<MaterielSaveResponse>(url, { nom, status, quantiteTotale, quantiteAssociee, seuilMaintenance });
  }

  /** Supprime l'équipement. Réponse 200 OK avec body { deleted: true }. */
  delete(id: number): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`${API}/${id}`);
  }
}
