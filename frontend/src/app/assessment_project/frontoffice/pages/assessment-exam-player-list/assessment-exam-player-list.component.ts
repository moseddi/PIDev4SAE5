import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AssessmentExamService, AssessmentExam, AssessmentAttempt } from '../../../backoffice/services/assessment-exam.service';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-assessment-exam-player-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>📝 Examens disponibles</h1>
          <p>Sélectionnez un examen pour commencer</p>
        </div>
        <button class="btn-refresh" (click)="reload()" [disabled]="loading">
          {{ loading ? '⏳' : '🔄' }} Rafraîchir
        </button>
      </div>

      <div class="loading" *ngIf="loading">⏳ Chargement des examens…</div>

      <div class="empty" *ngIf="!loading && exams.length === 0">
        <div class="empty-icon">📋</div>
        <p>Aucun examen disponible pour le moment.</p>
        <button class="btn-refresh" (click)="reload()">🔄 Rafraîchir</button>
      </div>

      <div class="exams-grid" *ngIf="!loading && exams.length > 0">
        <div class="exam-card" *ngFor="let e of exams"
          [class.card-passed]="isExamPassed(e.id!)">
          <div class="card-badge">{{ e.examType }}</div>

          <!-- Already passed badge -->
          <div class="passed-badge" *ngIf="isExamPassed(e.id!)">
            ✅ Déjà réussi
          </div>

          <h3 class="card-title">{{ e.title }}</h3>
          <p class="card-desc" *ngIf="e.description">{{ e.description }}</p>

          <div class="card-meta">
            <div class="meta-item">
              <span class="meta-icon">⏱</span>
              <span>{{ e.duration }} min</span>
            </div>
            <div class="meta-item">
              <span class="meta-icon">🎯</span>
              <span>Seuil : {{ e.passingScore }}%</span>
            </div>
            <div class="meta-item">
              <span class="meta-icon">❓</span>
              <span>{{ e.questions?.length || '?' }} questions</span>
            </div>
          </div>

          <!-- Show score if already passed -->
          <div class="prev-score" *ngIf="getPassedAttempt(e.id!)">
            🏅 Votre score : <strong>{{ getPassedAttempt(e.id!)!.score }}%</strong>
          </div>

          <a *ngIf="!isExamPassed(e.id!)"
            [routerLink]="['/assessment/frontoffice/examens', e.id, 'passer']" class="btn-start">
            🚀 Passer l'examen
          </a>
          <div *ngIf="isExamPassed(e.id!)" class="btn-done">
            ✅ Vous avez déjà passé cet examen
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:2rem; flex-wrap:wrap; gap:1rem; }
    .page-header h1 { margin:0 0 0.25rem; font-size:1.75rem; color:#2d5757; }
    .page-header p  { margin:0; color:#64748b; font-size:0.9rem; }
    .btn-refresh { padding:0.6rem 1.2rem; background:linear-gradient(135deg,#2d5757,#1a4a4a); color:#fff; border:none; border-radius:10px; font-weight:700; font-size:0.88rem; cursor:pointer; }
    .btn-refresh:disabled { opacity:0.6; cursor:wait; }
    .loading { text-align:center; padding:4rem; color:#64748b; font-size:1.1rem; }
    .empty { text-align:center; padding:4rem 2rem; background:#f8fafc; border-radius:20px; border:2px dashed #e2e8f0; }
    .empty-icon { font-size:3rem; margin-bottom:1rem; }
    .empty p { color:#64748b; margin:0 0 1rem; }

    .exams-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:1.5rem; }
    .exam-card {
      background:#fff; border-radius:20px; box-shadow:0 4px 20px rgba(0,0,0,0.07);
      padding:1.75rem; border:2px solid #f1f5f9; position:relative; overflow:hidden;
      display:flex; flex-direction:column; transition:transform 0.2s, box-shadow 0.2s;
    }
    .exam-card:hover { transform:translateY(-4px); box-shadow:0 8px 30px rgba(45,87,87,0.12); }
    .exam-card.card-passed { border-color:#86efac; background:linear-gradient(135deg,#f0fdf4,#fff); }
    .card-badge {
      position:absolute; top:14px; right:14px;
      background:linear-gradient(135deg,#2d5757,#1a4a4a); color:#fff;
      padding:0.25rem 0.7rem; border-radius:8px; font-size:0.72rem; font-weight:700; text-transform:uppercase;
    }
    .passed-badge {
      background:linear-gradient(135deg,#dcfce7,#bbf7d0); color:#15803d;
      padding:0.4rem 0.9rem; border-radius:10px; font-size:0.82rem; font-weight:700;
      margin-bottom:0.75rem; display:inline-block; border:1px solid #86efac;
    }
    .card-title { margin:0 0 0.5rem; font-size:1.15rem; font-weight:800; color:#0f172a; padding-right:70px; }
    .card-desc { margin:0 0 1rem; color:#64748b; font-size:0.88rem; line-height:1.4; flex:1; }

    .card-meta { display:flex; gap:1rem; flex-wrap:wrap; margin-bottom:1rem; }
    .meta-item { display:flex; align-items:center; gap:0.35rem; font-size:0.82rem; color:#475569; font-weight:600; }
    .meta-icon { font-size:1rem; }

    .prev-score {
      background:#f0fdf4; border:1px solid #86efac; border-radius:10px;
      padding:0.5rem 0.8rem; margin-bottom:1rem; font-size:0.88rem; color:#15803d;
    }

    .btn-start {
      display:block; text-align:center; padding:0.85rem; border-radius:12px;
      background:linear-gradient(135deg,#2d5757,#1a3a3a); color:#fff;
      font-weight:700; font-size:0.95rem; text-decoration:none; transition:opacity 0.2s;
    }
    .btn-start:hover { opacity:0.9; }

    .btn-done {
      display:block; text-align:center; padding:0.85rem; border-radius:12px;
      background:#e2e8f0; color:#64748b; font-weight:700; font-size:0.88rem;
      cursor:default;
    }
  `]
})
export class AssessmentExamPlayerListComponent implements OnInit {
  exams: AssessmentExam[] = [];
  passedExamIds: Set<number> = new Set();
  userAttempts: AssessmentAttempt[] = [];
  loading = true;

  constructor(
    private svc: AssessmentExamService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() { this.reload(); }

  reload() {
    this.loading = true;
    this.cdr.detectChanges();

    this.svc.getExams().subscribe({
      next: (e) => {
        this.exams = e;
        this.loadUserAttempts();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadUserAttempts() {
    const userId = this.auth.getCurrentUser()?.id;
    if (!userId) {
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.svc.getAttemptsByUser(userId).subscribe({
      next: (attempts) => {
        this.userAttempts = attempts;
        this.passedExamIds = new Set(
          attempts
            .filter(a => a.passed)
            .map(a => a.exam?.id)
            .filter((id): id is number => id !== undefined)
        );
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  isExamPassed(examId: number): boolean {
    return this.passedExamIds.has(examId);
  }

  getPassedAttempt(examId: number): AssessmentAttempt | undefined {
    return this.userAttempts.find(a => a.exam?.id === examId && a.passed);
  }
}
