import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { JobOffer, Level } from '../../../../models/application.models';
import { ApplicationService } from '../../../../services/application.service';

@Component({
  selector: 'app-job-offer-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <!-- Toast Notification -->
      @if (toast) {
        <div class="toast" [class.toast-success]="toast.type === 'success'" [class.toast-error]="toast.type === 'error'">
          <span class="toast-icon">{{ toast.type === 'success' ? '✅' : '❌' }}</span>
          {{ toast.message }}
        </div>
      }

      <div class="page-header">
        <div>
          <h2 class="page-title">💼 Offres d'Emploi</h2>
          <p class="page-sub">Gérez vos opportunités de carrière, les entreprises et les niveaux requis</p>
        </div>
        <button class="btn-primary" [routerLink]="['nouveau']">
          <span class="btn-icon">+</span> Nouvelle Offre
        </button>
      </div>

      @if (loading) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Chargement des offres...</p>
        </div>
      }

      @if (!loading && jobOffers.length === 0) {
        <div class="empty-state">
          <div class="empty-icon-wrap">💼</div>
          <h3>Aucune offre d'emploi</h3>
          <p>Commencez par créer votre première opportunité de carrière.</p>
          <button class="btn-primary mt" [routerLink]="['nouveau']">
            <span class="btn-icon">+</span> Créer ma première offre
          </button>
        </div>
      }

      @if (!loading && jobOffers.length > 0) {
        <div class="stats-bar">
          <div class="stat-item">
            <span class="stat-num">{{ jobOffers.length }}</span>
            <span class="stat-label">Total</span>
          </div>
          <div class="stat-item">
            <span class="stat-num active-count">{{ activeCount }}</span>
            <span class="stat-label">Actives</span>
          </div>
          <div class="stat-item">
            <span class="stat-num inactive-count">{{ jobOffers.length - activeCount }}</span>
            <span class="stat-label">Inactives</span>
          </div>
        </div>

        <!-- ── Table View ──────────────────────────────────────── -->
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Titre</th>
                <th>Entreprise</th>
                <th>Niveau</th>
                <th>Statut</th>
                <th>Activer/Désactiver</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (job of jobOffers; track job.id) {
                <tr [class.row-inactive]="!job.active">
                  <td class="id-cell">#{{ job.id }}</td>
                  <td>
                    <div class="job-info">
                      <span class="job-title">{{ job.title }}</span>
                      <span class="job-desc-preview">{{ job.description | slice:0:60 }}{{ job.description.length > 60 ? '...' : '' }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="company-info">
                      <span>{{ job.companyName || '—' }}</span>
                      @if (job.location) {
                        <span class="location-sub">📍 {{ job.location }}</span>
                      }
                    </div>
                  </td>
                  <td>
                    @if (job.requiredLevel) {
                      <span class="level-badge" [class]="getLevelClass(job.requiredLevel)">
                        {{ job.requiredLevel }}
                      </span>
                    } @else {
                      <span class="no-level">—</span>
                    }
                  </td>
                  <td>
                    <span class="status-indicator" [class.active]="job.active">
                      <span class="status-dot"></span>
                      {{ job.active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td>
                    <!-- Toggle Switch -->
                    <div class="toggle-wrap" (click)="toggleActive(job)" [class.toggling]="togglingId === job.id">
                      <div class="toggle-track" [class.toggle-on]="job.active">
                        <div class="toggle-thumb"></div>
                      </div>
                      <span class="toggle-label">{{ job.active ? 'Actif' : 'Inactif' }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="actions-row">
                      <button class="btn-action edit" [routerLink]="['modifier', job.id]" title="Modifier">
                        ✏️
                      </button>
                      <button class="btn-action delete" (click)="deleteJob(job.id!)" [disabled]="deletingId === job.id" title="Supprimer">
                        @if (deletingId === job.id) { ⏳ } @else { 🗑️ }
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
    `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; }
    .page { padding: 1.5rem; font-family: 'Inter', system-ui, sans-serif; }

    /* Toast */
    .toast { position: fixed; top: 1.5rem; right: 1.5rem; z-index: 9999; display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.5rem; border-radius: 14px; font-weight: 600; font-size: 0.9rem; box-shadow: 0 20px 40px rgba(0,0,0,0.15); animation: slideIn 0.3s ease; }
    .toast-success { background: linear-gradient(135deg, #10b981, #059669); color: white; }
    .toast-error { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; }
    .toast-icon { font-size: 1.1rem; }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

    /* Header */
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; gap: 1rem; flex-wrap: wrap; }
    .page-title { font-size: 1.85rem; font-weight: 800; color: #1e293b; margin: 0 0 0.3rem; }
    .page-sub { color: #64748b; margin: 0; font-size: 0.95rem; }

    .btn-primary { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.25s; box-shadow: 0 4px 14px rgba(59,130,246,0.4); font-size: 0.95rem; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(59,130,246,0.5); }
    .btn-primary.mt { margin-top: 1.5rem; }
    .btn-icon { font-size: 1.1rem; }

    /* Stats */
    .stats-bar { display: flex; gap: 1rem; margin-bottom: 1.75rem; flex-wrap: wrap; }
    .stat-item { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 0.75rem 1.25rem; display: flex; flex-direction: column; align-items: center; min-width: 80px; }
    .stat-num { font-size: 1.5rem; font-weight: 800; color: #1e293b; }
    .stat-num.active-count { color: #10b981; }
    .stat-num.inactive-count { color: #94a3b8; }
    .stat-label { font-size: 0.72rem; color: #64748b; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em; }

    /* Table */
    .table-wrap { background: #fff; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); overflow: hidden; border: 1px solid #e2e8f0; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table thead { background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-bottom: 2px solid #e2e8f0; }
    .data-table th { padding: 1rem 1.25rem; text-align: left; font-size: 0.78rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .data-table td { padding: 1rem 1.25rem; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; color: #334155; vertical-align: middle; }
    .data-table tbody tr { transition: background 0.2s; }
    .data-table tbody tr:hover { background: #f8fafc; }
    .data-table tbody tr.row-inactive { opacity: 0.6; }

    .id-cell { color: #94a3b8; font-family: monospace; font-weight: 600; font-size: 0.85rem; }

    .job-info { display: flex; flex-direction: column; gap: 0.15rem; }
    .job-title { font-weight: 700; color: #1e293b; font-size: 0.92rem; }
    .job-desc-preview { font-size: 0.78rem; color: #94a3b8; }

    .company-info { display: flex; flex-direction: column; gap: 0.1rem; font-weight: 600; }
    .location-sub { font-size: 0.75rem; color: #94a3b8; font-weight: 400; }

    .level-badge { padding: 0.25rem 0.7rem; border-radius: 6px; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; }
    .level-beginner { background: #dcfce7; color: #166534; }
    .level-intermediate { background: #fef9c3; color: #854d0e; }
    .level-advanced { background: #ffedd5; color: #9a3412; }
    .level-expert { background: #fee2e2; color: #991b1b; }
    .no-level { color: #cbd5e1; }

    /* Status indicator */
    .status-indicator { display: inline-flex; align-items: center; gap: 0.45rem; font-size: 0.82rem; font-weight: 700; color: #94a3b8; }
    .status-indicator.active { color: #10b981; }
    .status-indicator .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #cbd5e1; flex-shrink: 0; }
    .status-indicator.active .status-dot { background: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.15); animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100% { box-shadow: 0 0 0 3px rgba(16,185,129,0.15); } 50% { box-shadow: 0 0 0 6px rgba(16,185,129,0.08); } }

    /* Toggle Switch */
    .toggle-wrap { display: flex; align-items: center; gap: 0.65rem; cursor: pointer; user-select: none; }
    .toggle-wrap.toggling { pointer-events: none; opacity: 0.6; }
    .toggle-track { width: 44px; height: 24px; border-radius: 12px; background: #e2e8f0; position: relative; transition: background 0.3s ease; flex-shrink: 0; }
    .toggle-track.toggle-on { background: #10b981; }
    .toggle-thumb { width: 18px; height: 18px; border-radius: 50%; background: white; position: absolute; top: 3px; left: 3px; transition: left 0.3s ease; box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
    .toggle-track.toggle-on .toggle-thumb { left: 23px; }
    .toggle-label { font-size: 0.8rem; font-weight: 600; color: #64748b; }

    /* Actions */
    .actions-row { display: flex; gap: 0.5rem; }
    .btn-action { width: 36px; height: 36px; border-radius: 10px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1rem; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .btn-action:hover { transform: scale(1.08); box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
    .btn-action.edit:hover { background: #eff6ff; border-color: #93c5fd; }
    .btn-action.delete:hover { background: #fff5f5; border-color: #fecaca; }
    .btn-action:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Loading */
    .loading { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 5rem; color: #64748b; }
    .spinner { width: 36px; height: 36px; border: 3px solid #f1f5f9; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Empty */
    .empty-state { text-align: center; padding: 5rem 2rem; background: linear-gradient(135deg, #f8fafc, #f0f4ff); border-radius: 24px; border: 2px dashed #c7d2fe; }
    .empty-icon-wrap { font-size: 3rem; margin-bottom: 1rem; }
    .empty-state h3 { font-size: 1.25rem; font-weight: 700; color: #1e293b; margin: 0 0 0.5rem; }
    .empty-state p { color: #64748b; margin: 0; }
  `]
})
export class JobOfferListComponent implements OnInit {
  jobOffers: JobOffer[] = [];
  loading = true;
  deletingId: number | null = null;
  togglingId: number | null = null;
  toast: { message: string; type: 'success' | 'error' } | null = null;

  constructor(private svc: ApplicationService) { }

  get activeCount(): number {
    return this.jobOffers.filter(j => j.active).length;
  }

  getLevelClass(level: Level | string): string {
    return 'level-' + level.toString().toLowerCase();
  }

  ngOnInit(): void {
    this.svc.getAllJobs().subscribe({
      next: (data: JobOffer[]) => {
        this.jobOffers = data;
        this.loading = false;
      },
      error: () => {
        this.jobOffers = [];
        this.loading = false;
      }
    });
  }

  toggleActive(job: JobOffer): void {
    if (!job.id) return;
    this.togglingId = job.id;
    this.svc.toggleJobActive(job.id, job).subscribe({
      next: (updated: JobOffer) => {
        const idx = this.jobOffers.findIndex(j => j.id === job.id);
        if (idx !== -1) {
          this.jobOffers[idx] = updated;
        }
        this.togglingId = null;
        this.showToast(
          updated.active ? 'Offre activée avec succès.' : 'Offre désactivée avec succès.',
          'success'
        );
      },
      error: () => {
        this.togglingId = null;
        this.showToast('Erreur lors du changement de statut.', 'error');
      }
    });
  }

  deleteJob(id: number): void {
    if (!confirm('Voulez-vous vraiment supprimer cette offre ?')) return;
    this.deletingId = id;
    this.svc.deleteJob(id).subscribe({
      next: () => {
        this.jobOffers = this.jobOffers.filter(j => j.id !== id);
        this.deletingId = null;
        this.showToast('Offre supprimée avec succès.', 'success');
      },
      error: () => {
        this.deletingId = null;
        this.showToast('Erreur lors de la suppression.', 'error');
      }
    });
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast = { message, type };
    setTimeout(() => this.toast = null, 3500);
  }
}

