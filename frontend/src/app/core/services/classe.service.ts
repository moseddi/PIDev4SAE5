import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Classe } from '../../models';

@Injectable({ providedIn: 'root' })
export class ClasseService {
  private baseUrl = `${environment.apiClasseSeance}/api/classes`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Classe[]> {
    return this.http.get<Classe[]>(this.baseUrl);
  }

  getById(id: number): Observable<Classe> {
    return this.http.get<Classe>(`${this.baseUrl}/${id}`);
  }

  create(classe: Classe): Observable<Classe> {
    return this.http.post<Classe>(this.baseUrl, classe);
  }

  update(id: number, classe: Classe): Observable<Classe> {
    return this.http.put<Classe>(`${this.baseUrl}/${id}`, classe);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
