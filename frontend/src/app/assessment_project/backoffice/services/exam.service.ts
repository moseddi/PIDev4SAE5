import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap, switchMap, map } from 'rxjs/operators';
import type { CertificationExam } from '../models/certification.models';


@Injectable({
    providedIn: 'root'
})
export class ExamService {
    private readonly baseUrl = `${'/kenwq-api'}/certification-exams`;
    private readonly CACHE_KEY = 'cached_exams';

    private examsSubject = new BehaviorSubject<CertificationExam[]>(this.loadCache());
    exams$ = this.examsSubject.asObservable();

    private httpOptions = {
        headers: new HttpHeaders({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
    };

    constructor(private http: HttpClient) {
        // Émettre immédiatement les données en cache au démarrage
        const cached = this.loadCache();
        if (cached.length > 0) {
            console.log(`[ExamService] ${cached.length} examens chargés depuis le cache local.`);
            this.examsSubject.next(cached);
        }
    }

    // ─── Cache localStorage ───────────────────────────────────────────────────

    private loadCache(): CertificationExam[] {
        try {
            const raw = localStorage.getItem(this.CACHE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch { return []; }
    }

    private saveCache(exams: CertificationExam[]): void {
        try {
            localStorage.setItem(this.CACHE_KEY, JSON.stringify(exams));
        } catch { /* quota exceeded, ignore */ }
    }

    private mergeIntoCache(incoming: CertificationExam[]): CertificationExam[] {
        const current = this.loadCache();
        const map = new Map<number, CertificationExam>();
        // Partir du cache existant
        current.forEach(e => { if (e.id) map.set(e.id, e); });
        // Fusionner avec les nouvelles données (le serveur a priorité, on préserve certificationId)
        incoming.forEach(e => {
            if (!e.id) return;
            const existing = map.get(e.id);
            // Si le serveur renvoie sans certificationId, on garde celui du cache
            const certId = this.getCertId(e) ?? (existing ? this.getCertId(existing) : undefined);
            map.set(e.id, { ...existing, ...e, certificationId: certId });
        });
        const merged = Array.from(map.values());
        this.saveCache(merged);
        return merged;
    }

    // ─── API Methods ──────────────────────────────────────────────────────────

    /**
     * 🔹 Récupérer tous les examens
     */
    getAll(): Observable<CertificationExam[]> {
        return this.http.get<CertificationExam[]>(this.baseUrl).pipe(
            tap(exams => {
                const merged = this.mergeIntoCache(exams);
                this.examsSubject.next(merged);
                console.log(`[ExamService] ${exams.length} examens reçus du serveur, ${merged.length} en cache total.`);
            }),
            map(exams => this.mergeIntoCache(exams)),
            catchError(error => {
                console.warn(`[ExamService] Serveur inaccessible (${error?.status ?? 'ECONNREFUSED'}), utilisation du cache local.`);
                const cached = this.loadCache();
                this.examsSubject.next(cached);
                return of(cached);
            })
        );
    }

    /**
     * 🔹 Récupérer examens par certification
     * Fallback: si l'endpoint retourne vide/404, cherche dans le cache local.
     */
    getByCertification(certId: number): Observable<CertificationExam[]> {
        console.log(`[ExamService] Recherche examens pour certification: ${certId}`);

        return this.http
            .get<CertificationExam[]>(`${this.baseUrl}/certification/${certId}`)
            .pipe(
                tap(res => console.log(`[ExamService] Réponse API getByCertification:`, res)),
                switchMap(exams => {
                    if (exams && exams.length > 0) {
                        this.mergeIntoCache(exams);
                        return of(exams);
                    }
                    // API retourne vide → fallback cache
                    console.warn(`[ExamService] API retourne 0 examens pour cert ${certId}, tentative via cache…`);
                    return this.getAll().pipe(
                        map(all => {
                            const found = this.filterByCertId(all, certId);
                            console.log(`[ExamService] Cache: ${found.length} examen(s) trouvé(s) pour cert ${certId}.`);
                            return found;
                        })
                    );
                }),
                catchError(error => {
                    console.warn(`[ExamService] Erreur API getByCertification (${error?.status ?? 'ECONNREFUSED'}), fallback cache…`);
                    const cached = this.loadCache();
                    const found = this.filterByCertId(cached, certId);
                    console.log(`[ExamService] Cache local: ${found.length} examen(s) sur ${cached.length} total pour cert ${certId}.`);
                    if (found.length === 0) {
                        const ids = [...new Set(cached.map(e => this.getCertId(e)).filter(id => id !== undefined))];
                        console.warn(`[ExamService] IDs disponibles dans le cache: [${ids.join(', ')}]`);
                    }
                    return of(found);
                })
            );
    }

    /**
     * 🔹 Récupérer examen par ID
     */
    getById(id: number): Observable<CertificationExam> {
        return this.http
            .get<CertificationExam>(`${this.baseUrl}/${id}`)
            .pipe(
                catchError(error => {
                    console.warn(`[ExamService] Erreur GET exam by ID ${id}, fallback cache.`);
                    const cached = this.loadCache().find(e => e.id === id);
                    return cached ? of(cached) : of({} as CertificationExam);
                })
            );
    }

    /**
     * 🔹 Créer examen
     */
    create(data: CertificationExam): Observable<CertificationExam> {
        const certId = this.getCertId(data) ?? 0;
        return this.http
            .post<CertificationExam>(this.baseUrl, data, this.httpOptions)
            .pipe(
                tap(res => {
                    console.log('[ExamService] Exam créé:', res);
                    // Préserver certificationId si le serveur ne le retourne pas
                    const toCache = { ...res, certificationId: this.getCertId(res) ?? certId };
                    const merged = this.mergeIntoCache([toCache]);
                    this.examsSubject.next(merged);
                }),
                catchError(error => {
                    console.error('[ExamService] Erreur création exam:', error);
                    return throwError(() => error);
                })
            );
    }

    /**
     * 🔹 Modifier examen
     */
    update(id: number, data: CertificationExam): Observable<CertificationExam> {
        return this.http
            .put<CertificationExam>(`${this.baseUrl}/${id}`, data, this.httpOptions)
            .pipe(
                tap(res => {
                    const certId = this.getCertId(res) ?? this.getCertId(data);
                    const toCache = { ...res, certificationId: certId };
                    this.mergeIntoCache([toCache]);
                }),
                catchError(error => {
                    console.error('[ExamService] Erreur update exam:', error);
                    return throwError(() => error);
                })
            );
    }

    /**
     * 🔹 Supprimer examen
     */
    delete(id: number): Observable<void> {
        return this.http
            .delete<void>(`${this.baseUrl}/${id}`)
            .pipe(
                tap(() => {
                    const updated = this.loadCache().filter(e => e.id !== id);
                    this.saveCache(updated);
                    this.examsSubject.next(updated);
                }),
                catchError(error => {
                    console.error('[ExamService] Erreur delete exam:', error);
                    return throwError(() => error);
                })
            );
    }

    refreshData(): Observable<CertificationExam[]> {
        return this.getAll();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /** Extrait l'ID de certification peu importe le nom du champ */
    private getCertId(e: any): number | undefined {
        if (!e) return undefined;
        const id = e.certificationId
            ?? e.certification_id
            ?? (e.certification && typeof e.certification === 'object' ? e.certification.id : e.certification)
            ?? (e as any).certId;
        return id != null ? Number(id) : undefined;
    }

    private filterByCertId(exams: CertificationExam[], certId: number): CertificationExam[] {
        const idToFind = Number(certId);
        return exams.filter(e => this.getCertId(e) === idToFind);
    }
}
