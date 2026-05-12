import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AssessmentExamService, AssessmentAttempt } from '../../../backoffice/services/assessment-exam.service';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-mes-notes-examen',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="header-left">
          <h1>📋 Mes Notes d'Examens</h1>
          <p>Résultats de vos examens et téléchargement des certificats</p>
        </div>
        <div class="header-actions">
          <button class="btn-refresh" (click)="reload()" [disabled]="loading">
            {{ loading ? '⏳' : '🔄' }} Rafraîchir
          </button>
          <a routerLink="/assessment/frontoffice/mes-resultats" class="btn-back">← Mes résultats</a>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading" *ngIf="loading">
        <span class="spinner">⏳</span> Chargement de vos notes…
      </div>

      <ng-container *ngIf="!loading">

        <!-- Error state -->
        <div class="error-banner" *ngIf="error">
          {{ error }}
          <button class="btn-retry" (click)="reload()">Réessayer</button>
        </div>

        <!-- Stats Banner -->
        <div class="stats-banner" *ngIf="attempts.length > 0">
          <div class="stat-item">
            <span class="stat-num">{{ attempts.length }}</span>
            <span class="stat-lbl">Examens passés</span>
          </div>
          <div class="stat-item">
            <span class="stat-num green">{{ passCount }}</span>
            <span class="stat-lbl">Réussis ✅</span>
          </div>
          <div class="stat-item">
            <span class="stat-num">{{ passRate }}%</span>
            <span class="stat-lbl">Taux de réussite</span>
          </div>
          <div class="stat-item">
            <span class="stat-num blue">{{ passCount }}</span>
            <span class="stat-lbl">Certificats 🏅</span>
          </div>
        </div>

        <!-- Empty state -->
        <div class="empty" *ngIf="attempts.length === 0 && !error">
          <div class="empty-icon">📋</div>
          <p>Vous n'avez pas encore de notes d'examens.</p>
          <p class="empty-sub">L'admin n'a pas encore saisi vos résultats.</p>
          <button class="btn-refresh mt" (click)="reload()">🔄 Rafraîchir</button>
        </div>

        <!-- Attempts list -->
        <div class="cards-grid" *ngIf="attempts.length > 0">
          <div class="attempt-card" *ngFor="let a of attempts"
            [class.card-pass]="a.passed" [class.card-fail]="!a.passed">

            <div class="card-top">
              <div class="exam-info">
                <h3 class="exam-name">{{ a.exam.title || ('Examen #' + a.exam.id) }}</h3>
                <span class="exam-date">{{ formatDate(a.date) }}</span>
              </div>
              <div class="result-badge" [class.badge-pass]="a.passed" [class.badge-fail]="!a.passed">
                {{ a.passed ? '✅ Réussi' : '❌ Échoué' }}
              </div>
            </div>

            <div class="score-section">
              <div class="score-label">
                <span>Score obtenu</span>
                <span class="score-value" [class.score-green]="a.passed" [class.score-red]="!a.passed">
                  {{ a.score }}/100
                </span>
              </div>
              <div class="score-bar-bg">
                <div class="score-bar-fill"
                  [style.width.%]="a.score"
                  [class.bar-pass]="a.passed"
                  [class.bar-fail]="!a.passed">
                </div>
              </div>
              <div class="score-meta">
                Seuil de réussite : <strong>{{ a.exam.passingScore ?? 50 }}/100</strong>
              </div>
            </div>

            <div class="card-footer">
              <button class="btn-cert" *ngIf="a.passed" (click)="downloadCert(a)" [disabled]="certLoading[a.id!]">
                <span>{{ certLoading[a.id!] ? '⏳' : '🏅' }}</span>
                {{ certLoading[a.id!] ? 'Génération…' : 'Télécharger mon certificat PDF' }}
              </button>
              <div class="no-cert" *ngIf="!a.passed">
                💡 Score insuffisant — continuez vos efforts !
              </div>
            </div>

          </div>
        </div>

      </ng-container>
    </div>
  `,
  styles: [`
    .page { max-width: 900px; margin: 0 auto; padding: 2rem; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:2rem; flex-wrap:wrap; gap:1rem; }
    .page-header h1 { margin:0 0 0.25rem; font-size:1.75rem; color:#2d5757; }
    .page-header p  { margin:0; color:#64748b; font-size:0.9rem; }
    .header-actions { display:flex; gap:0.75rem; align-items:center; flex-wrap:wrap; }
    .btn-back { padding:0.6rem 1.2rem; background:#f1f5f9; border-radius:10px; text-decoration:none; color:#475569; font-weight:600; font-size:0.88rem; }
    .btn-refresh { padding:0.6rem 1.2rem; background:linear-gradient(135deg,#2d5757,#1a4a4a); color:#fff; border:none; border-radius:10px; font-weight:700; font-size:0.88rem; cursor:pointer; transition:opacity 0.2s; }
    .btn-refresh:disabled { opacity:0.6; cursor:wait; }
    .btn-refresh.mt { margin-top:1rem; }
    .btn-retry { margin-left:1rem; padding:0.3rem 0.8rem; background:#fff; border:1px solid #dc2626; color:#dc2626; border-radius:8px; cursor:pointer; font-size:0.82rem; }
    .loading { text-align:center; padding:4rem; color:#64748b; font-size:1.1rem; }
    .spinner { margin-right:0.5rem; }
    .error-banner { background:#fef2f2; border:1px solid #fecaca; color:#dc2626; padding:1rem 1.25rem; border-radius:12px; margin-bottom:1.5rem; display:flex; align-items:center; }

    .stats-banner { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:2rem; }
    .stat-item { background:#fff; border-radius:14px; box-shadow:0 2px 12px rgba(0,0,0,0.06); padding:1.25rem; text-align:center; border:1px solid #f1f5f9; }
    .stat-num { display:block; font-size:1.8rem; font-weight:800; color:#2d5757; }
    .stat-num.green { color:#16a34a; }
    .stat-num.blue  { color:#2563eb; }
    .stat-lbl { font-size:0.78rem; color:#94a3b8; }

    .empty { text-align:center; padding:4rem 2rem; background:#f8fafc; border-radius:20px; border:2px dashed #e2e8f0; }
    .empty-icon { font-size:3rem; margin-bottom:1rem; }
    .empty p { margin:0 0 0.5rem; color:#64748b; font-size:1rem; }
    .empty-sub { color:#94a3b8 !important; font-size:0.88rem !important; }

    .cards-grid { display:flex; flex-direction:column; gap:1.25rem; }
    .attempt-card { background:#fff; border-radius:18px; box-shadow:0 4px 20px rgba(0,0,0,0.07); padding:1.5rem; border:2px solid transparent; transition:transform 0.2s; }
    .attempt-card:hover { transform:translateY(-2px); }
    .card-pass { border-color:#86efac; }
    .card-fail { border-color:#fca5a5; }

    .card-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.25rem; gap:1rem; }
    .exam-name { margin:0 0 0.25rem; font-size:1.1rem; font-weight:800; color:#0f172a; }
    .exam-date { font-size:0.82rem; color:#94a3b8; }
    .result-badge { padding:0.3rem 0.9rem; border-radius:20px; font-size:0.82rem; font-weight:700; white-space:nowrap; }
    .badge-pass { background:#f0fdf4; color:#16a34a; border:1px solid #86efac; }
    .badge-fail { background:#fef2f2; color:#dc2626; border:1px solid #fca5a5; }

    .score-section { margin-bottom:1.25rem; }
    .score-label { display:flex; justify-content:space-between; margin-bottom:0.5rem; font-size:0.88rem; color:#64748b; }
    .score-value { font-weight:800; font-size:1rem; }
    .score-green { color:#16a34a; }
    .score-red   { color:#dc2626; }
    .score-bar-bg { height:8px; background:#f1f5f9; border-radius:4px; overflow:hidden; margin-bottom:0.4rem; }
    .score-bar-fill { height:100%; border-radius:4px; transition:width 0.5s ease; }
    .bar-pass { background:linear-gradient(90deg,#16a34a,#4ade80); }
    .bar-fail { background:linear-gradient(90deg,#dc2626,#f87171); }
    .score-meta { font-size:0.8rem; color:#94a3b8; }

    .card-footer { padding-top:1rem; border-top:1px solid #f1f5f9; }
    .btn-cert { display:flex; align-items:center; gap:0.5rem; padding:0.7rem 1.4rem; background:linear-gradient(135deg,#f59e0b,#d97706); color:#fff; border:none; border-radius:12px; font-weight:700; font-size:0.9rem; cursor:pointer; transition:opacity 0.2s; }
    .btn-cert:hover { opacity:0.9; }
    .btn-cert:disabled { opacity:0.6; cursor:wait; }
    .no-cert { color:#94a3b8; font-size:0.88rem; }

    @media (max-width:600px) { .stats-banner { grid-template-columns:repeat(2,1fr); } }
  `]
})
export class MesNotesExamenComponent implements OnInit {
  attempts: AssessmentAttempt[] = [];
  loading = true;
  error = '';
  certLoading: Record<number, boolean> = {};

  get passCount() { return this.attempts.filter(a => a.passed).length; }
  get passRate() {
    return this.attempts.length
      ? Math.round((this.passCount / this.attempts.length) * 100)
      : 0;
  }

  constructor(
    private svc: AssessmentExamService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.reload();
  }

  reload() {
    const userId = this.authService.getCurrentUser()?.id;
    if (!userId) {
      this.loading = false;
      this.error = 'Vous devez être connecté pour voir vos notes.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    this.svc.getAttemptsByUser(userId).subscribe({
      next: (a) => {
        this.attempts = a.sort((x, y) =>
          (y.date ?? '') > (x.date ?? '') ? 1 : -1
        );
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Impossible de charger vos notes. Vérifiez que le service est démarré.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  }

  downloadCert(attempt: AssessmentAttempt) {
    if (!attempt.id) return;
    this.certLoading[attempt.id] = true;
    this.cdr.detectChanges();

    this.svc.downloadCertificate(attempt.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificat_${(attempt.exam?.title ?? 'examen').replace(/\s+/g, '_')}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.certLoading[attempt.id!] = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.certLoading[attempt.id!] = false;
        this.cdr.detectChanges();
        alert('Erreur lors du téléchargement du certificat.');
      }
    });
  }
}
