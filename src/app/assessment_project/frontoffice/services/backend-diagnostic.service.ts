import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { firstValueFrom } from 'rxjs';

export interface DiagnosticResult {
    endpoint: string;
    status: 'success' | 'error' | 'warning';
    message: string;
    details?: any;
}

@Injectable({ providedIn: 'root' })
export class BackendDiagnosticService {
    private readonly certificationApiUrl = '/kenwq-api';
    private readonly quizApiUrl = '/quiz-api';

    constructor(private http: HttpClient) { }

    async runFullDiagnostic(): Promise<DiagnosticResult[]> {
        const results: DiagnosticResult[] = [];

        // Certifications (8089)
        results.push(await this.testEndpoint(this.certificationApiUrl, '/certifications', 'GET Certifications 📚'));
        results.push(await this.testEndpoint(this.certificationApiUrl, '/questions', 'GET Questions (Certif) ❓'));

        // Quizzes (8085)
        results.push(await this.testEndpoint(this.quizApiUrl, '/quizzes', 'GET Quizzes 🎮'));
        results.push(await this.testEndpoint(this.quizApiUrl, '/questions', 'GET Quiz Questions ❓'));
        results.push(await this.testEndpoint(this.quizApiUrl, '/answers', 'GET Quiz Answers 💡'));
        results.push(await this.testEndpoint(this.quizApiUrl, '/quiz-questions', 'GET QuizQuestions (Legacy) ⚠️'));

        return results;
    }

    async testConnection(): Promise<DiagnosticResult> {
        return this.testEndpoint(this.certificationApiUrl, '/certifications', 'Connexion Backend');
    }

    async checkCORS(): Promise<DiagnosticResult> {
        try {
            await firstValueFrom(this.http.options<any>(`${this.certificationApiUrl}/certifications`));
            return {
                endpoint: 'CORS',
                status: 'success',
                message: 'CORS configuré correctement',
            };
        } catch (err: any) {
            return {
                endpoint: 'CORS',
                status: err?.status === 0 ? 'error' : 'warning',
                message: err?.status === 0
                    ? 'Problème CORS détecté — le serveur refuse les requêtes cross-origin'
                    : `Réponse inattendue (HTTP ${err?.status})`,
                details: err
            };
        }
    }

    private async testEndpoint(baseUrl: string, path: string, label: string): Promise<DiagnosticResult> {
        try {
            const data = await firstValueFrom(
                this.http.get<any[]>(`${baseUrl}${path}`)
            );
            return {
                endpoint: label,
                status: 'success',
                message: `✅ ${label} accessible — ${Array.isArray(data) ? data.length : '?'} entrée(s)`,
                details: Array.isArray(data) ? { count: data.length } : data
            };
        } catch (err: any) {
            const isNotFound = err?.status === 404;
            const isCors = err?.status === 0;
            return {
                endpoint: label,
                status: 'error',
                message: isCors
                    ? `❌ Erreur réseau / CORS sur ${label}`
                    : isNotFound
                        ? `⚠️ Route introuvable (404) : ${baseUrl}${path}`
                        : `❌ Erreur HTTP ${err?.status} sur ${label}`,
                details: err
            };
        }
    }
}
