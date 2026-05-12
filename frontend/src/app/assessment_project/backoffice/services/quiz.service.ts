import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, BehaviorSubject, forkJoin } from 'rxjs';
import { catchError, tap, map, switchMap } from 'rxjs/operators';
import { Quiz, QuizQuestion } from '../models/quiz.models';

@Injectable({ providedIn: 'root' })
export class QuizService {
    // ✅ Via proxy Angular (évite CORS)
    private readonly quizzesUrl = '/quiz-api/quizzes';
    private readonly questionsUrl = '/quiz-api/quiz-questions';
    private readonly answersUrl = '/quiz-api/answers';

    private readonly headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    });

    private mockQuizzes: Quiz[] = [];
    private quizzesSubject = new BehaviorSubject<Quiz[]>([]);
    quizzes$ = this.quizzesSubject.asObservable();
    private readonly STORAGE_KEY = 'mock_quizzes';

    constructor(private http: HttpClient) {
        this.loadFromStorage();
    }

    // ─── Cache localStorage ────────────────────────────────────────────────────

    private loadFromStorage(): void {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.mockQuizzes = JSON.parse(stored);
                this.quizzesSubject.next(this.mockQuizzes);
            }
        } catch { }
    }

    private saveToStorage(): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.mockQuizzes));
        } catch { }
    }

    // ─── Quiz CRUD ─────────────────────────────────────────────────────────────

    /**
     * Charge tous les quizzes.
     * GET /quizzes retourne déjà chaque quiz avec ses questions+réponses via @JsonManagedReference.
     */
    getAllQuizzes(): Observable<Quiz[]> {
        console.log(`[QuizService] Chargement de tous les quizzes depuis ${this.quizzesUrl}`);
        return this.http.get<Quiz[]>(this.quizzesUrl).pipe(
            tap(quizzes => {
                quizzes.forEach(q => {
                    q.questions?.forEach(question => {
                        if (question.options && (!question.answers || question.answers.length === 0)) {
                            try {
                                question.answers = JSON.parse(question.options);
                            } catch (e) {
                                console.warn('Could not parse options for question', question.id, e);
                            }
                        }
                    });
                });
                this.mockQuizzes = quizzes;
                this.quizzesSubject.next(quizzes);
                this.saveToStorage();
                console.log(`[QuizService] ✨ ${quizzes.length} quiz(zes) chargé(s).`);
            }),
            catchError(err => {
                console.warn('[QuizService] Erreur backend, utilisation du cache local:', err.status ?? err.message);
                this.quizzesSubject.next(this.mockQuizzes);
                return of(this.mockQuizzes);
            })
        );
    }

    /**
     * Charge les questions d'un quiz avec leurs réponses
     * Tente plusieurs routes possibles (REST standard vs Custom)
     */
    loadQuestionsForQuiz(quizId: number): Observable<QuizQuestion[]> {
        const paths = [
            `${this.questionsUrl}/quiz/${quizId}`,
            `${this.questionsUrl}?quizId=${quizId}`,
            `${this.quizzesUrl}/${quizId}/questions`,
            `${this.questionsUrl}/search/findByQuizId?quizId=${quizId}`,
            `${this.questionsUrl}/search/findByQuiz_Id?quizId=${quizId}`,
            `/quiz-api/api/questions/quiz/${quizId}`,
            `/quiz-api/api/questions?quizId=${quizId}`
        ];

        const tryGetQuestions = (index: number): Observable<QuizQuestion[]> => {
            if (index >= paths.length) {
                // LAST RESORT: Get ALL questions and filter manually (can be heavy but works)
                return this.http.get<QuizQuestion[]>(this.questionsUrl).pipe(
                    map(all => all.filter(q => Number(q.quizId) === Number(quizId) || (q.quiz && q.quiz.id === quizId))),
                    catchError(() => of([]))
                );
            }

            return this.http.get<QuizQuestion[]>(paths[index]).pipe(
                switchMap(questions => {
                    if (!questions || questions.length === 0) return tryGetQuestions(index + 1);

                    const requests = questions.map(q => {
                        const qId = q.id;
                        const answerPaths = [
                            `${this.answersUrl}/question/${qId}`,
                            `${this.answersUrl}?questionId=${qId}`,
                            `${this.questionsUrl}/${qId}/answers`,
                            `${this.answersUrl}/search/findByQuestionId?questionId=${qId}`
                        ];

                        const tryGetAnswers = (aIndex: number): Observable<any[]> => {
                            if (aIndex >= answerPaths.length) {
                                // Fallback: Get all answers and filter manually
                                return this.http.get<any[]>(this.answersUrl).pipe(
                                    map(all => all.filter(a => Number(a.questionId) === Number(qId) || (a.question && a.question.id === qId))),
                                    catchError(() => of([]))
                                );
                            }
                            return this.http.get<any[]>(answerPaths[aIndex]).pipe(
                                switchMap(ans => (ans && ans.length > 0) ? of(ans) : tryGetAnswers(aIndex + 1)),
                                catchError(() => tryGetAnswers(aIndex + 1))
                            );
                        };

                        return tryGetAnswers(0).pipe(
                            map(answers => ({ ...q, quizId, answers: (answers.length > 0 ? answers : (q.answers || [])) })),
                            catchError(() => of({ ...q, quizId, answers: q.answers || [] }))
                        );
                    });

                    return forkJoin(requests);
                }),
                catchError(() => tryGetQuestions(index + 1))
            );
        };
        return tryGetQuestions(0);
    }

    getQuizById(id: number): Observable<Quiz> {
        return this.http.get<Quiz>(`${this.quizzesUrl}/${id}`).pipe(
            map(quiz => {
                quiz.questions?.forEach(question => {
                    if (question.options && (!question.answers || question.answers.length === 0)) {
                        try {
                            question.answers = JSON.parse(question.options);
                        } catch (e) { }
                    }
                });
                return quiz;
            }),
            catchError(err => {
                console.warn('[QuizService] getQuizById failed, taking from mock cache', err);
                const cached = this.mockQuizzes.find(q => Number(q.id) === Number(id));
                return cached ? of(cached) : of(this.getMockQuiz(id));
            })
        );
    }

    private getMockQuiz(id: number = 0): Quiz {
        return { id, title: `Quiz #${id}`, description: '', createdBy: 1, questions: [] };
    }

    createQuiz(quiz: Quiz): Observable<Quiz> {
        console.log('[QuizService] Création du quiz complet:', quiz);
        // On envoie le quiz tel quel, le backend gère le cascade save (questions + answers)
        return this.http.post<Quiz>(this.quizzesUrl, quiz, { headers: this.headers }).pipe(
            tap(newQuiz => {
                console.log('[QuizService] Quiz créé avec succès:', newQuiz);
                this.mockQuizzes.push(newQuiz);
                this.quizzesSubject.next(this.mockQuizzes);
                this.saveToStorage();
            }),
            catchError(error => {
                console.error('[QuizService] Erreur création quiz:', error);
                return of(quiz); // Fallback
            })
        );
    }

    updateQuiz(id: number, quiz: Quiz): Observable<Quiz> {
        return this.http.put<Quiz>(`${this.quizzesUrl}/${id}`, quiz, { headers: this.headers }).pipe(
            tap(updated => {
                const idx = this.mockQuizzes.findIndex(q => q.id === id);
                if (idx !== -1) { this.mockQuizzes[idx] = updated; this.saveToStorage(); }
            }),
            catchError(err => { return of({ ...quiz, id }); })
        );
    }

    deleteQuiz(id: number): Observable<void> {
        return this.http.delete<void>(`${this.quizzesUrl}/${id}`).pipe(
            tap(() => {
                this.mockQuizzes = this.mockQuizzes.filter(q => q.id !== id);
                this.quizzesSubject.next(this.mockQuizzes);
                this.saveToStorage();
            }),
            catchError(() => of(void 0))
        );
    }

    // ─── Question CRUD (délégué depuis ici aussi) ─────────────────────────────

    getQuestionsByQuiz(quizId: number): Observable<QuizQuestion[]> {
        return this.loadQuestionsForQuiz(quizId);
    }

    createQuestion(question: QuizQuestion): Observable<QuizQuestion> {
        const payload = { content: question.content, timeLimit: question.timeLimit, quizId: question.quizId };
        return this.http.post<QuizQuestion>(this.questionsUrl, payload, { headers: this.headers }).pipe(
            catchError(() => of({ ...question, id: Date.now() }))
        );
    }

    updateQuestion(id: number, question: QuizQuestion): Observable<QuizQuestion> {
        return this.http.put<QuizQuestion>(`${this.questionsUrl}/${id}`, question, { headers: this.headers }).pipe(
            catchError(() => of({ ...question, id }))
        );
    }

    deleteQuestion(id: number): Observable<void> {
        return this.http.delete<void>(`${this.questionsUrl}/${id}`).pipe(
            catchError(() => of(void 0))
        );
    }
}
