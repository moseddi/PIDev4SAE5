import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { GameSession, Quiz } from '../../models/quiz.models';
import { GameSessionService } from '../../services/game-session.service';
import { QuizService } from '../../services/quiz.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-session-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="session-list-container">
      <div class="header-section">
        <div class="header-content">
          <h2 class="main-title">📡 Sessions de jeu Direct</h2>
          <p class="sub-title">Lancez et gérez vos quiz style Kahoot en temps réel</p>
        </div>
        <button (click)="openCreateModal()" class="btn-create-session">
          <span class="btn-icon">+</span>
          <span>Nouvelle Session</span>
        </button>
      </div>

      <!-- Error message if needed -->
      <div class="error-banner" *ngIf="errorMessage">
        <span>⚠️</span> {{ errorMessage }}
        <button (click)="errorMessage = ''" class="close-error">×</button>
      </div>

      <!-- Table des sessions -->
      <div class="card-table-container shadow-premium" *ngIf="sessions.length > 0; else emptyState">
        <table class="premium-table">
          <thead>
            <tr>
              <th><span class="th-label">CODE PIN</span></th>
              <th><span class="th-label">QUIZ</span></th>
              <th><span class="th-label">STATUT</span></th>
              <th><span class="th-label">DATE DE DÉBUT</span></th>
              <th class="text-right"><span class="th-label">ACTIONS</span></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let session of sessions" class="table-row-hover">
              <td>
                <div class="pin-badge">
                   {{ session.gamePin || '—' }}
                </div>
              </td>
              <td>
                <div class="quiz-info">
                   <span class="quiz-icon">🎯</span>
                   <span class="quiz-title-cell">{{ getQuizTitle(session) }}</span>
                </div>
              </td>
              <td>
                <span class="status-pill" [ngClass]="getStatusClass(session.status)">
                  <span class="status-dot"></span>
                  {{ session.status }}
                </span>
              </td>
              <td class="date-cell">
                {{ session.startTime | date:'dd MMM yyyy · HH:mm' }}
              </td>
              <td class="actions-cell">
                <button (click)="goToControl(session)" class="btn-action btn-control-game" title="Lancer la salle de contrôle">
                  🎮 Contrôler
                </button>
                <button (click)="confirmDelete(session)" class="btn-action btn-delete-game" title="Supprimer la session">
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <ng-template #emptyState>
        <div class="empty-state-card shadow-premium">
          <div class="empty-illustration">📡</div>
          <h3>Aucune session pour le moment</h3>
          <p>Créez une nouvelle session pour commencer à jouer avec vos étudiants en direct.</p>
          <button (click)="openCreateModal()" class="btn-create-session">
            Lancer un quiz maintenant
          </button>
        </div>
      </ng-template>

      <!-- Modal confirmation suppression -->
      <div class="modal-backdrop" *ngIf="sessionToDelete" (click)="sessionToDelete = null">
        <div class="modal-card modal-danger" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="danger-icon-circle">🗑️</div>
            <h3>Supprimer la session ?</h3>
          </div>
          <div class="modal-body">
            <p>Voulez-vous vraiment supprimer la session <strong>{{ sessionToDelete.gamePin }}</strong> ?</p>
            <p class="danger-warning">Cette action est irréversible et déconnectera tous les participants.</p>
          </div>
          <div class="modal-footer">
            <button (click)="sessionToDelete = null" class="btn-secondary">Annuler</button>
            <button (click)="deleteSession()" class="btn-danger-confirm" [disabled]="isDeleting">
              {{ isDeleting ? 'Suppression...' : 'Supprimer définitivement' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Modal de création de session -->
      <div class="modal-backdrop" *ngIf="showCreateModal" (click)="showCreateModal = false">
        <div class="modal-card modal-create" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-icon-circle">🚀</div>
            <h3>Démarrer une Session Direct</h3>
          </div>
          
          <div class="modal-body">
            <div *ngIf="!quizzesLoaded" class="loading-quizzes">
              <div class="small-spinner"></div>
              <span>Récupération de vos quizzes...</span>
            </div>

            <div class="quiz-selection-field" *ngIf="quizzesLoaded">
              <label class="field-label">Choisissez un Quiz à lancer</label>
              <div class="select-wrapper">
                <select [(ngModel)]="selectedQuizId" class="premium-select">
                  <option [ngValue]="null">-- Cliquez pour sélectionner --</option>
                  <option *ngFor="let q of quizzes" [ngValue]="q.id">
                    {{ q.title }} ({{ q.questions?.length || 0 }} questions)
                  </option>
                </select>
              </div>
              
              <div class="no-quiz-warning" *ngIf="quizzes.length === 0">
                ⚠️ Vous n'avez pas encore de quiz créé. 
                <a routerLink="/backoffice/quizzes" class="link-text">Créez-en un ici</a> d'abord.
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button (click)="showCreateModal = false" class="btn-secondary">Annuler</button>
            <button (click)="createSession()" class="btn-primary-confirm"
                    [disabled]="selectedQuizId === null || isLoading">
              {{ isLoading ? 'Lancement en cours...' : 'Créer & Ouvrir le Lobby' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { --primary-green: #2D5757; --accent-beige: #F7EDE2; display: block; }
    .session-list-container { max-width: 1100px; margin: 0 auto; animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .header-section { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2.5rem; gap: 1rem; flex-wrap: wrap; }
    .main-title { font-size: 2rem; font-weight: 800; color: var(--primary-green); margin: 0 0 0.5rem; }
    .sub-title { font-size: 1.05rem; color: var(--primary-green); opacity: 0.7; margin: 0; }

    .btn-create-session {
      background: linear-gradient(135deg, var(--primary-green), #1a3a3a);
      color: var(--accent-beige);
      border: none;
      padding: 0.8rem 1.8rem;
      border-radius: 14px;
      font-weight: 700;
      font-size: 1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      box-shadow: 0 8px 24px rgba(45, 87, 87, 0.25);
    }
    .btn-create-session:hover { transform: translateY(-3px); box-shadow: 0 12px 30px rgba(45, 87, 87, 0.35); filter: brightness(1.1); }
    .btn-icon { font-size: 1.4rem; font-weight: 400; line-height: 1; }

    .card-table-container { background: #fff; border-radius: 20px; overflow: hidden; border: 1px solid rgba(45, 87, 87, 0.1); }
    .shadow-premium { box-shadow: 0 15px 40px rgba(45, 87, 87, 0.08); }

    .premium-table { width: 100%; border-collapse: collapse; text-align: left; }
    .premium-table th { padding: 1.25rem 1.5rem; background: #fafafa; border-bottom: 2px solid #f0f0f0; }
    .th-label { font-size: 0.75rem; font-weight: 800; color: var(--primary-green); opacity: 0.5; text-transform: uppercase; letter-spacing: 0.1em; }
    .premium-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f5f5f5; vertical-align: middle; }
    .table-row-hover:hover { background-color: rgba(247, 237, 226, 0.3); }

    .pin-badge { 
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--primary-green);
      background: var(--accent-beige);
      padding: 0.4rem 0.8rem;
      border-radius: 8px;
      border: 1px dashed rgba(45, 87, 87, 0.3);
      display: inline-block;
      letter-spacing: 1px;
    }

    .quiz-info { display: flex; align-items: center; gap: 0.75rem; }
    .quiz-icon { font-size: 1.25rem; }
    .quiz-title-cell { font-weight: 700; color: #1a1a1a; font-size: 1rem; }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.9rem;
      border-radius: 99px;
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .status-dot { width: 6px; height: 6px; border-radius: 50%; }
    
    .waiting { background: #fef9c3; color: #854d0e; }
    .waiting .status-dot { background: #eab308; }
    
    .started { background: #dcfce7; color: #166534; }
    .started .status-dot { background: #22c55e; animation: pulse-green 2s infinite; }
    @keyframes pulse-green { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }

    .finished { background: #f1f5f9; color: #475569; }
    .finished .status-dot { background: #94a3b8; }

    .date-cell { font-size: 0.88rem; color: #64748b; font-weight: 500; }
    
    .actions-cell { display: flex; justify-content: flex-end; gap: 0.75rem; }
    .btn-action {
      padding: 0.55rem 1rem;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid transparent;
    }
    .btn-control-game { 
      background: var(--primary-green); 
      color: white;
      box-shadow: 0 4px 12px rgba(45, 87, 87, 0.2);
    }
    .btn-control-game:hover { background: #1a3a3a; transform: scale(1.03); }
    
    .btn-delete-game { 
      background: #fff; 
      color: #ef4444; 
      border-color: #fee2e2;
    }
    .btn-delete-game:hover { background: #fef2f2; border-color: #fca5a5; }

    .empty-state-card {
      padding: 5rem 3rem;
      background: white;
      border-radius: 24px;
      text-align: center;
      color: var(--primary-green);
      display: flex;
      flex-direction: column;
      align-items: center;
      border: 1px solid rgba(45, 87, 87, 0.1);
    }
    .empty-illustration { font-size: 5rem; margin-bottom: 2rem; filter: saturate(0.5) opacity(0.5); }
    .empty-state-card h3 { font-size: 1.5rem; font-weight: 800; margin: 0 0 0.75rem; }
    .empty-state-card p { font-size: 1.1rem; opacity: 0.7; max-width: 450px; margin: 0 0 2rem; }

    /* Modals */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(14, 28, 28, 0.4);
      backdrop-filter: blur(8px);
      z-index: 1000; display: flex; align-items: center; justify-content: center;
      padding: 1.5rem;
    }
    .modal-card {
      background: white; border-radius: 24px; width: 100%; max-width: 480px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      animation: modalSlideUp 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
    }
    @keyframes modalSlideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    .modal-header { padding: 2rem 2rem 1.5rem; text-align: center; }
    .modal-icon-circle { 
      width: 64px; height: 64px; border-radius: 20px;
      background: var(--accent-beige); color: var(--primary-green);
      font-size: 2rem; display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1.25rem;
    }
    .danger-icon-circle {
      width: 64px; height: 64px; border-radius: 20px;
      background: #fee2e2; color: #dc2626;
      font-size: 2rem; display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1.25rem;
    }
    .modal-header h3 { margin: 0; font-size: 1.4rem; font-weight: 900; color: var(--primary-green); }

    .modal-body { padding: 0 2rem 1.5rem; }
    .modal-body p { margin: 0 0 1rem; color: #475569; line-height: 1.6; }
    .danger-warning { font-size: 0.9rem; padding: 0.75rem; background: #fff1f2; border-radius: 10px; color: #be123c; font-weight: 600; }

    .quiz-selection-field { display: flex; flex-direction: column; gap: 0.75rem; }
    .field-label { font-weight: 700; font-size: 0.95rem; color: var(--primary-green); }
    .premium-select {
      width: 100%; padding: 1rem 1.25rem; border-radius: 12px;
      border: 2px solid #e2e8f0; font-size: 1rem; font-weight: 600;
      color: #1a1a1a; cursor: pointer; appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%232D5757'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 1.25rem center; background-size: 1.25rem;
      transition: all 0.2s;
    }
    .premium-select:focus { outline: none; border-color: var(--primary-green); box-shadow: 0 0 0 4px rgba(45, 87, 87, 0.1); }
    
    .small-spinner { width: 18px; height: 18px; border: 2px solid rgba(45, 87, 87, 0.2); border-top-color: var(--primary-green); border-radius: 50%; animation: spin 0.6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .loading-quizzes { display: flex; align-items: center; gap: 1rem; color: var(--primary-green); padding: 1rem; border-radius: 12px; background: var(--accent-beige); font-weight: 600; }

    .modal-footer { padding: 1.5rem 2rem 2rem; display: flex; gap: 1rem; }
    .btn-secondary { flex: 1; padding: 0.85rem; border-radius: 14px; border: 1px solid #e2e8f0; background: #fff; font-weight: 700; color: #64748b; cursor: pointer; transition: all 0.2s; }
    .btn-secondary:hover { background: #f8fafc; color: #1e293b; }

    .btn-primary-confirm { 
      flex: 2; padding: 0.85rem; border-radius: 14px; border: none;
      background: var(--primary-green); color: white; font-weight: 700;
      cursor: pointer; transition: all 0.2s;
    }
    .btn-primary-confirm:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.1); box-shadow: 0 10px 20px -5px rgba(45, 87, 87, 0.3); }
    .btn-primary-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-danger-confirm {
      flex: 2; padding: 0.85rem; border-radius: 14px; border: none;
      background: #ef4444; color: white; font-weight: 700;
      cursor: pointer; transition: all 0.2s;
    }
    .btn-danger-confirm:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(239, 68, 68, 0.3); }

    .error-banner { 
      background: #fff1f2; border: 1px solid #fecaca; color: #be123c; 
      padding: 1rem 1.5rem; border-radius: 14px; margin-bottom: 2rem; 
      display: flex; align-items: center; gap: 0.75rem; animation: shake 0.5s ease-in-out;
    }
    @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
    .close-error { margin-left: auto; background: none; border: none; font-size: 1.5rem; color: #f87171; cursor: pointer; padding: 0 0.5rem; }
    .text-right { text-align: right; }
    .link-text { color: var(--primary-green); font-weight: 700; text-decoration: underline; }
  `]
})
export class SessionListComponent implements OnInit {
  sessions: GameSession[] = [];
  quizzes: Quiz[] = [];
  showCreateModal = false;
  selectedQuizId: number | null = null;
  quizzesLoaded = false;
  isLoading = false;
  sessionToDelete: GameSession | null = null;
  isDeleting = false;
  errorMessage = '';

  constructor(
    private sessionService: GameSessionService,
    private quizService: QuizService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadSessions();
    this.loadQuizzes();
  }

  loadSessions(): void {
    this.sessionService.getAllSessions().subscribe({
      next: (data) => {
        this.sessions = data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Impossible de charger les sessions.';
        this.cdr.detectChanges();
      }
    });
  }

  loadQuizzes(): void {
    this.quizService.getAllQuizzes().subscribe({
      next: (data) => {
        this.quizzes = data;
        this.quizzesLoaded = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.quizzes = [];
        this.quizzesLoaded = true;
        this.errorMessage = 'Erreur lors de la récupération des quizzes.';
        this.cdr.detectChanges();
      }
    });
  }

  openCreateModal(): void {
    this.showCreateModal = true;
    this.errorMessage = '';
    if (!this.quizzesLoaded) {
      this.loadQuizzes();
    }
  }

  createSession(): void {
    if (this.selectedQuizId === null || this.isLoading) return;
    this.isLoading = true;
    this.errorMessage = '';

    this.sessionService.createSession(this.selectedQuizId).subscribe({
      next: (session) => {
        this.isLoading = false;
        this.showCreateModal = false;
        this.selectedQuizId = null;
        // Rediriger directement vers la salle de contrôle
        this.router.navigate(['/backoffice/game-sessions', session.id, 'control']);
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Erreur lors de la création de la session.';
        this.cdr.detectChanges();
      }
    });
  }

  goToControl(session: GameSession): void {
    if (!session.id) return;
    this.router.navigate(['/backoffice/game-sessions', session.id, 'control']);
  }

  confirmDelete(session: GameSession): void {
    this.sessionToDelete = session;
  }

  deleteSession(): void {
    if (!this.sessionToDelete?.id || this.isDeleting) return;
    this.isDeleting = true;
    this.sessionService.deleteSession(this.sessionToDelete.id).subscribe({
      next: () => {
        this.sessions = this.sessions.filter(s => s.id !== this.sessionToDelete!.id);
        this.sessionToDelete = null;
        this.isDeleting = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isDeleting = false;
        this.errorMessage = 'Erreur lors de la suppression.';
        this.cdr.detectChanges();
      }
    });
  }

  getQuizTitle(session: GameSession): string {
    if (session.quiz?.title) return session.quiz.title;
    const found = this.quizzes.find(q => q.id === session.quizId);
    return found?.title || `Quiz #${session.quizId ?? '?'}`;
  }

  getStatusClass(status: string): string {
    return status?.toLowerCase() === 'waiting' ? 'waiting'
      : status?.toLowerCase() === 'started' ? 'started'
        : 'finished';
  }
}
