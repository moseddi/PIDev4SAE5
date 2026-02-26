import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PhysicalSpace, PhysicalSpaceCreateRequest, PhysicalSpaceUpdateRequest } from '../models';

@Injectable({
  providedIn: 'root'
})
export class PhysicalSpaceService {

  private apiUrl = '/api/physical-spaces';

  constructor(private http: HttpClient) {}

  getSpaces(): Observable<PhysicalSpace[]> {
    return this.http.get<PhysicalSpace[]>(this.apiUrl);
  }

  getSpaceById(id: number): Observable<PhysicalSpace> {
    return this.http.get<PhysicalSpace>(`${this.apiUrl}/${id}`);
  }

  createSpace(spaceData: PhysicalSpaceCreateRequest): Observable<PhysicalSpace> {
    return this.http.post<PhysicalSpace>(this.apiUrl, spaceData);
  }

  updateSpace(id: number, spaceData: PhysicalSpaceUpdateRequest): Observable<PhysicalSpace> {
    return this.http.put<PhysicalSpace>(`${this.apiUrl}/${id}`, spaceData);
  }

  deleteSpace(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
