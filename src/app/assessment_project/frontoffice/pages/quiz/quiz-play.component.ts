import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GameSessionService } from '../../../backoffice/services/game-session.service';
import { QuizService } from '../../../backoffice/services/quiz.service';
import { GameSession, Quiz, QuizQuestion, GameStatus, Score } from '../../../backoffice/models/quiz.models';
import { interval, Subscription, timer } from 'rxjs';
import { QuizWebsocketService, QuizEvent } from '../../services/quiz-websocket.service';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-quiz-play',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="kahoot-container" [class]="'phase-' + phase" *ngIf="session; else loading">
      <!-- 1. LOBBY - Salle d'attente -->
      <div *ngIf="phase === 'LOBBY'" class="lobby">
        <div class="lobby-card">
          <div class="lobby-title">🎮 {{ quiz?.title || 'Quiz Live' }}</div>

          <div class="pin-box">
            <span class="pin-label">CODE PIN</span>
            <div class="pin-value">{{ gamePin || '...' }}</div>
          </div>

          <div class="players-section">
            <div class="players-header">👥 {{ connectedPlayers.length }} joueur(s) connecté(s)</div>
            <div class="players-grid">
              <div class="player-chip" *ngFor="let p of connectedPlayers" [class.me]="p === userName">
                {{ p }}<span *ngIf="p === userName" class="me-tag"> ✓</span>
              </div>
              <div class="player-chip empty" *ngIf="connectedPlayers.length === 0">
                En attente de joueurs...
              </div>
            </div>
          </div>

          <div class="lobby-anim">
            <div class="kahoot-loader">
              <div class="dot d1"></div><div class="dot d2"></div><div class="dot d3"></div>
            </div>
            <p class="waiting-msg">En attente du signal de l'animateur...</p>
            <button class="btn-refresh" (click)="manualRefresh()">🔄 Rafraîchir</button>
          </div>
        </div>
      </div>

      <!-- 2. QUESTION PHASE -->
      <div *ngIf="phase === 'QUESTION'" class="question-view">
        <div *ngIf="currentQuestion; else questionLoading">
          <div class="play-header">
            <div class="timer-circle" [class.low]="timeLeft <= 5">
              <span class="timer-num">{{ timeLeft }}</span>
            </div>
            <div class="play-progress">
               {{ currentQuestionIndex + 1 }} sur {{ questions.length }}
            </div>
            <div class="play-score">Score: {{ totalScore }}</div>
          </div>

          <div class="question-hero">
            <h1 class="q-text">{{ currentQuestion.content }}</h1>
          </div>

          <div class="play-body">
             <div class="media-min">🖼️</div>
             
             <div class="answers-grid" [class.tf-layout]="isTrueFalse">
               <button *ngFor="let ans of currentQuestion.answers; let i = index" 
                       [class]="'ans-btn color-' + i" 
                       (click)="submitAnswer(i)"
                       [disabled]="answered">
                 <span class="shape">{{ shapes[i] }}</span>
                 <span class="ans-text">{{ ans.content }}</span>
                 <div class="btn-ripple"></div>
               </button>
             </div>
          </div>
        </div>
        <ng-template #questionLoading>
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Chargement de la question...</p>
          </div>
        </ng-template>
      </div>

      <!-- 3. FEEDBACK PHASE -->
      <div *ngIf="phase === 'FEEDBACK'" class="feedback-view" [class.correct]="lastAnswerCorrect" [class.wrong]="!lastAnswerCorrect">
         <div class="feedback-card">
            <div class="feedback-icon">{{ lastAnswerCorrect ? '✓' : '✗' }}</div>
            <h1 class="feedback-title">{{ lastAnswerCorrect ? 'Correct' : 'Incorrect' }}</h1>
            
            <div class="feedback-streak" *ngIf="lastAnswerCorrect">
                <span class="streak-icon">🔥</span> Réponse enregistrée !
            </div>
            
            <div class="points-badge" [class.show]="lastPoints > 0">
                + {{ lastPoints }}
            </div>
            
            <div class="feedback-info">
               <p *ngIf="!lastAnswerCorrect">Oups ! La bonne réponse était : <strong>{{ getCorrectAnswerContent() }}</strong></p>
               
               <!-- Classement Temporaire -->
               <div class="ranking-box">
                  <h3>Classement Temporaire</h3>
                  <div class="ranking-list">
                    <div class="rank-item" *ngFor="let player of ranking; let i = index">
                       <span class="rank-num">{{ i + 1 }}</span>
                       <span class="rank-name">{{ player.name }}</span>
                       <span class="rank-score">{{ player.score }} pts</span>
                    </div>
                  </div>
               </div>

               <div class="total-pill">SCORE TOTAL: {{ totalScore }}</div>
            </div>
          </div>
      </div>

      <!-- 4. END PHASE (PODIUM) -->
      <div *ngIf="phase === 'END'" class="end-view">
        <div class="confetti-placeholder">🎉</div>
        <h1 class="end-title">Terminé !</h1>
        
        <div class="final-score-card">
           <div class="star-rating">⭐⭐⭐</div>
           <div class="final-points">{{ totalScore }}</div>
           <p>Points au total</p>
        </div>

        <button class="btn-finish" (click)="exit()">Terminer</button>
      </div>

      <!-- TRANSITION SCREEN -->
      <div class="transition-screen" *ngIf="isTransitioning">
          <div class="get-ready">PRÊT ?</div>
          <button class="btn-skip" (click)="skipTransition()">▶ Commencer</button>
      </div>

      <div class="toast-error" *ngIf="errorMsg">{{ errorMsg }}</div>
    </div>

    <ng-template #loading>
      <div class="loading-page">
        <div class="spinner"></div>
        <p>Chargement du quiz...</p>
      </div>
    </ng-template>
  `,
  styles: [`
    :host {
      --primary-color: #2D5757;
      --secondary-color: #F7EDE2;
      --accent-color: #26890c;
      --error-color: #dc2626;
      --warning-color: #d89e00;
      --info-color: #1368ce;
      --white: #ffffff;
    }

    .kahoot-container {
      position: fixed;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: 'Open Sans', 'Montserrat', sans-serif;
      overflow: hidden;
      color: var(--white);
      transition: background 0.4s ease;
    }

    .phase-LOBBY { 
      background: linear-gradient(135deg, var(--primary-color), #1a3a3a);
    }
    .phase-QUESTION { 
      background: linear-gradient(135deg, var(--secondary-color), rgba(45, 87, 87, 0.05));
      color: var(--primary-color);
    }
    .phase-FEEDBACK.correct { 
      background: linear-gradient(135deg, var(--accent-color), #1a5c08);
    }
    .phase-FEEDBACK.wrong { 
      background: linear-gradient(135deg, var(--error-color), #b91c1c);
    }
    .phase-END { 
      background: linear-gradient(135deg, var(--info-color), #0d4a8c);
    }

    /* LOBBY */
    .lobby { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
    .lobby-card {
      background: white; color: var(--primary-color); padding: 2.5rem; border-radius: 30px;
      text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.3); width: 90%; max-width: 640px;
    }
    .lobby-title { font-size: 1.6rem; font-weight: 900; margin-bottom: 1.5rem; color: var(--primary-color); }
    .pin-box { background: #f1f5f9; padding: 1.5rem 2rem; border-radius: 20px; margin-bottom: 1.5rem; }
    .pin-label { font-size: 0.75rem; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; opacity: 0.6; }
    .pin-value { font-size: 3.5rem; font-weight: 900; color: var(--primary-color); letter-spacing: 6px; }

    /* Players section */
    .players-section { margin-bottom: 1.5rem; }
    .players-header { font-weight: 700; font-size: 0.95rem; color: var(--primary-color); margin-bottom: 0.75rem; opacity: 0.7; }
    .players-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; min-height: 2.5rem; }
    .player-chip {
      background: linear-gradient(135deg, var(--primary-color), #1a3a3a);
      color: white; padding: 0.5rem 1rem; border-radius: 20px;
      font-weight: 700; font-size: 0.9rem;
      animation: popIn 0.3s ease;
    }
    .player-chip.me { background: linear-gradient(135deg, #1368ce, #0d4a8c); }
    .player-chip.empty { background: #f1f5f9; color: var(--primary-color); opacity: 0.5; }
    .me-tag { font-size: 0.75rem; opacity: 0.8; }
    @keyframes popIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }

    .waiting-msg { font-size: 0.95rem; opacity: 0.6; font-weight: 600; margin: 0 0 1rem; }
    .btn-refresh {
      background: transparent; border: 2px solid rgba(45,87,87,0.2);
      color: var(--primary-color); padding: 0.5rem 1.5rem; border-radius: 20px;
      font-weight: 700; font-size: 0.85rem; cursor: pointer; opacity: 0.6;
      transition: all 0.2s;
    }
    .btn-refresh:hover { opacity: 1; background: rgba(45,87,87,0.05); }

    /* RANKING BOX */
    .ranking-box { background: white; border-radius: 20px; padding: 1.5rem; margin-top: 1.5rem; border: 2px solid #f1f5f9; }
    .ranking-box h3 { margin-top: 0; font-size: 1.1rem; color: var(--primary-color); }
    .ranking-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .rank-item { display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: #f8fafc; border-radius: 12px; }
    .rank-num { font-weight: 900; color: var(--info-color); width: 25px; }
    .rank-name { flex: 1; text-align: left; font-weight: 700; }
    .rank-score { font-weight: 800; color: var(--accent-color); }

    .pin-display { 
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      color: var(--primary-color);
      padding: 1.5rem 3rem;
      border-radius: 20px;
      text-align: center;
      margin-bottom: 3rem;
      box-shadow: 0 15px 40px rgba(45, 87, 87, 0.2);
      border: 2px solid rgba(45, 87, 87, 0.1);
    }
    .pin-tag { 
      font-size: 0.9rem;
      font-weight: 900;
      opacity: 0.7;
      letter-spacing: 1px;
    }
    .pin-code { 
      font-size: 3.5rem;
      margin: 0;
      letter-spacing: 3px;
      font-weight: 900;
      background: linear-gradient(135deg, var(--primary-color), #1a3a3a);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .loader-ring { 
      width: 80px;
      height: 80px;
      border: 8px solid rgba(255,255,255,0.2);
      border-top-color: var(--white);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 2rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* QUESTION VIEW */
    .question-view { 
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .play-header { 
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-bottom: 2px solid rgba(45, 87, 87, 0.1);
      box-shadow: 0 4px 20px rgba(45, 87, 87, 0.1);
    }
    .timer-circle { 
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, var(--primary-color), #1a3a3a);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--white);
      transition: all 0.3s ease;
      box-shadow: 0 6px 20px rgba(45, 87, 87, 0.3);
    }
    .timer-circle.low { 
      background: linear-gradient(135deg, var(--error-color), #b91c1c);
      transform: scale(1.1);
      box-shadow: 0 8px 25px rgba(220, 38, 38, 0.4);
    }
    .timer-num { 
      font-weight: 900;
      font-size: 1.5rem;
    }
    .play-progress { 
      font-weight: 800;
      color: var(--primary-color);
      font-size: 1.2rem;
      opacity: 0.8;
    }
    .play-score { 
      font-weight: 800;
      color: var(--primary-color);
      background: rgba(247, 237, 226, 0.5);
      padding: 0.5rem 1.5rem;
      border-radius: 15px;
      border: 2px solid rgba(45, 87, 87, 0.1);
    }

    .question-hero { 
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      padding: 3rem;
      box-shadow: 0 8px 30px rgba(45, 87, 87, 0.1);
      text-align: center;
      width: 100%;
      border-bottom: 2px solid rgba(45, 87, 87, 0.1);
    }
    .q-text { 
      font-size: 2.5rem;
      font-weight: 900;
      margin: 0;
      color: var(--primary-color);
      max-width: 1000px;
      margin: 0 auto;
      line-height: 1.2;
    }

    .play-body { 
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-evenly;
      padding: 2rem;
    }
    .media-min { 
      font-size: 5rem;
      opacity: 0.1;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    .answers-grid { 
      width: 100%;
      max-width: 1200px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      position: relative;
      z-index: 1;
    }
    .answers-grid.tf-layout { 
      grid-template-columns: 1fr 1fr;
    }
    
    .ans-btn { 
      position: relative;
      height: 120px;
      border: none;
      border-radius: 20px;
      display: flex;
      align-items: center;
      padding: 0 2rem;
      cursor: pointer;
      color: var(--white);
      font-size: 1.4rem;
      font-weight: 700;
      box-shadow: 0 8px 25px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
      overflow: hidden;
    }
    .ans-btn.color-0 { 
      background: linear-gradient(135deg, var(--error-color), #b91c1c);
    }
    .ans-btn.color-1 { 
      background: linear-gradient(135deg, var(--info-color), #0d4a8c);
    }
    .ans-btn.color-2 { 
      background: linear-gradient(135deg, var(--warning-color), #b97e00);
    }
    .ans-btn.color-3 { 
      background: linear-gradient(135deg, var(--accent-color), #1a5c08);
    }
    .ans-btn:hover { 
      transform: translateY(-5px);
      box-shadow: 0 15px 40px rgba(0,0,0,0.3);
    }
    .ans-btn:active { 
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.2);
    }
    .ans-btn:disabled { 
      opacity: 0.6;
      cursor: default;
      transform: none;
    }

    .shape { 
      font-size: 2.5rem;
      margin-right: 1.5rem;
      filter: brightness(0.9);
      width: 50px;
      text-align: center;
    }
    .ans-text { 
      flex: 1;
      text-align: left;
      line-height: 1.3;
    }

    /* FEEDBACK */
    .feedback-view { 
      text-align: center;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .feedback-card { 
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 30px;
      padding: 3rem;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
      border: 2px solid rgba(255, 255, 255, 0.3);
      animation: bounceIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      max-width: 500px;
    }
    @keyframes bounceIn { 
      from { 
        transform: scale(0.5); 
        opacity: 0; 
      } 
      to { 
        transform: scale(1); 
        opacity: 1; 
      } 
    }
    .feedback-icon { 
      font-size: 6rem;
      font-weight: 900;
      margin-bottom: 1.5rem;
    }
    .feedback-view.correct .feedback-icon {
      color: var(--accent-color);
    }
    .feedback-view.wrong .feedback-icon {
      color: var(--error-color);
    }
    .feedback-title { 
      font-size: 3rem;
      font-weight: 900;
      margin: 0 0 1.5rem;
      text-transform: uppercase;
    }
    .feedback-view.correct .feedback-title {
      color: var(--accent-color);
    }
    .feedback-view.wrong .feedback-title {
      color: var(--error-color);
    }
    .feedback-streak { 
      background: rgba(38, 137, 12, 0.1);
      color: var(--accent-color);
      padding: 0.75rem 2rem;
      border-radius: 25px;
      font-weight: 700;
      display: inline-block;
      margin-bottom: 1.5rem;
      border: 2px solid rgba(38, 137, 12, 0.2);
    }
    .points-badge { 
      font-size: 3rem;
      font-weight: 900;
      color: var(--accent-color);
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.5s ease;
    }
    .points-badge.show { 
      opacity: 1;
      transform: translateY(0);
    }
    .total-pill { 
      background: rgba(45, 87, 87, 0.1);
      color: var(--primary-color);
      padding: 1rem 2.5rem;
      border-radius: 15px;
      font-weight: 800;
      margin-top: 2rem;
      display: inline-block;
      border: 2px solid rgba(45, 87, 87, 0.2);
    }

    /* END */
    .end-view { 
      text-align: center;
    }
    .final-score-card { 
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      color: var(--primary-color);
      padding: 3rem;
      border-radius: 30px;
      margin: 2rem 0;
      min-width: 350px;
      box-shadow: 0 20px 60px rgba(45, 87, 87, 0.2);
      border: 2px solid rgba(45, 87, 87, 0.1);
    }
    .star-rating { 
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    .final-points { 
      font-size: 4rem;
      font-weight: 900;
      color: var(--info-color);
      margin-bottom: 1rem;
      background: linear-gradient(135deg, var(--info-color), #0d4a8c);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .btn-finish { 
      background: linear-gradient(135deg, var(--primary-color), #1a3a3a);
      color: var(--secondary-color);
      border: none;
      padding: 1.25rem 3rem;
      border-radius: 20px;
      font-weight: 900;
      font-size: 1.2rem;
      cursor: pointer;
      box-shadow: 0 8px 25px rgba(45, 87, 87, 0.3);
      transition: all 0.3s ease;
    }
    .btn-finish:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 35px rgba(45, 87, 87, 0.4);
    }

    /* TRANSITION */
    .transition-screen { 
      position: fixed;
      inset: 0;
      background: linear-gradient(135deg, var(--primary-color), #1a3a3a);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }
    .get-ready {
      font-size: 5rem;
      font-weight: 900;
      color: var(--white);
      animation: pulseS 0.5s infinite;
      margin-bottom: 2rem;
    }
    .btn-skip {
      background: rgba(255,255,255,0.2);
      border: 2px solid rgba(255,255,255,0.5);
      color: white;
      padding: 0.75rem 2rem;
      border-radius: 20px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-skip:hover { background: rgba(255,255,255,0.35); }
    @keyframes pulseS { 
      0%, 100% { 
        transform: scale(1); 
        opacity: 1;
      } 
      50% { 
        transform: scale(1.1); 
        opacity: 0.8;
      } 
    }

    /* Loading state */
    .loading-page, .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      width: 100vw;
      background: linear-gradient(135deg, var(--primary-color), #1a3a3a);
      color: white;
      gap: 1.5rem;
    }
    .loading-state {
       height: 100%;
       width: 100%;
       background: transparent;
       color: var(--primary-color);
    }
    .loading-state .spinner {
       border-top-color: var(--primary-color);
       border-right-color: rgba(45,87,87,0.2);
       border-bottom-color: rgba(45,87,87,0.2);
       border-left-color: rgba(45,87,87,0.2);
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 5px solid rgba(255,255,255,0.2);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Responsive Design */
    @media (max-width: 768px) {
      .pin-display {
        padding: 1rem 2rem;
      }
      
      .pin-code {
        font-size: 2.5rem;
      }
      
      .play-header {
        height: 70px;
        padding: 0 1rem;
      }
      
      .timer-circle {
        width: 50px;
        height: 50px;
      }
      
      .timer-num {
        font-size: 1.2rem;
      }
      
      .question-hero {
        padding: 2rem;
      }
      
      .q-text {
        font-size: 1.8rem;
      }
      
      .answers-grid {
        gap: 0.75rem;
      }
      
      .ans-btn {
        height: 100px;
        padding: 0 1rem;
        font-size: 1.2rem;
      }
      
      .shape {
        font-size: 2rem;
        margin-right: 1rem;
      }
      
      .feedback-card {
        padding: 2rem;
        margin: 1rem;
      }
      
      .feedback-icon {
        font-size: 4rem;
      }
      
      .feedback-title {
        font-size: 2rem;
      }
      
      .final-score-card {
        padding: 2rem;
        min-width: 280px;
      }
      
      .final-points {
        font-size: 3rem;
      }
      
      .get-ready {
        font-size: 3rem;
      }
    }
  `]
})
export class QuizPlayComponent implements OnInit, OnDestroy {
  session?: GameSession;
  quiz?: Quiz;
  questions: QuizQuestion[] = [];
  currentQuestionIndex = 0;
  phase: 'LOBBY' | 'QUESTION' | 'FEEDBACK' | 'END' = 'LOBBY';
  ranking: any[] = [];

  // Joueur courant
  userName = 'Vous';
  connectedPlayers: string[] = [];
  gamePin = '';
  isLiveMode = false;

  timeLeft = 10;
  timerSub?: Subscription;
  pollSub?: Subscription;
  wsSub?: Subscription;

  isTransitioning = false;
  answered = false;
  lastAnswerCorrect = false;
  lastPoints = 0;
  totalScore = 0;
  errorMsg = '';

  shapes = ['▲', '◆', '●', '■'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sessionService: GameSessionService,
    private quizService: QuizService,
    private wsService: QuizWebsocketService,
    private cdr: ChangeDetectorRef
  ) { }

  get currentQuestion(): QuizQuestion | null {
    return this.questions[this.currentQuestionIndex] || null;
  }

  get isTrueFalse(): boolean {
    return this.currentQuestion?.answers?.length === 2;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const mode = this.route.snapshot.queryParamMap.get('mode');
    this.isLiveMode = (mode === 'live');

    // Récupérer le prénom depuis sessionStorage
    this.userName = sessionStorage.getItem('quiz_username') || 'Joueur';
    this.ranking = [{ name: this.userName, score: 0 }];

    if (!id) return;

    this.wsService.connect(id);
    this.listenToWs();

    if (this.isLiveMode) {
      // Mode LIVE : charger la session, rester en LOBBY, attendre START via WS
      this.loadSession(+id);
    } else {
      // Mode SOLO : charger le quiz directement et démarrer
      this.loadQuizDirect(+id);
    }
  }

  listenToWs(): void {
    this.wsSub = this.wsService.getEvents().subscribe((event: QuizEvent) => {
      console.log('[QuizPlay] WS Event:', event.type, event.payload);

      if (event.type === 'PLAYER_JOINED') {
        const payload = event.payload as any;
        if (payload?.players) {
          this.connectedPlayers = payload.players;
          setTimeout(() => this.cdr.detectChanges(), 0);
        }
      }

      if (event.type === 'START') {
        const payload = event.payload as any;
        if (payload?.players) this.connectedPlayers = payload.players;
        // Don't start locally, wait for the first QUESTION event
        console.log('[QuizPlay] Game Started, waiting for first question...');
        this.phase = 'LOBBY'; 
        this.cdr.detectChanges();
      }

      if (event.type === 'QUESTION') {
        const payload = event.payload as any;
        console.log('[QuizPlay] New Question received:', payload);
        
        this.isTransitioning = false;
        this.phase = 'QUESTION';
        this.currentQuestionIndex = payload.questionIndex;
        this.timeLeft = payload.timeLimit || 10;
        
        // Use the question data sent by the server (more secure)
        if (payload.question) {
           const serverQ = payload.question;
           this.questions[this.currentQuestionIndex] = {
             id: serverQ.id,
             content: serverQ.content,
             answers: serverQ.answers,
             timeLimit: this.timeLeft,
             quiz: this.quiz!
           };
        }
        
        this.startQuestionTimer();
        this.cdr.detectChanges();
      }

      if (event.type === 'SCORE_UPDATE') {
        // Server confirmed score for this player
        const payload = event.payload as any;
        if (payload?.playerName === this.userName) {
          this.lastAnswerCorrect = !!payload.isCorrect;
          // Override local point calculation with server value
          const serverPoints: number = payload.points || 0;
          // Adjust totalScore: subtract local calc, add server value
          this.totalScore = this.totalScore - this.lastPoints + serverPoints;
          this.lastPoints = serverPoints;
        }
      }

      if (event.type === 'RANKING_UPDATE') {
        const payload = event.payload as any;
        if (payload?.ranking) {
          this.ranking = payload.ranking.map((r: any) => ({
            name: r.username,
            score: r.points
          }));
          this.cdr.detectChanges();
        }
      }

      if (event.type === 'END') {
        const payload = event.payload as any;
        if (payload?.ranking) {
          this.ranking = payload.ranking.map((r: any, i: number) => ({
            name: this.connectedPlayers[i] || ('Joueur ' + (i + 1)),
            score: r.points
          }));
        }
        if (this.phase !== 'END') this.finishQuiz();
      }
    });
  }

  loadQuizDirect(quizId: number): void {
    this.quizService.getQuizById(quizId).subscribe({
      next: (quiz) => {
        this.quiz = quiz;
        this.quizService.loadQuestionsForQuiz(quizId).subscribe(qs => {
           this.questions = (qs || []).filter(q => q.answers && q.answers.length > 0);
           console.log(`[QuizPlay] ${this.questions.length} questions chargées pour quiz SOLO "${quiz.title}"`);
           if (this.questions.length > 0) {
             this.startQuiz();
           } else {
             this.errorMsg = 'Ce quiz n\'a pas encore de questions avec réponses.';
           }
        });
      },
      error: () => this.errorMsg = 'Impossible de charger le quiz.'
    });
  }

  loadSession(id: number): void {
    this.sessionService.getSessionById(id).subscribe({
      next: (s) => {
        this.session = s;
        this.gamePin = s.gamePin || '';
        const quizId = (s as any).quizId || s.quiz?.id;
        if (quizId) {
          this.quizService.getQuizById(quizId).subscribe(q => {
            this.quiz = q;
            this.quizService.loadQuestionsForQuiz(quizId).subscribe(qs => {
              this.questions = (qs || []).filter(q => q.answers && q.answers.length > 0);
              console.log(`[QuizPlay] ${this.questions.length} questions chargées pour session LIVE "${this.quiz?.title}"`);
              
              // Now that questions are loaded, check if we should jump into a started game
              const alreadyStarted = s.status === GameStatus.STARTED || s.status === GameStatus.IN_PROGRESS;
              if (alreadyStarted) {
                this.phase = 'QUESTION';
                this.currentQuestionIndex = s.currentQuestionIndex || 0;
                this.startQuestionTimer();
                this.cdr.detectChanges();
              }
            });
          });
        }
        // Register in lobby
        this.sessionService.joinSession(id, this.userName).subscribe(res => {
          if (res?.gamePin) this.gamePin = res.gamePin;
          if (res?.players) this.connectedPlayers = res.players;
          setTimeout(() => this.cdr.detectChanges(), 0);
        });

        // Poll for status changes (fallback for WS START event if not already started)
        const alreadyStarted = s.status === GameStatus.STARTED || s.status === GameStatus.IN_PROGRESS;
        if (!alreadyStarted) {
          this.pollSub = interval(2000).subscribe(() => this.checkStatusLoop());
        }
      },
      error: () => this.errorMsg = 'Impossible de charger la session.'
    });
  }

  checkStatusLoop(): void {
    if (!this.session?.id || this.phase !== 'LOBBY') {
      if (this.pollSub) { this.pollSub.unsubscribe(); this.pollSub = undefined; }
      return;
    }
    const id = this.session.id;
    this.sessionService.getSessionById(id).subscribe(s => {
      this.session = s;
      const started = s.status === GameStatus.STARTED || s.status === GameStatus.IN_PROGRESS;
      if (started && this.phase === 'LOBBY') {
        if (this.pollSub) { this.pollSub.unsubscribe(); this.pollSub = undefined; }
        this.startQuiz();
      }
    });
    // Also poll the players list so the player sees themselves in the lobby
    this.sessionService.getPlayers(id).subscribe(players => {
      this.connectedPlayers = players;
      setTimeout(() => this.cdr.detectChanges(), 0);
    });
  }

  manualRefresh(): void {
    if (!this.session?.id) return;
    const id = this.session.id;
    this.sessionService.getPlayers(id).subscribe(players => {
      this.connectedPlayers = players;
      this.cdr.detectChanges();
    });
    this.sessionService.getSessionById(id).subscribe(s => {
      this.session = s;
      this.gamePin = s.gamePin || this.gamePin;
      this.cdr.detectChanges();
    });
  }

  startQuiz(): void {
    if (this.isTransitioning || this.phase !== 'LOBBY') return;
    this.isTransitioning = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.isTransitioning = false;
      this.phase = 'QUESTION';
      this.currentQuestionIndex = 0;
      this.totalScore = 0;
      this.startQuestionTimer();
      this.cdr.detectChanges();
    }, 3000);
  }

  skipTransition(): void {
    this.isTransitioning = false;
    this.phase = 'QUESTION';
    this.startQuestionTimer();
    this.cdr.detectChanges();
  }

  startQuestionTimer(): void {
    this.answered = false;
    this.timeLeft = 10;
    if (this.timerSub) this.timerSub.unsubscribe();

    this.timerSub = interval(1000).subscribe(() => {
      this.timeLeft--;
      this.cdr.detectChanges();
      if (this.timeLeft <= 0) {
        if (!this.answered) this.submitAnswer(-1);
      }
    });
  }

  submitAnswer(ansIndex: number): void {
    if (this.answered) return;
    this.answered = true;
    if (this.timerSub) this.timerSub.unsubscribe();

    // Check locally (works for solo and as pre-fill for live until SCORE_UPDATE arrives)
    const correctIdx = this.currentQuestion?.answers?.findIndex(a => a.isCorrect) ?? -1;
    this.lastAnswerCorrect = ansIndex !== -1 && ansIndex === correctIdx;
    this.lastPoints = this.lastAnswerCorrect ? Math.round(500 + (this.timeLeft * 50)) : 0;
    this.totalScore += this.lastPoints;

    // In live mode: send answer to server for authoritative scoring + ranking
    if (this.isLiveMode && this.session?.id && this.currentQuestion) {
      const ans = this.currentQuestion.answers?.[ansIndex];
      const answerId = ans?.id ?? null;
      this.wsService.sendAnswer({
        sessionId: this.session.id,
        playerName: this.userName,
        answerId,
        timeLeft: this.timeLeft,
        questionIndex: this.currentQuestionIndex
      });
    }

    // Update local ranking display
    const you = this.ranking.find(r => r.name === this.userName);
    if (you) you.score = this.totalScore;
    else this.ranking.push({ name: this.userName, score: this.totalScore });
    this.ranking.sort((a, b) => b.score - a.score);

    this.phase = 'FEEDBACK';
    this.cdr.detectChanges();
    
    // In live mode, we wait for the server to send the next question.
    // Only auto-advance in Solo mode.
    if (!this.isLiveMode) {
      setTimeout(() => this.nextQuestion(), 3000);
    }
  }

  getCorrectAnswerContent(): string {
    return this.currentQuestion?.answers?.find(a => a.isCorrect)?.content || '';
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      // Pas d'écran PRÊT entre les questions — on enchaîne directement
      this.phase = 'QUESTION';
      this.startQuestionTimer();
      this.cdr.detectChanges();
    } else {
      this.finishQuiz();
    }
  }

  finishQuiz(): void {
    this.phase = 'END';
    this.cdr.detectChanges();

    if (this.session?.id) {
      const userId = Number(sessionStorage.getItem('quiz_user_id')) || 0;
      const username = sessionStorage.getItem('quiz_username') || this.userName;
      const scorePayload: Score = {
        sessionId: this.session.id,
        userId,
        username,
        points: this.totalScore,
        session: this.session
      };
      this.sessionService.submitScore(scorePayload).subscribe();
    }
  }

  exit(): void {
    this.router.navigate(['/assessment/frontoffice/quiz']);
  }

  ngOnDestroy(): void {
    if (this.timerSub) this.timerSub.unsubscribe();
    if (this.pollSub) this.pollSub.unsubscribe();
    if (this.wsSub) this.wsSub.unsubscribe();
  }
}
