import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Certificate } from '../models/certification.models';


@Injectable({ providedIn: 'root' })
export class CertificateService {
    private readonly base = `${'/kenwq-api'}/certificates`;

    constructor(private http: HttpClient) {}

    create(data: Partial<Certificate>): Observable<Certificate> {
        return this.http.post<Certificate>(this.base, data).pipe(
            catchError(() => of(data as Certificate))
        );
    }

    getByUserId(userId: number): Observable<Certificate[]> {
        return this.http.get<Certificate[]>(`${this.base}/user/${userId}`).pipe(
            catchError(() => of([]))
        );
    }
}
