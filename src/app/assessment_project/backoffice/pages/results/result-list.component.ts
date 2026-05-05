import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CertificationResult } from '../../models/certification.models';
import { ResultService } from '../../services/result.service';

@Component({
    selector: 'app-result-list',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h2 class="page-title">📊 Résultats</h2>
          <p class="page-sub">Résultats générés automatiquement après chaque test · Notifications WebSocket</p>
        </div>
        <div class="ws-badge">
          <span class="live-dot"></span>
          Temps réel
        </div>
      </div>

      <!-- Summary cards -->
      <div class="summary-row" *ngIf="!loading && results.length > 0">
        <div class="summ-card total">
          <span class="summ-num">{{ results.length }}</span>
          <span class="summ-lbl">Total</span>
        </div>
        <div class="summ-card success">
          <span class="summ-num">{{ passed }}</span>
          <span class="summ-lbl">Réussis ✅</span>
        </div>
        <div class="summ-card failed">
          <span class="summ-num">{{ results.length - passed }}</span>
          <span class="summ-lbl">Échoués ❌</span>
        </div>
        <div class="summ-card rate">
          <span class="summ-num">{{ passRate }}%</span>
          <span class="summ-lbl">Taux de réussite</span>
        </div>
      </div>

      <div class="loading" *ngIf="loading"><div class="spinner"></div> Chargement…</div>

      <div class="empty-state" *ngIf="!loading && results.length === 0">
        <span class="empty-icon">📊</span>
        <p>Aucun résultat enregistré pour l'instant.</p>
        <small>Les résultats apparaissent automatiquement après chaque test.</small>
      </div>

      <div class="table-wrap" *ngIf="!loading && results.length > 0">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Utilisateur</th>
              <th>Certification</th>
              <th>Score</th>
              <th>Résultat</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of results">
              <td class="id-cell">{{ r.id }}</td>
              <td>
                <span class="user-chip">👤 Utilisateur #{{ r.userId }}</span>
              </td>
              <td>
                <span class="cert-name">🎓 {{ r.certification?.title || ('Certification #' + r.certificationId) }}</span>
              </td>
              <td>
                <div class="score-wrap">
                  <span class="score-num" [class.good]="r.score >= 70" [class.bad]="r.score < 70">
                    {{ r.score | number:'1.0-1' }}%
                  </span>
                  <div class="score-bar">
                    <div class="score-fill" [style.width.%]="r.score" [class.good-fill]="r.score >= 70" [class.bad-fill]="r.score < 70"></div>
                  </div>
                </div>
              </td>
              <td>
                <span class="result-badge" [class.passed]="r.passed" [class.failed]="!r.passed">
                  {{ r.passed ? '✅ Réussi' : '❌ Échoué' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
    styles: [`
    .page { }
    .page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1.75rem; gap:1rem; flex-wrap:wrap; }
    .page-title { font-size:1.5rem; font-weight:800; color:#0f172a; margin:0 0 0.25rem; }
    .page-sub { color:#64748b; margin:0; font-size:0.9rem; }
    .ws-badge { display:flex; align-items:center; gap:0.5rem; background:#f0fdf4; border:1px solid #bbf7d0; color:#16a34a; padding:0.5rem 1rem; border-radius:20px; font-size:0.82rem; font-weight:600; }
    .live-dot { width:8px; height:8px; background:#22c55e; border-radius:50%; animation:pulse 1.5s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

    /* Summary */
    .summary-row { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:1rem; margin-bottom:1.75rem; }
    .summ-card { background:#fff; border-radius:14px; padding:1.25rem; display:flex; flex-direction:column; align-items:center; box-shadow:0 2px 10px rgba(0,0,0,0.06); border:1px solid #f1f5f9; }
    .summ-num { font-size:1.8rem; font-weight:800; color:#0f172a; }
    .summ-lbl { font-size:0.78rem; color:#64748b; margin-top:0.2rem; }
    .summ-card.success .summ-num { color:#16a34a; }
    .summ-card.failed .summ-num { color:#dc2626; }
    .summ-card.rate .summ-num { color:#3b82f6; }

    .loading { display:flex; align-items:center; gap:1rem; padding:3rem; color:#64748b; }
    .spinner { width:24px; height:24px; border:3px solid #e2e8f0; border-top-color:#8b5cf6; border-radius:50%; animation:spin 0.7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .empty-state { text-align:center; padding:4rem 2rem; color:#64748b; }
    .empty-icon { font-size:3.5rem; display:block; margin-bottom:1rem; }
    .empty-state small { display:block; margin-top:0.5rem; font-size:0.85rem; }

    .table-wrap { background:#fff; border-radius:16px; box-shadow:0 2px 12px rgba(0,0,0,0.06); overflow:hidden; border:1px solid #f1f5f9; }
    .data-table { width:100%; border-collapse:collapse; }
    .data-table thead { background:#f8fafc; }
    .data-table th { padding:0.9rem 1.25rem; text-align:left; font-size:0.78rem; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; border-bottom:1px solid #e2e8f0; }
    .data-table td { padding:1rem 1.25rem; border-bottom:1px solid #f1f5f9; font-size:0.9rem; color:#334155; vertical-align:middle; }
    .data-table tbody tr:last-child td { border-bottom:none; }
    .data-table tbody tr:hover { background:#fafbfc; }
    .id-cell { color:#94a3b8; font-size:0.8rem; }
    .user-chip { background:#f8fafc; border:1px solid #e2e8f0; padding:0.3rem 0.7rem; border-radius:8px; font-size:0.85rem; font-weight:500; }
    .cert-name { font-weight:500; }
    .score-wrap { display:flex; align-items:center; gap:0.75rem; }
    .score-num { font-weight:700; min-width:44px; }
    .score-num.good { color:#16a34a; }
    .score-num.bad { color:#dc2626; }
    .score-bar { flex:1; height:6px; background:#e2e8f0; border-radius:99px; min-width:80px; }
    .score-fill { height:100%; border-radius:99px; }
    .good-fill { background:linear-gradient(90deg,#22c55e,#16a34a); }
    .bad-fill { background:linear-gradient(90deg,#f87171,#dc2626); }
    .result-badge { padding:0.3rem 0.7rem; border-radius:8px; font-size:0.8rem; font-weight:700; }
    .result-badge.passed { background:#dcfce7; color:#15803d; }
    .result-badge.failed { background:#fef2f2; color:#dc2626; }
  `]
})
export class ResultListComponent implements OnInit {
    results: CertificationResult[] = [];
    loading = true;
    passed = 0;
    passRate = 0;

    constructor(private svc: ResultService) { }

    ngOnInit(): void {
        this.svc.getAll().subscribe({
            next: d => {
                this.results = d;
                this.passed = d.filter(r => r.passed).length;
                this.passRate = d.length ? Math.round((this.passed / d.length) * 100) : 0;
                this.loading = false;
            },
            error: () => { this.results = []; this.loading = false; }
        });
    }
}
