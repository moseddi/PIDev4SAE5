import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { GameSessionService } from '../../services/game-session.service';
import { QuizService } from '../../services/quiz.service';
import { GameSession, GameStatus, Score, Quiz } from '../../models/quiz.models';
import { QuizWebSocketService } from '../../services/quiz-websocket.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-session-control',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="control-page" *ngIf="session; else loading">

      <!-- Header -->
      <div class="control-header">
        <div class="quiz-name">🎮 {{ session.quiz ? session.quiz.title : 'Quiz' }}</div>
        <div class="status-pill" [ngClass]="session.status ? session.status.toLowerCase() : ''">
          {{ statusLabel }}
        </div>
      </div>

      <!-- PIN Card -->
      <div class="pin-card">
        <div class="pin-label">Code PIN à partager avec les joueurs</div>
        <div class="pin-value">{{ session.gamePin }}</div>
        <div class="pin-hint">
          Les joueurs vont sur l'application → Quiz Live → entrent ce code
        </div>
      </div>

      <!-- Lobby: joueurs connectés -->
      <div class="players-card" *ngIf="session.status === 'WAITING'">
        <div class="players-header">
          <span>👥 Joueurs dans le lobby</span>
          <span class="player-count">{{ players.length }} / ∞</span>
        </div>

        <div class="players-grid" *ngIf="players.length > 0">
          <div class="player-chip" *ngFor="let p of players; let i = index">
            <span class="player-avatar">{{ getAvatar(i) }}</span>
            <span>{{ p }}</span>
          </div>
        </div>

        <div class="waiting-msg" *ngIf="players.length === 0">
          ⏳ En attente de joueurs... Partagez le PIN !
        </div>

        <button
          class="btn-start"
          (click)="startGame()"
          [disabled]="players.length === 0 || starting">
          {{ starting ? 'Démarrage...' : '▶️ Démarrer la partie (' + players.length + ' joueur' + (players.length > 1 ? 's' : '') + ')' }}
        </button>
      </div>

      <!-- En cours : contrôle des questions -->
      <div class="game-card" *ngIf="session.status === 'STARTED'">
        <div class="question-info">
          <span class="q-label">Question en cours</span>
          <span class="q-index">{{ (session.currentQuestionIndex ?? 0) + 1 }} / {{ totalQuestions }}</span>
        </div>

        <div class="score-list" *ngIf="scores.length > 0">
          <div class="score-header">🏆 Classement en direct</div>
          <div class="score-row" *ngFor="let s of scores; let i = index">
            <span class="rank">{{ i + 1 }}</span>
            <span class="player-name">{{ s.username || 'Joueur ' + s.userId }}</span>
            <span class="score-pts">{{ s.points }}</span>
          </div>
        </div>

        <!-- Per-question breakdown -->
        <div class="breakdown-wrap" *ngIf="playerGrid.length > 0">
          <div class="breakdown-header">📊 Détail par question</div>
          <table class="breakdown-table">
            <thead>
              <tr>
                <th>Joueur</th>
                <th *ngFor="let q of questionCols">Q{{ q + 1 }}</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of playerGrid">
                <td class="pgrid-name">{{ row.username }}</td>
                <td *ngFor="let q of questionCols" class="pgrid-pts"
                    [class.correct]="row.questions[q] > 0"
                    [class.wrong]="row.questions[q] === 0 && row.questions[q] !== undefined">
                  {{ row.questions[q] !== undefined ? row.questions[q] : '—' }}
                </td>
                <td class="pgrid-total">{{ row.total }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="auto-info">
          ⏱️ Le quiz avance automatiquement côté joueur. Utilisez "Terminer" pour clore la session.
        </div>

        <div class="game-actions">
          <button class="btn-next" (click)="nextQuestion()" [disabled]="progressing">
            {{ progressing ? 'Chargement...' : '➡️ Question suivante' }}
          </button>
          <button class="btn-end" (click)="finishGame()">
            🏁 Terminer la partie
          </button>
        </div>
      </div>

      <!-- Terminé -->
      <div class="end-card" *ngIf="session.status === 'FINISHED'">
        <div class="end-icon">🏆</div>
        <div class="end-title">Partie terminée !</div>
        <div class="final-scores" *ngIf="scores.length > 0">
          <div class="score-row podium" *ngFor="let s of scores; let i = index">
            <span class="rank">{{ ['🥇','🥈','🥉'][i] || (i+1) }}</span>
            <span class="player-name">{{ s.username || 'Joueur ' + s.userId }}</span>
            <span class="score-pts">{{ s.points }}</span>
          </div>
        </div>
        <div class="breakdown-wrap" *ngIf="playerGrid.length > 0" style="text-align:left">
          <div class="breakdown-header">📊 Détail par question</div>
          <table class="breakdown-table">
            <thead>
              <tr>
                <th>Joueur</th>
                <th *ngFor="let q of questionCols">Q{{ q + 1 }}</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of playerGrid">
                <td class="pgrid-name">{{ row.username }}</td>
                <td *ngFor="let q of questionCols" class="pgrid-pts"
                    [class.correct]="row.questions[q] > 0"
                    [class.wrong]="row.questions[q] === 0 && row.questions[q] !== undefined">
                  {{ row.questions[q] !== undefined ? row.questions[q] : '—' }}
                </td>
                <td class="pgrid-total">{{ row.total }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <button class="btn-back" (click)="router.navigate(['/backoffice/game-sessions'])">
          ← Retour aux sessions
        </button>
      </div>

    </div>

    <ng-template #loading>
      <div class="loading-page">
        <div class="spinner"></div>
        <p>Chargement de la session...</p>
      </div>
    </ng-template>
  `,
    styles: [`
    .control-page {
      max-width: 700px;
      margin: 0 auto;
      padding: 2rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Header */
    .control-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .quiz-name { font-size: 1.4rem; font-weight: 800; color: #1e293b; }
    .status-pill {
      padding: 0.4rem 1rem;
      border-radius: 99px;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .waiting  { background: #fef9c3; color: #a16207; }
    .started  { background: #dcfce7; color: #15803d; }
    .finished { background: #f1f5f9; color: #64748b; }

    /* PIN */
    .pin-card {
      background: linear-gradient(135deg, #1e3a5f, #1d4ed8);
      border-radius: 20px;
      padding: 2.5rem;
      text-align: center;
      color: white;
      box-shadow: 0 10px 40px rgba(29,78,216,0.3);
    }
    .pin-label { font-size: 0.9rem; opacity: 0.8; margin-bottom: 1rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; }
    .pin-value {
      font-size: 4rem;
      font-weight: 900;
      letter-spacing: 0.3em;
      font-family: monospace;
      text-shadow: 0 2px 10px rgba(0,0,0,0.3);
      margin-bottom: 1rem;
    }
    .pin-hint { font-size: 0.85rem; opacity: 0.7; }

    /* Players */
    .players-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .players-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 700;
      font-size: 1rem;
      color: #1e293b;
    }
    .player-count {
      background: #eff6ff;
      color: #1d4ed8;
      padding: 0.2rem 0.7rem;
      border-radius: 99px;
      font-size: 0.85rem;
      font-weight: 700;
    }
    .players-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .player-chip {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 99px;
      padding: 0.4rem 0.9rem;
      font-size: 0.9rem;
      font-weight: 600;
      color: #374151;
      animation: popIn 0.3s ease;
    }
    @keyframes popIn {
      from { transform: scale(0.8); opacity: 0; }
      to   { transform: scale(1);   opacity: 1; }
    }
    .player-avatar { font-size: 1.1rem; }
    .waiting-msg { color: #94a3b8; font-style: italic; font-size: 0.9rem; text-align: center; padding: 0.5rem; }

    .btn-start {
      width: 100%;
      padding: 1rem;
      background: linear-gradient(135deg, #16a34a, #15803d);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 1.1rem;
      font-weight: 800;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 15px rgba(22,163,74,0.3);
    }
    .btn-start:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(22,163,74,0.4); }
    .btn-start:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    /* Game card */
    .game-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .question-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .q-label { font-weight: 700; color: #374151; }
    .q-index { font-size: 1.5rem; font-weight: 900; color: #7c3aed; }
    .score-header { font-weight: 700; color: #1e293b; margin-bottom: 0.5rem; }
    .score-list { display: flex; flex-direction: column; gap: 0.1rem; }
    .score-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 0.75rem;
      border-radius: 8px;
      background: #f8fafc;
    }
    .rank { width: 28px; font-weight: 800; color: #94a3b8; text-align: center; }
    .player-name { flex: 1; font-weight: 600; color: #1e293b; }
    .score-pts { font-weight: 800; color: #7c3aed; }
    .podium:nth-child(1) { background: #fefce8; }
    .podium:nth-child(2) { background: #f8fafc; }
    .podium:nth-child(3) { background: #fff7ed; }

    .auto-info { font-size: 0.85rem; color: #64748b; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.6rem 1rem; text-align: center; }
    .game-actions { display: flex; gap: 1rem; }
    .btn-next {
      flex: 1;
      padding: 0.85rem;
      background: #7c3aed;
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-next:hover:not(:disabled) { background: #6d28d9; }
    .btn-next:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-end {
      padding: 0.85rem 1.25rem;
      background: #fee2e2;
      color: #dc2626;
      border: 1px solid #fca5a5;
      border-radius: 10px;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-end:hover { background: #fca5a5; }

    /* End card */
    .end-card {
      background: white;
      border-radius: 16px;
      padding: 2.5rem;
      text-align: center;
      border: 1px solid #e2e8f0;
    }
    .end-icon { font-size: 3rem; margin-bottom: 0.5rem; }
    .end-title { font-size: 1.5rem; font-weight: 900; color: #1e293b; margin-bottom: 1.5rem; }
    .final-scores { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 2rem; text-align: left; }
    .btn-back {
      padding: 0.75rem 1.5rem;
      background: #eff6ff;
      color: #1d4ed8;
      border: none;
      border-radius: 10px;
      font-weight: 700;
      cursor: pointer;
    }

    /* Breakdown grid */
    .breakdown-wrap { margin-top: 1rem; }
    .breakdown-header { font-weight: 700; color: #1e293b; margin-bottom: 0.5rem; font-size: 0.95rem; }
    .breakdown-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .breakdown-table th { background: #f8fafc; padding: 0.5rem 0.75rem; text-align: center; font-size: 0.75rem; text-transform: uppercase; color: #64748b; border-bottom: 2px solid #e2e8f0; }
    .breakdown-table th:first-child { text-align: left; }
    .pgrid-name { font-weight: 700; color: #1e293b; padding: 0.5rem 0.75rem; border-bottom: 1px solid #f1f5f9; }
    .pgrid-pts { text-align: center; padding: 0.5rem 0.5rem; border-bottom: 1px solid #f1f5f9; font-weight: 600; }
    .pgrid-pts.correct { color: #15803d; background: #f0fdf4; }
    .pgrid-pts.wrong   { color: #dc2626; background: #fef2f2; }
    .pgrid-total { text-align: center; font-weight: 800; color: #7c3aed; padding: 0.5rem 0.75rem; border-bottom: 1px solid #f1f5f9; border-left: 2px solid #e2e8f0; }

    /* Loading */
    .loading-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 50vh;
      gap: 1rem;
      color: #64748b;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class SessionControlComponent implements OnInit, OnDestroy {
    session: GameSession | null = null;
    players: string[] = [];
    scores: Score[] = [];
    totalQuestions = 0;
    starting = false;
    progressing = false;

    // Per-question breakdown grid
    playerGrid: { username: string; questions: Record<number, number>; total: number }[] = [];
    questionCols: number[] = [];

    private pollInterval: any;
    private wsSubscription?: Subscription;

    constructor(
        private route: ActivatedRoute,
        public router: Router,
        private sessionService: GameSessionService,
        private quizService: QuizService,
        private quizWsService: QuizWebSocketService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        this.loadSession(id);
        
        // Subscribe to real-time events
        this.quizWsService.subscribeToSession(id);
        this.wsSubscription = this.quizWsService.events$.subscribe((event: { type: string; payload: any }) => {
            console.log('Quiz Event Received:', event);
            this.handleWsEvent(event);
        });

        // Keep a slow poll for session status fallback (every 5s instead of 2s)
        this.pollInterval = setInterval(() => this.refreshData(), 5000);
    }

    ngOnDestroy(): void {
        if (this.pollInterval) clearInterval(this.pollInterval);
        if (this.wsSubscription) this.wsSubscription.unsubscribe();
        const id = Number(this.route.snapshot.paramMap.get('id'));
        this.quizWsService.unsubscribeFromSession(id);
    }

    private handleWsEvent(event: { type: string; payload: any }): void {
        switch (event.type) {
            case 'PLAYER_JOINED':
                this.players = event.payload.players || [];
                this.cdr.detectChanges();
                break;
            case 'RANKING_UPDATE':
                this.scores = (event.payload.ranking || []).sort((a: any, b: any) => b.points - a.points);
                this.cdr.detectChanges();
                break;
            case 'START':
                if (this.session) {
                    this.session.status = GameStatus.STARTED;
                    this.refreshData();
                }
                break;
            case 'END':
                if (this.session) {
                    this.session.status = GameStatus.FINISHED;
                    this.refreshData();
                }
                break;
        }
    }

    private loadSession(id: number): void {
        this.sessionService.getSessionById(id).subscribe((s: GameSession) => {
            this.session = s;
            if (s.quiz?.questions) this.totalQuestions = s.quiz.questions.length;
            this.cdr.detectChanges();
            this.refreshData();
        });
    }

    private refreshData(): void {
        if (!this.session?.id) return;
        const id = this.session.id;

        this.sessionService.getSessionById(id).subscribe((s: GameSession) => {
            this.session = s;
            this.cdr.detectChanges();

            const quizId = (s as any).quizId;
            if (quizId && this.totalQuestions === 0) {
                this.quizService.getQuizById(quizId).subscribe((q: Quiz) => {
                    this.totalQuestions = q.questions?.length || 0;
                    this.cdr.detectChanges();
                });
            }

            if (s.status === GameStatus.WAITING) {
                this.sessionService.getPlayers(id).subscribe((p: string[]) => {
                    this.players = p;
                    this.cdr.detectChanges();
                });
            }

            if (s.status === GameStatus.STARTED || s.status === GameStatus.FINISHED) {
                this.sessionService.getScoresBySession(id).subscribe((scores: Score[]) => {
                    this.scores = scores.sort((a: any, b: any) => b.points - a.points);
                    this.cdr.detectChanges();
                });
                this.sessionService.getDetailedScores(id).subscribe((detail: Score[]) => {
                    this.buildGrid(detail);
                    this.cdr.detectChanges();
                });
            }
        });
    }

    startGame(): void {
        if (!this.session?.id || this.starting) return;
        this.starting = true;
        this.sessionService.startGame(this.session.id).subscribe({
            next: () => { this.starting = false; this.cdr.detectChanges(); this.refreshData(); },
            error: () => { this.starting = false; this.cdr.detectChanges(); }
        });
    }

    nextQuestion(): void {
        if (!this.session?.id || this.progressing) return;
        this.progressing = true;
        this.sessionService.nextQuestion(this.session.id).subscribe({
            next: () => { this.progressing = false; this.cdr.detectChanges(); this.refreshData(); },
            error: () => { this.progressing = false; this.cdr.detectChanges(); }
        });
    }

    finishGame(): void {
        if (!this.session?.id) return;
        this.sessionService.endGame(this.session.id).subscribe({
            next: () => { this.cdr.detectChanges(); this.refreshData(); },
            error: (err) => { console.error('Error ending game:', err); }
        });
    }

    private buildGrid(detail: Score[]): void {
        const map: Record<string, Record<number, number>> = {};
        const qSet = new Set<number>();
        for (const s of detail) {
            const name = s.username || ('Joueur ' + s.userId);
            if (!map[name]) map[name] = {};
            if (s.questionIndex !== undefined) {
                map[name][s.questionIndex] = s.points;
                qSet.add(s.questionIndex);
            }
        }
        this.questionCols = Array.from(qSet).sort((a, b) => a - b);
        this.playerGrid = Object.entries(map).map(([username, questions]) => ({
            username,
            questions,
            total: Object.values(questions).reduce((sum, p) => sum + p, 0)
        })).sort((a, b) => b.total - a.total);
    }

    getAvatar(index: number): string {
        const avatars = ['🐶','🦊','🐱','🐼','🐸','🦁','🐯','🦋','🦄','🐻'];
        return avatars[index % avatars.length];
    }

    get statusLabel(): string {
        if (!this.session) return '';
        switch (this.session.status) {
            case GameStatus.WAITING:  return '⏳ Lobby';
            case GameStatus.STARTED:  return '🟢 En cours';
            case GameStatus.FINISHED: return '🏁 Terminée';
            default:                  return this.session.status ?? '';
        }
    }
}
