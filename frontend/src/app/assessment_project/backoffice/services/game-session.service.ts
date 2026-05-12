import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GameSession, Score } from '../models/quiz.models';

@Injectable({ providedIn: 'root' })
export class GameSessionService {
    private readonly baseUrl = '/quiz-api/game-sessions';
    private readonly scoresUrl = '/quiz-api/scores';

    constructor(private http: HttpClient) { }

    getAllSessions(): Observable<GameSession[]> {
        return this.http.get<GameSession[]>(this.baseUrl).pipe(
            catchError(() => of([]))
        );
    }

    getSessionById(id: number): Observable<GameSession> {
        return this.http.get<GameSession>(`${this.baseUrl}/${id}`);
    }

    createSession(quizId: number): Observable<GameSession> {
        return this.http.post<GameSession>(this.baseUrl, { quizId: quizId });
    }

    startGame(sessionId: number): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/${sessionId}/start`, {});
    }

    endGame(sessionId: number): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/${sessionId}/end`, {});
    }

    nextQuestion(sessionId: number): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/${sessionId}/next-question`, {});
    }

    joinSession(sessionId: number, username: string): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/${sessionId}/join`, null, {
            params: { name: username }
        }).pipe(catchError(() => of(null)));
    }

    getPlayers(sessionId: number): Observable<string[]> {
        return this.http.get<string[]>(`${this.baseUrl}/${sessionId}/active-players`).pipe(
            catchError(() => of([]))
        );
    }

    getScoresBySession(sessionId: number): Observable<Score[]> {
        return this.http.get<Score[]>(`${this.scoresUrl}/session/${sessionId}`).pipe(
            catchError(() => of([]))
        );
    }

    submitScore(score: Score): Observable<Score> {
        return this.http.post<Score>(this.scoresUrl, score);
    }

    getDetailedScores(sessionId: number): Observable<Score[]> {
        // Correct endpoint without /detailed if backend doesn't support it
        return this.http.get<Score[]>(`${this.scoresUrl}/session/${sessionId}`).pipe(
            catchError(() => of([]))
        );
    }

    deleteSession(sessionId: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${sessionId}`);
    }
}
