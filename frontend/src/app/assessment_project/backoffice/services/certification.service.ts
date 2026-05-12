import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Certification } from '../models/certification.models';


@Injectable({
    providedIn: 'root'
})
export class CertificationService {

    private readonly baseUrl = `${'/kenwq-api'}/certifications`;

    private httpOptions = {
        headers: new HttpHeaders({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
    };

    constructor(private http: HttpClient) { }

    /**
     * 🔹 Récupérer toutes les certifications
     */
    getAll(): Observable<Certification[]> {
        return this.http.get<Certification[]>(this.baseUrl).pipe(
            tap(res => console.log('Certifications reçues:', res)),
            catchError(error => {
                console.error('Erreur GET certifications:', error);
                return of([]); // retourne tableau vide si erreur
            })
        );
    }

    /**
     * 🔹 Récupérer certification par ID
     */
    getById(id: number): Observable<Certification> {
        return this.http.get<Certification>(`${this.baseUrl}/${id}`).pipe(
            catchError(error => {
                console.error('Erreur GET certification by id:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * 🔹 Créer certification
     */
    create(data: Certification): Observable<Certification> {
        return this.http.post<Certification>(
            this.baseUrl,
            data,
            this.httpOptions
        ).pipe(
            tap(res => console.log('Certification créée:', res)),
            catchError(error => {
                console.error('Erreur création certification:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * 🔹 Modifier certification
     */
    update(id: number, data: Certification): Observable<Certification> {
        return this.http.put<Certification>(
            `${this.baseUrl}/${id}`,
            data,
            this.httpOptions
        ).pipe(
            catchError(error => {
                console.error('Erreur update certification:', error);
                return throwError(() => error);
            })
        );
    }

    /**
     * 🔹 Supprimer certification
     */
    delete(id: number): Observable<void> {
        return this.http.delete<void>(
            `${this.baseUrl}/${id}`,
            this.httpOptions
        ).pipe(
            catchError(error => {
                console.error('Erreur delete certification:', error);
                return throwError(() => error);
            })
        );
    }

    refreshData(): Observable<Certification[]> {
        return this.getAll();
    }
}
