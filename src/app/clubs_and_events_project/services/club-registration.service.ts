import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ClubRegistration, ClubRegistrationCreateRequest, ClubRegistrationUpdateRequest } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ClubRegistrationService {
  private apiUrl = '/api/club-registrations';

  constructor(private http: HttpClient) { }

  getRegistrations(): Observable<ClubRegistration[]> {
    return this.http.get<ClubRegistration[]>(this.apiUrl);
  }

  getRegistrationById(id: number): Observable<ClubRegistration> {
    return this.http.get<ClubRegistration>(`${this.apiUrl}/${id}`);
  }

  getRegistrationsByClub(clubId: number): Observable<ClubRegistration[]> {
    return this.http.get<ClubRegistration[]>(`${this.apiUrl}/club/${clubId}`);
  }

  getRegistrationsByUser(userId: number): Observable<ClubRegistration[]> {
    return this.http.get<ClubRegistration[]>(`${this.apiUrl}/user/${userId}`);
  }

  createRegistration(registrationData: ClubRegistrationCreateRequest): Observable<ClubRegistration> {
    console.log('=== SENDING REGISTRATION TO API ===');
    console.log('Endpoint:', this.apiUrl);
    console.log('Data:', registrationData);
    return this.http.post<ClubRegistration>(this.apiUrl, registrationData);
  }

  updateRegistration(id: number, registrationData: ClubRegistrationUpdateRequest): Observable<ClubRegistration> {
    return this.http.put<ClubRegistration>(`${this.apiUrl}/${id}`, registrationData);
  }

  deleteRegistration(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
