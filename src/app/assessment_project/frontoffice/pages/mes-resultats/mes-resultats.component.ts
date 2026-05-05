import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CertificationResult, Certificate } from '../../../backoffice/models/certification.models';
import { ResultService } from '../../../backoffice/services/result.service';
import { CertificateService } from '../../../backoffice/services/certificate.service';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-mes-resultats',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div class="header-left">
          <h1>📊 Mes résultats</h1>
          <p>Historique de vos examens et certificats obtenus</p>
        </div>
        <a routerLink="/assessment/frontoffice/certifications" class="btn-back">← Certifications</a>
      </div>

      <!-- Loading -->
      <div class="loading" *ngIf="loading">
        <span class="spinner">⏳</span> Chargement…
      </div>

      <ng-container *ngIf="!loading">

        <!-- ── Certificats ──────────────────────────────────────────────── -->
        <section class="section">
          <h2 class="section-title">🏆 Mes certificats</h2>

          <div class="empty" *ngIf="certificates.length === 0">
            Vous n'avez pas encore obtenu de certificat. Passez un examen pour en décrocher un !
          </div>

          <div class="certs-grid" *ngIf="certificates.length > 0">
            <div class="cert-card" *ngFor="let c of certificates">
              <div class="cert-ribbon">Certifié</div>
              <div class="cert-icon">🎓</div>
              <h3 class="cert-name">{{ c.certificateName }}</h3>
              <span class="cert-level level-{{ c.level.toLowerCase() }}">{{ c.level }}</span>
              <p class="cert-date">Obtenu le {{ formatDate(c.dateIssued) }}</p>
            </div>
          </div>
        </section>

        <!-- ── Résultats d'examens ─────────────────────────────────────── -->
        <section class="section">
          <h2 class="section-title">📋 Historique des examens</h2>

          <div class="empty" *ngIf="results.length === 0">
            Vous n'avez encore passé aucun examen.
            <a routerLink="/assessment/frontoffice/certifications" class="link">Commencer maintenant →</a>
          </div>

          <div class="results-table" *ngIf="results.length > 0">
            <!-- Summary row -->
            <div class="summary-row">
              <div class="summary-item">
                <span class="summary-num">{{ results.length }}</span>
                <span class="summary-label">Examens passés</span>
              </div>
              <div class="summary-item">
                <span class="summary-num green">{{ passedCount }}</span>
                <span class="summary-label">Réussis</span>
              </div>
              <div class="summary-item">
                <span class="summary-num">{{ passRate }}%</span>
                <span class="summary-label">Taux de réussite</span>
              </div>
            </div>

            <!-- Table -->
            <table class="table">
              <thead>
                <tr>
                  <th>Examen</th>
                  <th>Score</th>
                  <th>Résultat</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let r of results">
                  <td class="td-name">
                    {{ r.certificationExam?.title || ('Examen #' + (r.certificationExam?.id || r.certificationId || r.id)) }}
                  </td>
                  <td>
                    <div class="score-bar-wrap">
                      <div class="score-bar" [style.width.%]="r.score" [class.bar-pass]="r.passed" [class.bar-fail]="!r.passed"></div>
                    </div>
                    <span class="score-pct">{{ r.score | number:'1.0-0' }}%</span>
                  </td>
                  <td>
                    <span class="badge" [class.badge-pass]="r.passed" [class.badge-fail]="!r.passed">
                      {{ r.passed ? '✅ Réussi' : '❌ Échoué' }}
                    </span>
                  </td>
                  <td class="td-date">{{ formatDate(r.createdAt) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </ng-container>
    </div>
  `,
  styles: [`
    .page { max-width: 900px; margin: 0 auto; padding: 2rem; }
    .page-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:2rem; flex-wrap:wrap; gap:1rem; }
    .page-header h1 { margin:0 0 0.25rem; font-size:1.75rem; color:#2d5757; }
    .page-header p  { margin:0; color:#64748b; font-size:0.9rem; }
    .btn-back { padding:0.6rem 1.2rem; background:#f1f5f9; border-radius:10px; text-decoration:none; color:#475569; font-weight:600; font-size:0.88rem; }
    .loading { text-align:center; padding:4rem; color:#64748b; font-size:1.1rem; }
    .spinner { margin-right:0.5rem; }

    /* Section */
    .section { margin-bottom:3rem; }
    .section-title { font-size:1.15rem; font-weight:800; color:#1e293b; margin:0 0 1.25rem; }
    .empty { color:#94a3b8; font-size:0.95rem; background:#f8fafc; border-radius:12px; padding:1.5rem; text-align:center; }
    .link { color:#2d5757; font-weight:600; text-decoration:none; margin-left:0.5rem; }

    /* Certificates grid */
    .certs-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:1.25rem; }
    .cert-card {
      background:linear-gradient(135deg,#f0fdf4,#dcfce7);
      border:2px solid #86efac;
      border-radius:18px;
      padding:1.5rem 1.25rem;
      text-align:center;
      position:relative;
      overflow:hidden;
    }
    .cert-ribbon {
      position:absolute; top:12px; right:-22px;
      background:#16a34a; color:#fff;
      font-size:0.7rem; font-weight:700; padding:3px 28px;
      transform:rotate(40deg);
    }
    .cert-icon  { font-size:2.5rem; margin-bottom:0.5rem; }
    .cert-name  { margin:0 0 0.5rem; font-size:1rem; font-weight:800; color:#15803d; }
    .cert-level {
      display:inline-block; border-radius:20px; padding:0.2rem 0.75rem;
      font-size:0.78rem; font-weight:700; background:#16a34a; color:#fff;
      margin-bottom:0.5rem;
    }
    .cert-date  { margin:0; font-size:0.8rem; color:#4ade80; }

    /* Results table */
    .summary-row { display:flex; gap:1.5rem; margin-bottom:1.5rem; flex-wrap:wrap; }
    .summary-item { background:#f8fafc; border-radius:12px; padding:0.85rem 1.25rem; text-align:center; min-width:100px; }
    .summary-num  { display:block; font-size:1.5rem; font-weight:800; color:#2d5757; }
    .summary-num.green { color:#16a34a; }
    .summary-label { font-size:0.78rem; color:#94a3b8; }
    .table { width:100%; border-collapse:collapse; background:#fff; border-radius:14px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,0.06); }
    th { background:#f8fafc; padding:0.85rem 1rem; text-align:left; font-size:0.8rem; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; }
    td { padding:0.85rem 1rem; border-top:1px solid #f1f5f9; font-size:0.9rem; color:#334155; vertical-align:middle; }
    .td-name { font-weight:600; color:#1e293b; }
    .td-date { color:#94a3b8; font-size:0.82rem; }
    .score-bar-wrap { height:6px; background:#e2e8f0; border-radius:3px; overflow:hidden; margin-bottom:3px; width:100px; }
    .score-bar { height:100%; border-radius:3px; transition:width 0.3s; }
    .bar-pass { background:#16a34a; }
    .bar-fail { background:#dc2626; }
    .score-pct { font-size:0.85rem; font-weight:700; }
    .badge { display:inline-block; padding:0.25rem 0.7rem; border-radius:20px; font-size:0.78rem; font-weight:700; }
    .badge-pass { background:#f0fdf4; color:#16a34a; border:1px solid #86efac; }
    .badge-fail { background:#fef2f2; color:#dc2626; border:1px solid #fca5a5; }
  `]
})
export class MesResultatsComponent implements OnInit {
  results: CertificationResult[] = [];
  certificates: Certificate[] = [];
  loading = true;

  get passedCount(): number { return this.results.filter(r => r.passed).length; }
  get passRate(): number {
    return this.results.length ? Math.round((this.passedCount / this.results.length) * 100) : 0;
  }

  constructor(
    private resultService: ResultService,
    private certificateService: CertificateService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const userId = this.authService.getCurrentUser()?.id ?? 0;
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    forkJoin({
      results: this.resultService.getByUser(userId),
      certs: this.certificateService.getByUserId(userId)
    }).subscribe({
      next: ({ results, certs }) => {
        this.results = results.sort((a, b) =>
          (b.createdAt ?? '') > (a.createdAt ?? '') ? 1 : -1
        );
        this.certificates = certs;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'long', year: 'numeric'
      });
    } catch { return dateStr; }
  }
}
