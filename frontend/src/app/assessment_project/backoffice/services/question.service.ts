import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';
import { Question, QuestionType } from '../models/certification.models';


@Injectable({ providedIn: 'root' })
export class QuestionService {
    private readonly base = `${'/kenwq-api'}/questions`;
    private readonly httpOptions = {
        headers: new HttpHeaders({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
    };

    // Stockage local pour les questions créées en mode mock
    private mockQuestions: Question[] = [];
    private questionsSubject = new BehaviorSubject<Question[]>([]);
    questions$ = this.questionsSubject.asObservable();
    private readonly STORAGE_KEY = 'mock_questions';

    constructor(private http: HttpClient) {
        console.log('QuestionService constructor called');
        this.loadFromStorage();
        if (this.mockQuestions.length === 0) {
            this.initializeMockQuestions();
        }
    }

    private loadFromStorage(): void {
        if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.mockQuestions = JSON.parse(stored);
                console.log('Loaded questions from storage:', this.mockQuestions.length);
                this.questionsSubject.next(this.mockQuestions);
            }
        } catch (error) {
            console.error('Error loading from storage:', error);
        }
    }

    private saveToStorage(): void {
        if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.mockQuestions));
            console.log('Saved questions to storage:', this.mockQuestions.length);
        } catch (error) {
            console.error('Error saving to storage:', error);
        }
    }

    private initializeMockQuestions(): void {
        console.log('Initializing (empty) mock questions storage...');
        this.mockQuestions = []; // On ne met plus de données par défaut pour éviter la confusion
        this.questionsSubject.next(this.mockQuestions);
        this.saveToStorage();
    }

    getAll(): Observable<Question[]> {
        console.log('=== GET ALL QUESTIONS START ===');
        return this.http.get<Question[]>(this.base, this.httpOptions).pipe(
            tap((questions) => {
                console.log('✅ Questions from API:', questions?.length || 0);
                if (questions && questions.length > 0) {
                    const backendIds = new Set(questions.map(q => q.id));
                    const localOnly = this.mockQuestions.filter(q => q.id && !backendIds.has(q.id));
                    this.mockQuestions = [...questions, ...localOnly];
                    this.questionsSubject.next(this.mockQuestions);
                    this.saveToStorage();
                    console.log('✅ Questions merged (total:', this.mockQuestions.length, ')');
                } else {
                    this.questionsSubject.next(this.mockQuestions);
                }
            }),
            catchError((error) => {
                console.warn('❌ Backend API failed, using local storage:', error);
                this.questionsSubject.next(this.mockQuestions);
                return this.questionsSubject.asObservable();
            })
        );
    }

    private getExamId(q: any): number | undefined {
        if (!q) return undefined;
        const id = q.examId ?? q.exam_id ?? (q as any).examenId ?? (q.exam && typeof q.exam === 'object' ? q.exam.id : q.exam);
        return id != null ? Number(id) : undefined;
    }

    getByExam(examId: number | string): Observable<Question[]> {
        const idToFind = Number(examId);
        console.log(`[QuestionService] Recherche questions pour examId: ${idToFind}`);

        // Essayer /exam/{id} en premier
        return this.http.get<Question[]>(`${this.base}/exam/${idToFind}`, this.httpOptions).pipe(
            tap(questions => {
                if (questions && questions.length > 0) {
                    this.mergeQuestionsIntoCache(questions, idToFind);
                }
            }),
            switchMap(questions => {
                if (questions && questions.length > 0) {
                    console.log(`[QuestionService] ${questions.length} questions reçues via /exam/${idToFind}`);
                    return of(questions);
                }
                // Vide → tenter le cache local
                return this.fallbackFromCache(idToFind);
            }),
            catchError(err => {
                console.warn(`[QuestionService] /exam/${idToFind} → ${err.status ?? 'ERR'}, tentative alternatives...`);

                // Essayer d'autres variantes d'URL connues
                const alternatives = [
                    `${this.base}/examen/${idToFind}`,
                    `${this.base}?examId=${idToFind}`,
                    `${this.base}?exam_id=${idToFind}`
                ];

                const tryNext = (urls: string[]): Observable<Question[]> => {
                    if (urls.length === 0) {
                        // Toutes les URL ont échoué → fallback sur getAll() + filtre
                        console.warn(`[QuestionService] Toutes les URL alternatives ont échoué. Tentative getAll()...`);
                        return this.getAll().pipe(
                            switchMap(all => {
                                const found = all.filter(q => this.getExamId(q) === idToFind);
                                console.log(`[QuestionService] getAll() → ${found.length} question(s) pour exam ${idToFind}.`);
                                if (found.length > 0) return of(found);
                                return this.fallbackFromCache(idToFind);
                            }),
                            catchError(() => this.fallbackFromCache(idToFind))
                        );
                    }
                    const [url, ...rest] = urls;
                    return this.http.get<Question[]>(url, this.httpOptions).pipe(
                        switchMap(qs => {
                            if (qs && qs.length > 0) {
                                console.log(`[QuestionService] ${qs.length} questions via ${url}`);
                                this.mergeQuestionsIntoCache(qs, idToFind);
                                return of(qs);
                            }
                            return tryNext(rest);
                        }),
                        catchError(() => tryNext(rest))
                    );
                };

                return tryNext(alternatives);
            })
        );
    }

    private fallbackFromCache(idToFind: number): Observable<Question[]> {
        const filtered = this.mockQuestions.filter(q => this.getExamId(q) === idToFind);
        if (filtered.length > 0) {
            console.log(`[QuestionService] Cache local: ${filtered.length} question(s) pour exam ${idToFind}`);
        } else {
            console.warn(`[QuestionService] AUCUNE QUESTION en cache pour exam ${idToFind}.`);
            const ids = [...new Set(this.mockQuestions.map(q => this.getExamId(q)).filter(id => id !== undefined))];
            console.log(`[QuestionService] ExamIDs disponibles dans le cache: [${ids.join(', ')}]`);
        }
        return of(filtered);
    }

    private mergeQuestionsIntoCache(incoming: Question[], examId: number): void {
        const otherQuestions = this.mockQuestions.filter(q => this.getExamId(q) !== examId);
        // Préserver examId si le serveur ne le retourne pas
        const withExamId = incoming.map(q => ({
            ...q,
            examId: this.getExamId(q) ?? examId
        }));
        this.mockQuestions = [...otherQuestions, ...withExamId];
        this.questionsSubject.next(this.mockQuestions);
        this.saveToStorage();
    }

    getById(id: number): Observable<Question> {
        return this.http.get<Question>(`${this.base}/${id}`, this.httpOptions).pipe(
            catchError(() => {
                console.warn('Backend question by ID failed, using mock data');
                const question = this.mockQuestions.find(q => q.id === id);
                return question ? of(question) : of(this.getMockQuestion());
            })
        );
    }

    create(data: any): Observable<Question> {
        console.log('=== CREATE QUESTION START ===');
        console.log('Input data:', data);

        try {
            const exam_id = Number(data.examId ?? data.exam_id ?? data.exam?.id ?? 0);
            console.log('Parsed exam_id:', exam_id);

            if (!exam_id) {
                console.error('❌ Validation failed: exam_id is required');
                return throwError(() => ({ error: { message: 'Examen requis.' } }));
            }

            const content = (data.content ?? '').trim();
            console.log('Content:', content);

            const type = data.type ?? 'MULTIPLE_CHOICE';
            console.log('Type:', type);

            const payload = {
                content: content,
                type: type,
                examId: exam_id,
                exam_id: exam_id
            };

            const headers = new HttpHeaders()
                .set('Content-Type', 'application/json')
                .set('Accept', 'application/json');

            // Essayer d'abord l'API backend
            console.log('🌐 Attempting to create question via backend API...');
            console.log('📤 Request URL:', this.base);
            console.log('📤 Request Headers:', headers);
            console.log('📤 Request Payload:', payload);

            return this.http.post<Question>(this.base, payload, { headers }).pipe(
                tap((newQuestion) => {
                    console.log('✅ Backend API Response:', newQuestion);
                    console.log('✅ Question created successfully via backend API:', newQuestion);
                    // Ajouter la question au stockage local pour la persistance
                    this.mockQuestions.push(newQuestion);
                    this.questionsSubject.next(this.mockQuestions);
                    this.saveToStorage();
                    console.log('Question also saved to local storage');
                    console.log('=== CREATE QUESTION SUCCESS ===');
                }),
                catchError((error) => {
                    console.error('❌ Backend API Error Details:');
                    console.error('- Status:', error.status);
                    console.error('- Status Text:', error.statusText);
                    console.error('- URL:', error.url);
                    console.error('- Error Message:', error.message);
                    console.error('- Error Response:', error.error);
                    console.error('- Full Error:', error);

                    // Détecter spécifiquement les problèmes CORS
                    if (error.status === 0 || error.status === 403) {
                        console.warn('🚨 CORS or Network Error detected - using mock mode immediately');
                    } else if (error.status === 400) {
                        console.warn('🚨 Bad Request - Le format des données est incorrect');
                        console.warn('📄 Response body:', JSON.stringify(error.error, null, 2));
                    } else {
                        console.warn('❌ Backend API failed, falling back to mock mode:', error);
                    }
                    console.log('🔄 Using mock mode as fallback');

                    // Fallback: créer mock question
                    const mockQuestion: Question = {
                        id: Math.max(...this.mockQuestions.map(q => q.id || 0), 0) + 1,
                        examId: exam_id,
                        content: content,
                        type: type as QuestionType,
                        exam: undefined
                    };

                    // Ajouter la question mock au stockage local
                    this.mockQuestions.push(mockQuestion);
                    this.questionsSubject.next(this.mockQuestions);
                    this.saveToStorage();

                    console.log('📝 Mock question created and saved:', mockQuestion);
                    console.log('📊 Total questions in storage:', this.mockQuestions.length);
                    console.log('=== CREATE QUESTION FALLBACK SUCCESS ===');

                    return of(mockQuestion);
                })
            );

        } catch (error) {
            console.error('❌ Error in create method:', error);
            console.log('=== CREATE QUESTION ERROR ===');
            return throwError(() => ({ error: { message: 'Erreur lors de la création.' } }));
        }
    }

    update(id: number, data: any): Observable<Question> {
        const exam_id = Number(data.examId ?? data.exam_id ?? data.exam?.id ?? 0);
        if (!exam_id) {
            console.warn('Question update failed: exam required');
            return throwError(() => ({ error: { message: 'Examen requis.' } }));
        }
        const content = (data.content ?? '').trim();
        const type = data.type ?? 'MULTIPLE_CHOICE';

        const payload = {
            content,
            type,
            exam: { id: exam_id },
            exam_id,
            examenId: exam_id,
        };

        const headers = new HttpHeaders()
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json');

        // Essayer d'abord l'API backend
        console.log('Attempting to update question via backend API...');
        return this.http.put<Question>(`${this.base}/${id}`, payload, { headers }).pipe(
            tap(() => {
                console.log('✅ Question updated successfully via backend API');
                // Mettre à jour la question dans le stockage local
                const index = this.mockQuestions.findIndex(q => q.id === id);
                if (index !== -1) {
                    this.mockQuestions[index] = {
                        ...this.mockQuestions[index],
                        examId: exam_id,
                        content: content,
                        type: type as QuestionType
                    };
                    this.questionsSubject.next(this.mockQuestions);
                    this.saveToStorage();
                    console.log('Question also updated in local storage');
                }
            }),
            catchError((error) => {
                console.warn('❌ Backend API failed, falling back to mock mode:', error);
                console.log('🔄 Using mock mode as fallback');

                // Fallback: return updated mock data
                const updatedQuestion: Question = {
                    id: id,
                    examId: exam_id,
                    content: content,
                    type: type as QuestionType,
                    exam: undefined
                };

                // Mettre à jour la question dans le stockage local
                const index = this.mockQuestions.findIndex(q => q.id === id);
                if (index !== -1) {
                    this.mockQuestions[index] = updatedQuestion;
                    this.questionsSubject.next(this.mockQuestions);
                    this.saveToStorage();
                    console.log('📝 Mock question updated and saved:', updatedQuestion);
                }

                return of(updatedQuestion);
            })
        );
    }

    delete(id: number): Observable<void> {
        // Essayer d'abord l'API backend
        console.log('Attempting to delete question via backend API...');
        return this.http.delete<void>(`${this.base}/${id}`, this.httpOptions).pipe(
            tap(() => {
                console.log('✅ Question deleted successfully via backend API');
                // Supprimer la question du stockage local
                this.mockQuestions = this.mockQuestions.filter(q => q.id !== id);
                this.questionsSubject.next(this.mockQuestions);
                this.saveToStorage();
                console.log('Question also deleted from local storage');
            }),
            catchError((error) => {
                console.warn('❌ Backend API failed, falling back to mock mode:', error);
                console.log('🔄 Using mock mode as fallback');

                // Fallback: supprimer du stockage local
                this.mockQuestions = this.mockQuestions.filter(q => q.id !== id);
                this.questionsSubject.next(this.mockQuestions);
                this.saveToStorage();
                console.log('📝 Mock question deleted from storage');
                console.log('📊 Total questions remaining:', this.mockQuestions.length);

                return of(void 0);
            })
        );
    }

    // Méthode pour forcer la synchronisation (pour débogage)
    forceRefresh(): void {
        console.log('Force refresh called, current questions:', this.mockQuestions.length);
        this.questionsSubject.next([...this.mockQuestions]);
    }

    // Méthode pour obtenir l'état actuel (pour débogage)
    getCurrentState(): Question[] {
        console.log('Current state requested:', this.mockQuestions.length, 'questions');
        return [...this.mockQuestions];
    }

    // Mock data methods
    private getMockQuestions(): Observable<Question[]> {
        return of(this.mockQuestions);
    }

    private getMockQuestionsByExam(examId: number): Observable<Question[]> {
        const filteredQuestions = this.mockQuestions.filter(q => q.examId === examId);
        return of(filteredQuestions);
    }

    private getMockQuestion(): Question {
        return {
            id: 0,
            examId: 1,
            content: 'Question par défaut',
            type: QuestionType.MULTIPLE_CHOICE,
            exam: undefined
        };
    }
}
