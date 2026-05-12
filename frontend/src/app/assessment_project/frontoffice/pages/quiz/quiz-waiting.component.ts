import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GameSession, GameStatus, Quiz } from '../../../backoffice/models/quiz.models';
import { GameSessionService } from '../../../backoffice/services/game-session.service';
import { Subscription, interval } from 'rxjs';

interface Player {
  id: number;
  name: string;
  isReady: boolean;
  avatar: string;
}

@Component({
  selector: 'app-quiz-waiting',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="waiting-page">
      <div class="background-decor">
        <div class="shape s1">▲</div>
        <div class="shape s2">●</div>
        <div class="shape s3">◆</div>
        <div class="shape s4">■</div>
      </div>

      <div class="waiting-container" *ngIf="session">
        <!-- Room Info -->
        <div class="room-card">
          <div class="room-header">
            <span class="room-badge">SALLE D'ATTENTE</span>
            <h1 class="room-title">{{ session.quiz.title }}</h1>
            <div class="room-pin">
                <span class="pin-label">ID SESSION</span>
                <span class="pin-value">{{ session.id }}</span>
            </div>
          </div>
          
          <div class="room-status">
            <div class="status-indicator" [class.active]="connectedPlayers > 0"></div>
            <span>{{ connectedPlayers }} {{ connectedPlayers > 1 ? 'Joueurs connectés' : 'Joueur connecté' }}</span>
          </div>
        </div>

        <!-- Players Grid -->
        <div class="players-section">
          <div class="section-header">
            <h3>Joueurs dans la salle</h3>
            <div class="ready-count">{{ readyCount }}/{{ connectedPlayers }} Prêts</div>
          </div>
          
          <div class="players-grid">
            <div class="player-card" *ngFor="let player of players" [class.ready]="player.isReady">
              <div class="player-avatar">{{ player.avatar }}</div>
              <div class="player-name">{{ player.name }}</div>
              <div class="player-ready-badge" *ngIf="player.isReady">PRÊT !</div>
            </div>
            
            <!-- Empty slots -->
            <div class="player-card empty" *ngFor="let i of [1,2,3]">
              <div class="player-avatar">?</div>
              <div class="player-name">En attente...</div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="actions-section">
          <button (click)="toggleReady()" class="btn-ready" [class.ready]="isReady">
            <span class="ready-icon">{{ isReady ? '✅' : '🎮' }}</span>
            {{ isReady ? 'JE SUIS PRÊT !' : 'PRÊT ?' }}
          </button>
          
          <button (click)="leaveSession()" class="btn-leave">
            Quitter la salle
          </button>
        </div>

        <!-- Countdown Overlay -->
        <div class="countdown-overlay" *ngIf="isStarting">
          <div class="countdown-content">
            <span class="countdown-label">C'est parti dans...</span>
            <div class="countdown-value">{{ countdown }}</div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="!session">
        <div class="kahoot-loader">
            <div class="dot d1"></div>
            <div class="dot d2"></div>
            <div class="dot d3"></div>
        </div>
        <p>Connexion à la salle...</p>
      </div>
    </div>
  `,
  styles: [`
    .waiting-page {
      min-height: 100vh;
      background: #2D5757;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      position: relative;
      overflow: hidden;
      color: white;
    }

    .background-decor .shape {
      position: absolute;
      opacity: 0.1;
      font-size: 15rem;
      pointer-events: none;
    }
    .s1 { top: -5%; left: -5%; color: #dc2626; transform: rotate(15deg); }
    .s2 { bottom: -5%; right: -5%; color: #26890c; transform: rotate(-15deg); }
    .s3 { top: 40%; right: -5%; color: #1368ce; transform: rotate(45deg); }
    .s4 { bottom: 10%; left: -5%; color: #d89e00; transform: rotate(-30deg); }

    .waiting-container {
      width: 100%;
      max-width: 900px;
      z-index: 10;
    }

    .room-card {
      background: white;
      border-radius: 30px;
      padding: 3rem;
      color: #2D5757;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      margin-bottom: 2rem;
    }

    .room-badge {
      background: #dc2626;
      color: white;
      padding: 0.5rem 1.5rem;
      border-radius: 20px;
      font-weight: 800;
      font-size: 0.8rem;
      letter-spacing: 1px;
    }

    .room-title { font-size: 3rem; font-weight: 900; margin: 1.5rem 0; }

    .room-pin {
      display: inline-flex;
      flex-direction: column;
      background: #f0f0f0;
      padding: 1rem 3rem;
      border-radius: 20px;
      border: 2px dashed #2D5757;
    }
    .pin-label { font-size: 0.8rem; font-weight: 700; opacity: 0.8; }
    .pin-value { font-size: 2.5rem; font-weight: 900; letter-spacing: 5px; }

    .room-status { margin-top: 1.5rem; display: flex; align-items: center; justify-content: center; gap: 0.75rem; font-weight: 700; }
    .status-indicator { width: 12px; height: 12px; border-radius: 50%; background: #ccc; }
    .status-indicator.active { background: #26890c; box-shadow: 0 0 10px #26890c; }

    .players-section { background: rgba(255,255,255,0.1); padding: 2rem; border-radius: 30px; border: 2px solid rgba(255,255,255,0.1); margin-bottom: 2rem; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .ready-count { background: #26890c; padding: 0.5rem 1rem; border-radius: 12px; font-weight: 800; }

    .players-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1.5rem; }
    .player-card {
      background: white; border-radius: 20px; padding: 1.5rem; color: #2D5757; text-align: center;
      transition: 0.3s; position: relative;
    }
    .player-card.ready { background: #26890c; color: white; transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
    .player-card.empty { opacity: 0.3; background: transparent; border: 2px dashed white; color: white; }
    .player-avatar { font-size: 3rem; margin-bottom: 0.5rem; }
    .player-name { font-weight: 800; font-size: 1.1rem; }
    .player-ready-badge { font-size: 0.7rem; font-weight: 900; margin-top: 0.5rem; }

    .actions-section { display: flex; gap: 1.5rem; }
    .btn-ready {
      flex: 2; padding: 1.5rem; border-radius: 20px; background: white; color: #2D5757;
      font-size: 1.5rem; font-weight: 900; border: none; cursor: pointer; transition: 0.3s;
    }
    .btn-ready.ready { background: #26890c; color: white; }
    .btn-ready:hover { transform: scale(1.02); }
    .btn-leave { flex: 1; border: 2px solid white; background: transparent; color: white; border-radius: 20px; font-weight: 800; cursor: pointer; }

    .countdown-overlay {
      position: fixed; inset: 0; background: #2D5757; display: flex; align-items: center; justify-content: center; z-index: 100;
    }
    .countdown-content { text-align: center; }
    .countdown-label { font-size: 2rem; font-weight: 800; }
    .countdown-value { font-size: 12rem; font-weight: 900; animation: pulse 1s infinite; }
    @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.1); } 100% { transform: scale(1); } }
  `]
})
export class QuizWaitingComponent implements OnInit, OnDestroy {
  session: GameSession | null = null;
  players: Player[] = [
    { id: 1, name: 'Toi (Invité)', avatar: '🦊', isReady: false }
  ];
  isReady = false;
  connectedPlayers = 1;
  readyCount = 0;
  isStarting = false;
  countdown = 5;
  private statusPoll?: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sessionService: GameSessionService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSession(+id);
      this.statusPoll = setInterval(() => this.loadSession(+id), 5000);
    }
  }

  ngOnDestroy(): void {
    if (this.statusPoll) clearInterval(this.statusPoll);
  }

  private loadSession(id: number): void {
    this.sessionService.getSessionById(id).subscribe({
      next: (session: GameSession) => {
        this.session = session;
        if (session.status === GameStatus.IN_PROGRESS && !this.isStarting) {
          this.startCountdown();
        }
        this.cdr.detectChanges();
      }
    });
  }

  toggleReady(): void {
    this.isReady = !this.isReady;
    this.players[0].isReady = this.isReady;
    this.readyCount = this.players.filter(p => p.isReady).length;

    if (this.isReady && !this.isStarting) {
      // En mode démo, on démarre si le joueur est prêt
      this.startCountdown();
    }
    this.cdr.detectChanges();
  }

  private startCountdown(): void {
    this.isStarting = true;
    const interval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(interval);
        this.router.navigate(['/assessment/frontoffice/quiz/play', this.session?.id]);
      }
      this.cdr.detectChanges();
    }, 1000);
  }

  leaveSession(): void {
    this.router.navigate(['/assessment/frontoffice/quiz']);
  }
}
