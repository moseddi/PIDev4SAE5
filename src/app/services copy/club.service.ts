import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Club } from '../models/club.model';
import { ClubCreateRequestBackend, ClubUpdateRequestBackend } from '../models/club.model';

@Injectable({
  providedIn: 'root'
})
export class ClubService {

  private apiUrl = '/api/clubs';

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  constructor(private http: HttpClient) { }

  getClubs(): Observable<Club[]> {
    console.log(`ClubService: GET all clubs from ${this.apiUrl}`);
    return this.http.get<Club[]>(this.apiUrl, this.httpOptions).pipe(
      tap(data => console.log('ClubService: GET response success', data)),
      catchError(error => {
        console.error('ClubService: HTTP ERROR', {
          url: error.url,
          status: error.status,
          message: error.message,
          error: error.error
        });
        return throwError(() => error);
      })
    );
  }

  getClubById(id: number): Observable<Club> {
    const url = `${this.apiUrl}/${id}`;
    console.log(`ClubService: GET club by ID from ${url}`);
    return this.http.get<Club>(url).pipe(
      tap(data => console.log('ClubService: GET ID response success', data)),
      catchError(error => {
        console.error('ClubService: GET ID ERROR', error);
        return throwError(() => error);
      })
    );
  }

  createClub(clubData: ClubCreateRequestBackend): Observable<Club> {
    console.log('=== CLUB SERVICE: CREATE CLUB ===');
    console.log('Payload being sent to API:', clubData);
    console.log('Payload JSON:', JSON.stringify(clubData));

    // Ensure description is present
    // Description check removed


    return this.http.post<Club>(this.apiUrl, clubData);
  }

  updateClub(id: number, clubData: ClubUpdateRequestBackend): Observable<Club> {
    console.log('=== CLUB SERVICE UPDATE ===');
    console.log('Updating club ID:', id);
    console.log('Sending to backend:', JSON.stringify(clubData, null, 2));
    console.log('=== END CLUB SERVICE UPDATE ===');
    return this.http.put<Club>(`${this.apiUrl}/${id}`, clubData);
  }

  deleteClub(id: number): Observable<any> {
    console.log('=== CLUB SERVICE DELETE ===');
    console.log('Deleting club ID:', id);
    console.log('Final URL:', `${this.apiUrl}/${id}`);
    console.log('=== END CLUB SERVICE DELETE ===');

    // Simple delete without complex headers/options
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
