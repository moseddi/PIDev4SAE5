import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Application, ApplicationStatus, Level, JobOffer } from '../models/application.models';


@Injectable({
    providedIn: 'root'
})
export class ApplicationService {
    private readonly baseApps = `/career-api/applications`;
    private readonly baseJobs = `/career-api/job-offers`;

    private httpOptions = {
        headers: new HttpHeaders()
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
    };

    private applicationsSubject = new BehaviorSubject<Application[]>([]);
    private jobOffersSubject = new BehaviorSubject<JobOffer[]>([]);

    applications$ = this.applicationsSubject.asObservable();
    jobOffers$ = this.jobOffersSubject.asObservable();

    constructor(private http: HttpClient) {}

    /**
     * Normalize backend response to ensure consistent Application structure
     */
    private normalizeApp(raw: any): Application {
        return {
            id: raw.id,
            status: raw.status || ApplicationStatus.PENDING,
            userId: raw.userId,
            bio: raw.bio || '',
            specialty: raw.specialty || '',
            experience: raw.experience || '',
            createdAt: raw.createdAt,
            jobOffer: raw.jobOffer || { id: raw.jobOfferId, title: 'Offre inconnue', description: '', requiredLevel: Level.A1, active: true },
            jobOfferId: raw.jobOfferId || raw.jobOffer?.id,
            jobOfferTitle: raw.jobOfferTitle || raw.jobOffer?.title
        };
    }

    getAll(): Observable<Application[]> {
        console.log('Fetching all applications...');
        return this.http.get<any[]>(this.baseApps, this.httpOptions).pipe(
            map(rawApps => (rawApps || []).map(a => this.normalizeApp(a))),
            tap((apps) => {
                console.log('Applications received from API:', apps?.length);
                this.applicationsSubject.next(apps);
            }),
            catchError((error) => {
                console.warn('API applications failed:', error.message);
                return of([]);
            })
        );
    }

    submitApplication(app: Partial<Application>): Observable<Application> {
        // Build payload with jobOfferId for the backend
        const payload: any = {
            bio: app.bio,
            specialty: app.specialty,
            experience: app.experience,
            userId: app.userId,
            jobOfferId: app.jobOffer?.id || (app as any).jobOfferId
        };
        console.log('📤 [POST] applications payload:', payload);

        return this.http.post<any>(this.baseApps, payload, this.httpOptions).pipe(
            map(raw => this.normalizeApp(raw)),
            tap((newApp) => {
                const current = this.applicationsSubject.value;
                this.applicationsSubject.next([...current, newApp]);
            }),
            catchError((error) => {
                console.error('❌ [POST] applications failed:', error);
                throw error;
            })
        );
    }

    updateStatus(id: number, status: ApplicationStatus): Observable<Application> {
        // Backend expects PUT, not PATCH
        return this.http.put<any>(`${this.baseApps}/${id}/status`, { status }, this.httpOptions).pipe(
            map(raw => this.normalizeApp(raw)),
            tap((updatedApp) => {
                const current = this.applicationsSubject.value;
                const index = current.findIndex(a => a.id === id);
                if (index !== -1) {
                    current[index] = updatedApp;
                    this.applicationsSubject.next([...current]);
                }
            }),
            catchError((error) => {
                console.error(`❌ [PUT] application/${id}/status failed:`, error);
                throw error;
            })
        );
    }

    // Job Offer CRUD Methods
    getAllJobs(): Observable<JobOffer[]> {
        console.log('Fetching all job offers...');
        return this.http.get<JobOffer[]>(this.baseJobs, this.httpOptions).pipe(
            tap((jobs) => {
                console.log('Job offers received from API:', jobs?.length);
                this.jobOffersSubject.next(jobs || []);
            }),
            catchError((error) => {
                console.warn('API job offers failed:', error.message);
                return of([]);
            })
        );
    }

    getJobById(id: number): Observable<JobOffer> {
        return this.http.get<JobOffer>(`${this.baseJobs}/${id}`, this.httpOptions).pipe(
            catchError((error) => {
                console.error(`❌ [GET] job-offer/${id} failed:`, error);
                throw error;
            })
        );
    }

    createJob(job: JobOffer): Observable<JobOffer> {
        const { id, ...payload } = job as any;
        return this.http.post<JobOffer>(this.baseJobs, payload, this.httpOptions).pipe(
            tap((newJob) => {
                const current = this.jobOffersSubject.value;
                this.jobOffersSubject.next([...current, newJob]);
            }),
            catchError((error) => {
                console.error('❌ [POST] job-offers failed:', error);
                throw error;
            })
        );
    }

    updateJob(id: number, job: JobOffer): Observable<JobOffer> {
        return this.http.put<JobOffer>(`${this.baseJobs}/${id}`, job, this.httpOptions).pipe(
            tap((updatedJob) => {
                const current = this.jobOffersSubject.value;
                const index = current.findIndex(j => j.id === id);
                if (index !== -1) {
                    current[index] = updatedJob;
                    this.jobOffersSubject.next([...current]);
                }
            }),
            catchError((error) => {
                console.error(`❌ [PUT] job-offers/${id} failed:`, error);
                throw error;
            })
        );
    }

    deleteJob(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseJobs}/${id}`, this.httpOptions).pipe(
            tap(() => {
                const current = this.jobOffersSubject.value;
                this.jobOffersSubject.next(current.filter(j => j.id !== id));
            }),
            catchError((error) => {
                console.error(`❌ [DELETE] job-offers/${id} failed:`, error);
                throw error;
            })
        );
    }
}
