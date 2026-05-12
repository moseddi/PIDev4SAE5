import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CertificationResult } from '../models/certification.models';


@Injectable({ providedIn: 'root' })
export class ResultService {
    private readonly base = `${'/kenwq-api'}/certification-results`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<CertificationResult[]> {
        return this.http.get<CertificationResult[]>(this.base);
    }

    getByUser(userId: number): Observable<CertificationResult[]> {
        return this.http.get<CertificationResult[]>(`${this.base}/user/${userId}`);
    }

    getByCertification(certificationId: number): Observable<CertificationResult[]> {
        return this.http.get<CertificationResult[]>(`${this.base}/certification/${certificationId}`);
    }

    create(data: CertificationResult): Observable<CertificationResult> {
        return this.http.post<CertificationResult>(this.base, data);
    }

    getById(id: number): Observable<CertificationResult> {
        return this.http.get<CertificationResult>(`${this.base}/${id}`);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.base}/${id}`);
    }
}
