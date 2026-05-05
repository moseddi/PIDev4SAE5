import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap, switchMap } from 'rxjs/operators';
import { Answer } from '../models/certification.models';


@Injectable({ providedIn: 'root' })
export class AnswerService {
    private readonly base = `${'/kenwq-api'}/answers`;
    private readonly headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    });

    private mockAnswers: Answer[] = [];
    private readonly STORAGE_KEY = 'mock_answers';

    constructor(private http: HttpClient) {
        this.loadFromStorage();
        if (this.mockAnswers.length === 0) {
            this.initializeMockAnswers();
        }
    }

    private loadFromStorage(): void {
        if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.mockAnswers = JSON.parse(stored);
                console.log('Loaded answers from storage:', this.mockAnswers.length);
            }
        } catch (error) {
            console.error('Error loading answers from storage:', error);
        }
    }

    private saveToStorage(): void {
        if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.mockAnswers));
        } catch (error) {
            console.error('Error saving answers to storage:', error);
        }
    }

    private initializeMockAnswers(): void {
        this.mockAnswers = [
            { id: 1, questionId: 1, content: 'My name is John', correct: true },
            { id: 2, questionId: 1, content: 'I am 25 years old', correct: false },
            { id: 3, questionId: 1, content: 'I live in Paris', correct: false },
            { id: 4, questionId: 1, content: 'I am a student', correct: false },
            { id: 5, questionId: 2, content: 'I am from France', correct: true },
            { id: 6, questionId: 2, content: 'I am from Spain', correct: false },
            { id: 7, questionId: 2, content: 'I am from Italy', correct: false },
            { id: 8, questionId: 2, content: 'I am from Germany', correct: false }
        ];
        this.saveToStorage();
    }

    getAll(): Observable<Answer[]> {
        console.log('=== GET ALL ANSWERS START ===');
        return this.http.get<Answer[]>(this.base).pipe(
            tap(answers => {
                console.log('✅ Answers from API:', answers?.length || 0);
                if (answers && answers.length > 0) {
                    const backendIds = new Set(answers.map(a => a.id));
                    const localOnly = this.mockAnswers.filter(a => a.id && !backendIds.has(a.id));
                    this.mockAnswers = [...answers, ...localOnly];
                    this.saveToStorage();
                    console.log('✅ Answers merged (total:', this.mockAnswers.length, ')');
                }
            }),
            catchError(() => {
                console.warn('❌ Backend answers API failed, using mock data');
                return of(this.mockAnswers);
            })
        );
    }

    private getQuestionId(a: any): number | undefined {
        if (!a) return undefined;
        const id = a.questionId ?? (a as any).question_id ?? (a.question && typeof a.question === 'object' ? a.question.id : a.question);
        return id != null ? Number(id) : undefined;
    }

    getByQuestion(questionId: number | string): Observable<Answer[]> {
        const idToFind = Number(questionId);

        return this.http.get<Answer[]>(`${this.base}/question/${idToFind}`).pipe(
            tap(answers => {
                if (answers && answers.length > 0) {
                    this.mergeAnswersIntoCache(answers, idToFind);
                }
            }),
            switchMap(answers => {
                if (answers && answers.length > 0) return of(answers);
                // Vide → cache local
                return this.answerFromCache(idToFind);
            }),
            catchError(err => {
                console.warn(`[AnswerService] /answers/question/${idToFind} → ${err.status ?? 'ERR'}, tentative alternatives...`);

                // Variantes d'URL connues spring boot
                const alternatives = [
                    `${this.base}/byQuestion/${idToFind}`,
                    `${this.base}?questionId=${idToFind}`,
                    `${this.base}/reponses/question/${idToFind}`,
                ];

                const tryNext = (urls: string[]): Observable<Answer[]> => {
                    if (urls.length === 0) {
                        // Dernier recours: getAll() + filtre
                        console.warn(`[AnswerService] Toutes les URL alternatives ont échoué. Tentative getAll()...`);
                        return this.getAll().pipe(
                            switchMap(all => {
                                // Préserver questionId depuis mockAnswers si le serveur ne le retourne pas
                                const withQId = all.map(a => ({
                                    ...a,
                                    questionId: this.getQuestionId(a) ?? (a as any).questionId
                                }));
                                const found = withQId.filter(a => this.getQuestionId(a) === idToFind);
                                console.log(`[AnswerService] getAll() → ${found.length} réponse(s) pour question ${idToFind} sur ${all.length} total.`);
                                if (found.length > 0) return of(found);
                                return this.answerFromCache(idToFind);
                            }),
                            catchError(() => this.answerFromCache(idToFind))
                        );
                    }
                    const [url, ...rest] = urls;
                    return this.http.get<Answer[]>(url).pipe(
                        switchMap(as => {
                            if (as && as.length > 0) {
                                console.log(`[AnswerService] ${as.length} réponses via ${url}`);
                                this.mergeAnswersIntoCache(as, idToFind);
                                return of(as);
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

    private answerFromCache(idToFind: number): Observable<Answer[]> {
        const filtered = this.mockAnswers.filter(a => this.getQuestionId(a) === idToFind);
        if (filtered.length > 0) {
            console.log(`[AnswerService] Cache local: ${filtered.length} réponse(s) pour question ${idToFind}`);
            return of(filtered);
        }
        // Aucune réponse réelle trouvée — retourner liste vide (PAS de réponses auto-générées)
        console.warn(`[AnswerService] Aucune réponse trouvée pour la question ${idToFind}.`);
        const ids = [...new Set(this.mockAnswers.map(a => this.getQuestionId(a)).filter(id => id !== undefined))];
        console.log(`[AnswerService] QuestionIDs avec réponses en cache: [${ids.join(', ')}]`);
        return of([]);
    }

    private mergeAnswersIntoCache(incoming: Answer[], questionId: number): void {
        const others = this.mockAnswers.filter(a => this.getQuestionId(a) !== questionId);
        const withQId = incoming.map(a => ({
            ...a,
            questionId: this.getQuestionId(a) ?? questionId
        }));
        this.mockAnswers = [...others, ...withQId];
        this.saveToStorage();
    }

    getById(id: number): Observable<Answer> {
        return this.http.get<Answer>(`${this.base}/${id}`).pipe(
            catchError(() => {
                const answer = this.mockAnswers.find(a => a.id === id);
                return answer ? of(answer) : of(this.getMockAnswer());
            })
        );
    }

    createForQuestion(questionId: number, data: { content: string; correct: boolean }): Observable<Answer> {
        return this.http.post<Answer>(`${this.base}/question/${questionId}`, data, { headers: this.headers }).pipe(
            tap((newAnswer) => {
                this.mockAnswers.push({ ...newAnswer, questionId });
                this.saveToStorage();
            }),
            catchError(() => {
                const mockAnswer: Answer = {
                    id: Math.max(...this.mockAnswers.map(a => a.id || 0), 0) + 1,
                    content: data.content,
                    correct: data.correct,
                    questionId
                };
                this.mockAnswers.push(mockAnswer);
                this.saveToStorage();
                return of(mockAnswer);
            })
        );
    }

    create(data: Answer): Observable<Answer> {
        return this.http.post<Answer>(this.base, data, { headers: this.headers }).pipe(
            tap((newAnswer) => {
                this.mockAnswers.push(newAnswer);
                this.saveToStorage();
            }),
            catchError(() => {
                const mockAnswer: Answer = {
                    ...data,
                    id: Math.max(...this.mockAnswers.map(a => a.id || 0), 0) + 1
                };
                this.mockAnswers.push(mockAnswer);
                this.saveToStorage();
                return of(mockAnswer);
            })
        );
    }

    update(id: number, data: Answer): Observable<Answer> {
        return this.http.put<Answer>(`${this.base}/${id}`, data, { headers: this.headers }).pipe(
            tap(() => {
                const idx = this.mockAnswers.findIndex(a => a.id === id);
                if (idx !== -1) {
                    this.mockAnswers[idx] = { ...data, id };
                    this.saveToStorage();
                }
            }),
            catchError(() => {
                const idx = this.mockAnswers.findIndex(a => a.id === id);
                if (idx !== -1) {
                    this.mockAnswers[idx] = { ...data, id };
                    this.saveToStorage();
                }
                return of({ ...data, id });
            })
        );
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.base}/${id}`).pipe(
            tap(() => {
                this.mockAnswers = this.mockAnswers.filter(a => a.id !== id);
                this.saveToStorage();
            }),
            catchError(() => {
                this.mockAnswers = this.mockAnswers.filter(a => a.id !== id);
                this.saveToStorage();
                return of(void 0);
            })
        );
    }

    private getMockAnswer(): Answer {
        return {
            id: 0,
            questionId: 1,
            content: 'Answer par défaut',
            correct: false
        };
    }
}
