import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Event, EventCreateRequest, EventUpdateRequest, EventCreateRequestBackend, EventUpdateRequestBackend } from '../models/event.model';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  private apiUrl = '/api/events';

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    })
  };

  constructor(private http: HttpClient) { }

  getEvents(): Observable<Event[]> {
    console.log('=== EVENT SERVICE GET ===');
    console.log('Fetching events from:', this.apiUrl);

    return this.http.get<Event[]>(this.apiUrl, this.httpOptions).pipe(
      tap((response: any) => {
        console.log('=== EVENTS HTTP RESPONSE ===');
        console.log('Response:', response);
        console.log('Response type:', typeof response);
        console.log('Is array:', Array.isArray(response));
        console.log('=== END EVENTS HTTP RESPONSE ===');
      }),
      catchError((error) => {
        console.error('=== EVENTS HTTP ERROR ===');
        console.error('Error:', error);
        console.error('Status:', error.status);
        console.error('Status text:', error.statusText);
        console.error('URL:', error.url);
        return throwError(() => error);
      })
    );
  }

  getEventById(id: number): Observable<Event> {
    console.log('=== EVENT SERVICE GET BY ID ===');
    console.log('Fetching event with ID:', id);
    console.log('Final URL:', `${this.apiUrl}/${id}`);

    return this.http.get<Event>(`${this.apiUrl}/${id}`, this.httpOptions).pipe(
      tap((response: any) => {
        console.log('=== GET EVENT BY ID RESPONSE ===');
        console.log('Response:', response);
        console.log('=== END GET EVENT BY ID RESPONSE ===');
      }),
      catchError((error) => {
        console.error('=== GET EVENT BY ID ERROR ===');
        console.error('Error:', error);
        return throwError(() => error);
      })
    );
  }

  createEvent(eventData: EventCreateRequest): Observable<Event> {
    console.log('=== EVENT SERVICE CREATE ===');
    console.log('Creating event:', JSON.stringify(eventData, null, 2));

    // Ensure date has seconds (datetime-local gives 'YYYY-MM-DDTHH:mm', backend needs 'YYYY-MM-DDTHH:mm:ss')
    const formatDate = (d: string) => d && d.length === 16 ? d + ':00' : d;

    const backendData: EventCreateRequestBackend = {
      Title: eventData.Title,
      Type: eventData.type,
      StartDate: formatDate(eventData.startDate),
      EndDate: formatDate(eventData.endDate),
      Manifesto: eventData.manifesto,
      MaxParticipants: Number(eventData.maxParticipants),
      Status: eventData.status || 'PLANNED',
      ID_Club: Number(eventData.ID_Club),
      EstimatedCost: Number(eventData.estimatedCost)
    };

    console.log('=== BACKEND DATA (PASCAL CASE) ===');
    console.log('Data:', JSON.stringify(backendData, null, 2));
    console.log('=== END BACKEND DATA ===');

    return this.http.post<Event>(this.apiUrl, backendData, this.httpOptions).pipe(
      tap((response: any) => {
        console.log('=== CREATE EVENT RESPONSE ===');
        console.log('Response:', response);
        console.log('=== END CREATE EVENT RESPONSE ===');
      }),
      catchError((error) => {
        console.error('=== CREATE EVENT ERROR ===');
        console.error('Error creating event:', error);
        console.error('Full error object:', error);

        if (error?.error) {
          console.error('Error Body:', error.error);
          if (typeof error.error === 'object') {
            console.error('Backend Exception:', error.error.type);
            console.error('Backend Message:', error.error.error || error.error.message);
          }
        }

        return throwError(() => error);
      })
    );
  }

  updateEvent(id: number, eventData: EventUpdateRequest): Observable<Event> {
    console.log('=== EVENT SERVICE UPDATE ===');
    console.log('Updating event ID:', id);

    const formatDate = (d: string | undefined) => d && d.length === 16 ? d + ':00' : d;
    const sanitized: EventUpdateRequestBackend = {
      Title: eventData.Title,
      Type: eventData.type,
      StartDate: formatDate(eventData.startDate),
      EndDate: formatDate(eventData.endDate),
      Manifesto: eventData.manifesto,
      MaxParticipants: eventData.maxParticipants !== undefined ? Number(eventData.maxParticipants) : undefined,
      Status: eventData.status,
      ID_Club: eventData.ID_Club !== undefined ? Number(eventData.ID_Club) : undefined,
      EstimatedCost: eventData.estimatedCost !== undefined ? Number(eventData.estimatedCost) : undefined
    };

    return this.http.put<Event>(`${this.apiUrl}/${id}`, sanitized, this.httpOptions).pipe(
      tap((response: any) => {
        console.log('=== UPDATE EVENT RESPONSE ===');
        console.log('Response:', response);
        console.log('=== END UPDATE EVENT RESPONSE ===');
      }),
      catchError((error) => {
        console.error('=== UPDATE EVENT ERROR ===');
        console.error('Error:', error);
        return throwError(() => error);
      })
    );
  }

  deleteEvent(id: number): Observable<any> {
    console.log('=== EVENT SERVICE DELETE ===');
    console.log('Deleting event ID:', id);
    console.log('Final URL:', `${this.apiUrl}/${id}`);

    return this.http.delete(`${this.apiUrl}/${id}`, this.httpOptions).pipe(
      tap((response: any) => {
        console.log('=== DELETE EVENT RESPONSE ===');
        console.log('Response:', response);
        console.log('=== END DELETE EVENT RESPONSE ===');
      }),
      catchError((error) => {
        console.error('=== DELETE EVENT ERROR ===');
        console.error('Error:', error);
        return throwError(() => error);
      })
    );
  }
}
