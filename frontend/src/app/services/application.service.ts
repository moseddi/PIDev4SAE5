import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Application, ApplicationRequest, ApplicationStatus, JobOffer } from '../models/application.models';

@Injectable({ providedIn: 'root' })
export class ApplicationService {

  // Proxy rules in proxy.conf.json rewrite:
  //   /career-api/**  →  http://localhost:8089/** (API Gateway)
  private readonly baseJobs = `/career-api/job-offers`;
  private readonly baseApps = `/career-api/applications`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
    
    // Check if we have a token in localStorage
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  /**
   * Normalize a backend Application response into the frontend Application model.
   * The backend returns { jobOffer: { id, title, ... } } 
   * but the frontend expects { jobOfferId, jobOfferTitle }.
   */
  private normalizeApp(raw: any): Application {
    return {
      id: raw.id,
      userId: raw.userId,
      bio: raw.bio || '',
      specialty: raw.specialty || '',
      experience: raw.experience || '',
      status: raw.status || ApplicationStatus.PENDING,
      createdAt: raw.createdAt,
      jobOffer: raw.jobOffer,
      jobOfferId: raw.jobOfferId || raw.jobOffer?.id,
      jobOfferTitle: raw.jobOfferTitle || raw.jobOffer?.title
    };
  }

  // ─── Job Offers ───────────────────────────────────────────────────────────

  getAllJobs(): Observable<JobOffer[]> {
    return this.http.get<JobOffer[]>(this.baseJobs, { headers: this.getHeaders() }).pipe(
      tap(jobs => console.log(`✅ [GET] job-offers → ${jobs.length} offers`)),
      catchError(err => {
        console.error('❌ [GET] job-offers failed:', err);
        return throwError(() => err);
      })
    );
  }

  getActiveJobs(): Observable<JobOffer[]> {
    // Backend doesn't have /active endpoint, use getAllJobs and filter
    return this.getAllJobs().pipe(
      map(jobs => jobs.filter(j => j.active !== false)),
      tap(jobs => console.log(`✅ [GET] active jobs → ${jobs.length} offers`)),
      catchError(err => {
        console.warn('⚠️ [GET] job-offers failed:', err.status);
        return of([]);
      })
    );
  }

  getJobById(id: number): Observable<JobOffer> {
    return this.http.get<JobOffer>(`${this.baseJobs}/${id}`, { headers: this.getHeaders() }).pipe(
      tap(job => console.log(`✅ [GET] job-offer/${id}:`, job.title)),
      catchError(err => {
        console.error(`❌ [GET] job-offer/${id} failed:`, err);
        return throwError(() => err);
      })
    );
  }

  createJob(job: JobOffer): Observable<JobOffer> {
    const { id, ...payload } = job as any;
    console.log('📤 [POST] job-offers payload:', payload);
    return this.http.post<JobOffer>(this.baseJobs, payload, { headers: this.getHeaders() }).pipe(
      tap(created => console.log('✅ [POST] job-offer created with id:', created.id)),
      catchError(err => {
        console.error('❌ [POST] job-offers failed:', err);
        return throwError(() => err);
      })
    );
  }

  updateJob(id: number, job: JobOffer): Observable<JobOffer> {
    console.log(`📤 [PUT] job-offers/${id} payload:`, job);
    return this.http.put<JobOffer>(`${this.baseJobs}/${id}`, job, { headers: this.getHeaders() }).pipe(
      tap(updated => console.log(`✅ [PUT] job-offer/${id} updated:`, updated.title)),
      catchError(err => {
        console.error(`❌ [PUT] job-offers/${id} failed:`, err);
        return throwError(() => err);
      })
    );
  }

  deleteJob(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseJobs}/${id}`, { headers: this.getHeaders() }).pipe(
      tap(() => console.log(`✅ [DELETE] job-offer/${id} deleted`)),
      catchError(err => {
        console.error(`❌ [DELETE] job-offers/${id} failed:`, err);
        return throwError(() => err);
      })
    );
  }

  toggleJobActive(id: number, job: JobOffer): Observable<JobOffer> {
    const toggled = { ...job, active: !job.active };
    return this.updateJob(id, toggled);
  }

  // ─── Applications ─────────────────────────────────────────────────────────

  getAll(): Observable<Application[]> {
    return this.http.get<any[]>(`${this.baseApps}`, { headers: this.getHeaders() }).pipe(
      map(rawApps => rawApps.map(a => this.normalizeApp(a))),
      tap(apps => console.log(`✅ [GET] applications → ${apps.length} apps`)),
      catchError(err => {
        console.error('❌ [GET] applications failed:', err);
        return throwError(() => err);
      })
    );
  }

  getMyApplications(): Observable<Application[]> {
    return this.http.get<any[]>(`${this.baseApps}/my`, { headers: this.getHeaders() }).pipe(
      map(rawApps => rawApps.map(a => this.normalizeApp(a))),
      tap(apps => console.log(`✅ [GET] my applications → ${apps.length} apps`)),
      catchError(err => {
        console.error('❌ [GET] my applications failed:', err);
        // Fallback: try getting all applications
        return this.http.get<any[]>(`${this.baseApps}`, { headers: this.getHeaders() }).pipe(
          map(rawApps => rawApps.map(a => this.normalizeApp(a))),
          tap(apps => console.log(`✅ [GET] applications (fallback for /my) → ${apps.length} apps`)),
          catchError(err2 => {
            console.error('❌ [GET] applications fallback also failed:', err2);
            return of([]);
          })
        );
      })
    );
  }

  applyToJob(request: ApplicationRequest): Observable<Application> {
    console.log('📤 [POST] applications payload:', request);
    return this.http.post<any>(this.baseApps, request, { headers: this.getHeaders() }).pipe(
      map(raw => this.normalizeApp(raw)),
      tap(app => {
        console.log(`✅ [POST] application created with id:`, app.id);
      }),
      catchError(err => {
        console.error('❌ [POST] applications failed:', err);
        return throwError(() => err);
      })
    );
  }

  updateStatus(id: number, status: ApplicationStatus): Observable<Application> {
    return this.http.put<any>(
      `${this.baseApps}/${id}/status`,
      { status },
      { headers: this.getHeaders() }
    ).pipe(
      map(raw => this.normalizeApp(raw)),
      tap(app => console.log(`✅ [PUT] application/${id} status → ${app.status}`)),
      catchError(err => {
        console.error(`❌ [PUT] application/${id}/status failed:`, err);
        return throwError(() => err);
      })
    );
  }
}
