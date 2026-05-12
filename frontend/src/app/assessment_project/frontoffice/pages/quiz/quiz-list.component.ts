import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Quiz } from '../../../backoffice/models/quiz.models';
import { QuizService } from '../../../backoffice/services/quiz.service';

@Component({
  selector: 'app-quiz-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="quiz-page">
      <div class="page-header">
        <div class="header-content">
            <h1 class="page-title">🎯 Quiz Interactifs</h1>
            <p class="page-sub">Joue seul ou rejoins une session live avec d'autres joueurs !</p>
        </div>

        <!-- Bannière Session Live -->
        <div class="live-banner" (click)="goLive()">
          <div class="live-dot"></div>
          <span class="live-label">LIVE</span>
          <span class="live-text">Tu as un code PIN ? Rejoins une session en direct</span>
          <span class="live-arrow">→</span>
        </div>
      </div>

      <!-- Filters/Search -->
      <div class="filters" *ngIf="!loading && availableQuizzes.length > 0">
          <div class="filter-pill active">Tous les Quizzes</div>
          <div class="filter-pill">Nouveautés</div>
          <div class="filter-pill">Populaires</div>
      </div>

      <!-- Quiz Grid -->
      <div class="quiz-grid" *ngIf="availableQuizzes.length > 0">
        <div class="quiz-card" *ngFor="let quiz of availableQuizzes; let i = index" [style.animation-delay]="i * 0.1 + 's'">
          <div class="quiz-image-placeholder" [class]="'bg-' + (i % 4)">
            <span class="icon">🎮</span>
            <div class="q-count">{{ quiz.questions?.length || 0 }} Questions</div>
          </div>
          
          <div class="quiz-content">
            <h3 class="quiz-title">{{ quiz.title || 'Quiz sans titre' }}</h3>
            <p class="quiz-description">{{ quiz.description || 'Apprends en t\\'amusant avec ce quiz interactif.' }}</p>
            
            <div class="quiz-footer">
              <div class="quiz-meta">
                <span class="meta-item">⏱️ {{ getTotalTime(quiz) }}s</span>
              </div>
              <button (click)="joinQuiz(quiz)" class="btn-play" [disabled]="joining">
                {{ joining ? 'Chargement...' : '🎮 Jouer Solo' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="availableQuizzes.length === 0 && !loading">
        <div class="empty-illustration">🕹️</div>
        <h3>Oups ! Aucun quiz n'est prêt.</h3>
        <p>Les administrateurs sont en train d'en préparer de nouveaux. Reviens vite !</p>
      </div>

      <!-- Loading State -->
      <div class="loading-overlay" *ngIf="loading">
        <div class="kahoot-loader">
            <div class="dot d1"></div>
            <div class="dot d2"></div>
            <div class="dot d3"></div>
            <div class="dot d4"></div>
        </div>
        <p>Préparation du terrain...</p>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --primary-color: #2D5757;
      --secondary-color: #F7EDE2;
      --accent-color: #26890c;
      --error-color: #dc2626;
      --white: #ffffff;
    }

    .quiz-page {
      min-height: 100vh;
      background: linear-gradient(135deg, var(--secondary-color) 0%, rgba(45, 87, 87, 0.05) 100%);
      padding: 3rem 1rem;
      font-family: 'Open Sans', 'Montserrat', sans-serif;
      position: relative;
    }

    .page-header {
      text-align: center;
      margin-bottom: 3rem;
      color: var(--primary-color);
      position: relative;
      z-index: 1;
    }

    .page-title {
      font-size: 3.5rem;
      font-weight: 900;
      margin: 0 0 1rem 0;
      background: linear-gradient(135deg, var(--primary-color), #1a3a3a);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .page-sub {
      font-size: 1.2rem;
      margin: 0 0 1.5rem 0;
      opacity: 0.8;
      font-weight: 600;
    }

    .live-banner {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      background: linear-gradient(135deg, #dc2626, #b91c1c);
      color: white;
      padding: 0.85rem 1.75rem;
      border-radius: 50px;
      cursor: pointer;
      font-weight: 700;
      font-size: 1rem;
      box-shadow: 0 6px 20px rgba(220, 38, 38, 0.35);
      transition: all 0.3s ease;
      margin-top: 0.5rem;
    }
    .live-banner:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 28px rgba(220, 38, 38, 0.45);
    }
    .live-dot {
      width: 10px; height: 10px; background: white;
      border-radius: 50%; animation: blink 1s infinite;
    }
    .live-label {
      font-size: 0.75rem; font-weight: 900; letter-spacing: 2px;
      background: rgba(255,255,255,0.25); padding: 0.2rem 0.5rem; border-radius: 6px;
    }
    .live-text { flex: 1; }
    .live-arrow { font-size: 1.2rem; }
    @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

    .filters {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 3rem;
      flex-wrap: wrap;
      position: relative;
      z-index: 1;
    }

    .filter-pill {
      padding: 0.75rem 1.5rem;
      background: rgba(255, 255, 255, 0.8);
      border: 2px solid rgba(45, 87, 87, 0.2);
      border-radius: 20px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      color: var(--primary-color);
    }

    .filter-pill.active {
      background: var(--primary-color);
      color: var(--secondary-color);
    }

    .quiz-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 2.5rem;
      max-width: 1400px;
      margin: 0 auto;
      position: relative;
      z-index: 1;
    }

    .quiz-card {
      background: white;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(45, 87, 87, 0.1);
      border: 2px solid rgba(45, 87, 87, 0.1);
      transition: all 0.3s ease;
    }

    .quiz-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 40px rgba(45, 87, 87, 0.2);
    }

    .quiz-image-placeholder {
      height: 180px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .bg-0 { background: linear-gradient(135deg, #2D5757, #1a3a3a); }
    .bg-1 { background: linear-gradient(135deg, #1368ce, #0e4a8c); }
    .bg-2 { background: linear-gradient(135deg, #dc2626, #b91c1c); }
    .bg-3 { background: linear-gradient(135deg, #26890c, #1a5c08); }

    .icon { font-size: 4rem; }

    .q-count {
      position: absolute;
      bottom: 1rem;
      right: 1rem;
      background: white;
      padding: 0.4rem 0.8rem;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.8rem;
      color: var(--primary-color);
    }

    .quiz-content { padding: 1.5rem; }
    .quiz-title { font-size: 1.4rem; font-weight: 800; color: var(--primary-color); margin-bottom: 0.5rem; }
    .quiz-description { color: var(--primary-color); opacity: 0.7; font-size: 0.95rem; margin-bottom: 1.5rem; }

    .quiz-footer { display: flex; justify-content: space-between; align-items: center; }
    .quiz-meta { font-weight: 700; color: var(--primary-color); opacity: 0.6; }

    .btn-play {
      padding: 0.75rem 1.5rem;
      background: var(--primary-color);
      color: var(--secondary-color);
      border: none;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .loading-overlay {
      position: fixed;
      inset: 0;
      background: rgba(45, 87, 87, 0.95);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      color: white;
    }

    .kahoot-loader { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
    .dot { width: 15px; height: 15px; border-radius: 50%; background: white; animation: bounce 1s infinite alternate; }
    .d2 { animation-delay: 0.2s; }
    .d3 { animation-delay: 0.4s; }
    .d4 { animation-delay: 0.6s; }
    @keyframes bounce { to { transform: translateY(-10px); } }

    .empty-state { text-align: center; padding: 4rem; color: var(--primary-color); }
    .empty-illustration { font-size: 4rem; margin-bottom: 1rem; }
  `]
})
export class QuizListComponent implements OnInit, OnDestroy {
  loading = true;
  availableQuizzes: Quiz[] = [];
  joining = false;
  private refreshInterval: any;

  constructor(
    private quizService: QuizService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadData();
    this.refreshInterval = setInterval(() => this.loadData(), 15000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  private loadData(): void {
    console.log('[QuizList] Début du chargement des données...');
    this.quizService.getAllQuizzes().subscribe({
      next: (quizzes) => {
        console.log('[QuizList] Quizzes reçus du service:', quizzes);

        // On affiche tous les quizzes pour voir ce qui arrive du backend
        this.availableQuizzes = quizzes;

        // Log de diagnostic pour chaque quiz
        quizzes.forEach(q => {
          console.log(`Quiz ID: ${q.id} | Titre: ${q.title} | Questions count: ${q.questions?.length || 0}`);
          if (q.questions && q.questions.length > 0) {
            console.log(`  -> Q1 Answers count: ${q.questions[0].answers?.length || 0}`);
          }
        });

        this.loading = false;
        this.cdr.detectChanges();
        console.log(`[QuizList] ${quizzes.length} quizzes chargés au total.`);
      },
      error: (err) => {
        console.error('[QuizList] Erreur lors du chargement des quizzes:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });

    // Fallback sécurité
    setTimeout(() => {
      if (this.loading) { this.loading = false; this.cdr.detectChanges(); }
    }, 6000);
  }

  joinQuiz(quiz: Quiz): void {
    if (this.joining) return;
    this.router.navigate(['/assessment/frontoffice/quiz/play', quiz.id]);
  }

  goLive(): void {
    this.router.navigate(['/assessment/frontoffice/quiz/live']);
  }

  getTotalTime(quiz: Quiz): number {
    if (!quiz.questions) return 0;
    return quiz.questions.reduce((sum, q) => sum + (q.timeLimit || 20), 0);
  }
}
