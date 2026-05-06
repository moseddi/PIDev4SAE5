import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Event, EventCreateRequest, EventUpdateRequest, EventCreateRequestBackend, EventUpdateRequestBackend } from '../models/event.model';
import { AuthService } from '../../services/auth.service';

// ─── Recommendation Types ────────────────────────────────────────────────────

export interface RecommendedEvent {
  eventId: number;
  title: string;
  score: number;
  percentage: number;
  reason: string;
  badge: string;
  engagementTag: string;
}

export interface RecommendationResponse {
  recommendations: RecommendedEvent[];
  userEngagementLevel: string;
  algorithm: string;
  totalAnalyzed: number;
}

export interface RecommendationRequest {
  user: {
    userId: number;
    specialty?: string;
    engagementLevel?: string;
    registeredEventTypes?: string[];
    registeredClubIds?: number[];
    totalRegistrations?: number;
  };
  events: {
    id: number;
    title: string;
    type: string;
    status: string;
    maxParticipants: number;
    currentParticipants: number;
    clubId?: number;
    estimatedCost?: number;
  }[];
  topN?: number;
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable({
  providedIn: 'root'
})
export class EventService {

  private apiUrl = '/api/events';
  private mlApiUrl = '/ml-api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private getHttpOptions() {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      })
    };
  }

  getEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(this.apiUrl, this.getHttpOptions());
  }

  getEventById(id: number): Observable<Event> {
    return this.http.get<Event>(`${this.apiUrl}/${id}`, this.getHttpOptions());
  }

  createEvent(eventData: EventCreateRequest): Observable<Event> {
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
    return this.http.post<Event>(this.apiUrl, backendData, this.getHttpOptions());
  }

  updateEvent(id: number, eventData: EventUpdateRequest): Observable<Event> {
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
    return this.http.put<Event>(`${this.apiUrl}/${id}`, sanitized, this.getHttpOptions());
  }

  deleteEvent(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, this.getHttpOptions());
  }

  registerForEvent(eventId: number, data: { userName: string, userEmail: string, userId: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${eventId}/register`, data, this.getHttpOptions());
  }

  getRegistrationById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/registrations/${id}`, this.getHttpOptions());
  }

  isUserRegistered(eventId: number, userId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/${eventId}/is-registered`, {
      ...this.getHttpOptions(),
      params: { userId: userId.toString() }
    });
  }

  getUserRegistrations(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/my-registrations`, {
      ...this.getHttpOptions(),
      params: { userId: userId.toString() }
    });
  }

  getEventStats(eventId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${eventId}/stats`, this.getHttpOptions());
  }

  getWaitlist(eventId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${eventId}/waitlist`, this.getHttpOptions());
  }

  promoteFromWaitlist(regId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/registrations/${regId}/promote`, {}, this.getHttpOptions());
  }

  /**
   * Get personalized event recommendations using the ML API.
   * Adapted from Notebook Objective 3: Système de Recommandation.
   * Falls back to client-side scoring if the Python API is unavailable.
   */
  getRecommendations(request: RecommendationRequest): Observable<RecommendationResponse> {
    return this.http.post<RecommendationResponse>(
      `${this.mlApiUrl}/recommend`,
      request,
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        })
      }
    ).pipe(
      catchError(err => {
        console.warn('[Recommendations] Python API unavailable, using client-side fallback:', err.message);
        return of(this.fallbackRecommendations(request));
      })
    );
  }

  /**
   * Client-side fallback — mirrors the Python algorithm.
   * Activated automatically when the Python API is offline.
   */
  private fallbackRecommendations(request: RecommendationRequest): RecommendationResponse {
    const typeScores: Record<string, number> = {
      'Competition': 0.92, 'Workshop': 0.88,
      'Conference': 0.74,  'Seminar': 0.68, 'Other': 0.60
    };
    const totalReg = request.user.totalRegistrations || 0;
    const engagementLevel = totalReg >= 5 ? 'High' : totalReg >= 2 ? 'Medium' : 'Low';
    const multipliers: Record<string, number> = { High: 1.25, Medium: 1.0, Low: 0.9 };

    const scored = request.events
      .filter(e => !['COMPLETED', 'CANCELLED'].includes((e.status || '').toUpperCase()))
      .map(e => {
        const eType = e.type || 'Other';
        let score = (typeScores[eType] || 0.60) * 0.25;
        if ((request.user.registeredEventTypes || []).includes(eType)) score += 0.20;
        const fillRate = e.maxParticipants > 0 ? e.currentParticipants / e.maxParticipants : 0;
        if (fillRate >= 0.3 && fillRate <= 0.75) score += 0.15;
        score += 0.08;
        score *= (multipliers[engagementLevel] || 1.0);
        score = Math.min(1.0, score);
        const pct = Math.round(score * 100);
        const badge = score >= 0.85 ? '🏆 Top Pick' : score >= 0.75 ? '🔥 Trending' :
                      score >= 0.65 ? '✨ Perfect Match' : '👍 Recommended';
        return {
          eventId: e.id,
          title: e.title,
          score: Math.round(score * 1000) / 1000,
          percentage: pct,
          reason: (request.user.registeredEventTypes || []).includes(eType)
            ? `Matches your interest in ${eType}s`
            : `Recommended ${eType} event`,
          badge,
          engagementTag: engagementLevel === 'High' ? 'For Active Members' :
                         engagementLevel === 'Low'  ? 'Great for Beginners' : 'You Might Like This'
        } as RecommendedEvent;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, request.topN || 5);

    return {
      recommendations: scored,
      userEngagementLevel: engagementLevel,
      algorithm: 'Client-Side Fallback (mirrors Python ML engine)',
      totalAnalyzed: request.events.length
    };
  }
}
