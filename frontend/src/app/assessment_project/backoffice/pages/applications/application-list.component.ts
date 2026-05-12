import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Application, ApplicationStatus } from '../../../../models/application.models';
import { ApplicationService } from '../../../../services/application.service';
import { Subject, interval } from 'rxjs';
import { takeUntil, startWith, switchMap } from 'rxjs/operators';
import { NotificationWebSocketService } from '../../../../services/notification-websocket.service';
import { AppNotification } from '../../../../models/notification.model';

@Component({
  selector: 'app-application-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <!-- Toast -->
      @if (toast) {
        <div class="toast" [class.toast-success]="toast.type === 'success'" [class.toast-error]="toast.type === 'error'">
          <span class="toast-icon">{{ toast.type === 'success' ? '✅' : '❌' }}</span>
          {{ toast.message }}
        </div>
      }

      <div class="page-header">
        <div>
          <h2 class="page-title">📩 Candidatures</h2>
          <p class="page-sub">Gestion des candidatures aux offres d'emploi · Suivi du recrutement</p>
        </div>
        <div class="stats-badge">
          <span class="live-dot"></span>
          {{ applications.length }} Total
        </div>
      </div>

      <!-- Summary metrics -->
      @if (!loading && applications.length > 0) {
        <div class="summary-row">
          <div class="summ-card pending">
            <span class="summ-num">{{ getCount(ApplicationStatus.PENDING) }}</span>
            <span class="summ-lbl">En attente ⏳</span>
          </div>
          <div class="summ-card accepted">
            <span class="summ-num">{{ getCount(ApplicationStatus.ACCEPTED) }}</span>
            <span class="summ-lbl">Acceptées ✅</span>
          </div>
          <div class="summ-card rejected">
            <span class="summ-num">{{ getCount(ApplicationStatus.REJECTED) }}</span>
            <span class="summ-lbl">Refusées ❌</span>
          </div>
        </div>
      }

      @if (loading) {
        <div class="loading">
          <div class="spinner"></div> Chargement des candidatures...
        </div>
      }

      @if (errorMessage) {
        <div class="error-banner">
          <span class="error-icon">⚠️</span>
          <div class="error-content">
            <h3>Erreur de connexion au serveur</h3>
            <p>Le serveur refuse l'accès ou ne répond pas. Veuillez vérifier que les services sont actifs.</p>
            <button class="btn-retry" (click)="ngOnInit()">🔄 Réessayer la connexion</button>
          </div>
        </div>
      } @else if (!loading && applications.length === 0) {
        <div class="empty-state">
          <span class="empty-icon">📩</span>
          <p>Aucune candidature trouvée dans la base de données.</p>
        </div>
      }

      @if (!loading && applications.length > 0) {
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Offre d'emploi</th>
                <th>Bio</th>
                <th>Spécialité</th>
                <th>Expérience</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (app of applications; track app.id) {
                <tr>
                  <td>
                    <div class="job-info">
                      <span class="job-title">{{ app.jobOffer?.title || 'Offre inconnue' }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="bio-preview" [title]="app.bio">{{ app.bio | slice:0:30 }}{{ app.bio && app.bio.length > 30 ? '...' : '' }}</span>
                  </td>
                  <td>
                    <span class="specialty-badge">{{ app.specialty || '—' }}</span>
                  </td>
                  <td>
                    <span class="experience-text">{{ app.experience || '—' }}</span>
                  </td>
                  <td>
                    <span class="status-badge" [class]="app.status.toLowerCase()">
                      {{ getStatusIcon(app.status) }} {{ getStatusLabel(app.status) }}
                    </span>
                  </td>
                  <td class="actions-cell">
                    @if (app.status === ApplicationStatus.PENDING) {
                      <div class="action-buttons">
                        <button class="btn-action accept" title="Accepter"
                          (click)="updateStatus(app.id, ApplicationStatus.ACCEPTED)"
                          [disabled]="updatingId === app.id">
                          ✅
                        </button>
                        <button class="btn-action reject" title="Refuser"
                          (click)="updateStatus(app.id, ApplicationStatus.REJECTED)"
                          [disabled]="updatingId === app.id">
                          ❌
                        </button>
                      </div>
                    } @else {
                      <div class="action-buttons">
                        <button class="btn-action pending-btn" title="Remettre en attente"
                          (click)="updateStatus(app.id, ApplicationStatus.PENDING)"
                          [disabled]="updatingId === app.id">
                          ⏳ Reset
                        </button>
                      </div>
                    }
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

    .toast { position: fixed; top: 1.5rem; right: 1.5rem; z-index: 9999; display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.5rem; border-radius: 14px; font-weight: 600; font-size: 0.9rem; box-shadow: 0 20px 40px rgba(0,0,0,0.15); animation: slideIn 0.3s ease; }
    .toast-success { background: linear-gradient(135deg, #10b981, #059669); color: white; }
    .toast-error { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

    .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 2rem; gap: 1rem; flex-wrap: wrap; }
    .page-title { font-size: 1.75rem; font-weight: 800; color: #1e293b; margin: 0 0 0.25rem; }
    .page-sub { color: #64748b; margin: 0; font-size: 0.95rem; }

    .stats-badge { display: flex; align-items: center; gap: 0.6rem; background: #f1f5f9; border: 1px solid #e2e8f0; color: #475569; padding: 0.5rem 1.25rem; border-radius: 99px; font-size: 0.85rem; font-weight: 700; }
    .live-dot { width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); animation: livePulse 2s infinite; }
    @keyframes livePulse { 0%,100% { box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); } 50% { box-shadow: 0 0 0 5px rgba(59, 130, 246, 0.1); } }

    .summary-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
    .summ-card { background: #fff; border-radius: 16px; padding: 1.5rem; display: flex; flex-direction: column; align-items: center; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #f1f5f9; }
    .summ-num { font-size: 2.25rem; font-weight: 800; line-height: 1; }
    .summ-lbl { font-size: 0.85rem; color: #64748b; margin-top: 0.5rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.025em; }

    .pending .summ-num { color: #f59e0b; }
    .accepted .summ-num { color: #10b981; }
    .rejected .summ-num { color: #ef4444; }

    .loading { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 5rem; color: #64748b; }
    .spinner { width: 40px; height: 40px; border: 4px solid #f1f5f9; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .table-wrap { background: #fff; border-radius: 20px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); overflow: hidden; border: 1px solid #e2e8f0; overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; min-width: 900px; }
    .data-table thead { background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-bottom: 2px solid #e2e8f0; }
    .data-table th { padding: 1rem 1.15rem; text-align: left; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .data-table td { padding: 1rem 1.15rem; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; color: #334155; vertical-align: middle; }
    .data-table tbody tr:hover { background: #fcfdfe; }

    .id-cell { color: #94a3b8; font-family: monospace; font-weight: 600; }
    .user-info { display: flex; align-items: center; gap: 0.75rem; }
    .user-avatar { width: 32px; height: 32px; background: #eff6ff; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
    .user-name { font-weight: 600; }

    .job-info { display: flex; flex-direction: column; gap: 0.1rem; }
    .job-title { font-weight: 700; color: #1e293b; }
    .job-id { font-size: 0.75rem; color: #94a3b8; }

    .bio-preview { font-size: 0.82rem; color: #64748b; cursor: help; }
    .specialty-badge { padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.78rem; font-weight: 600; background: #eff6ff; color: #1d4ed8; }
    .experience-text { font-size: 0.85rem; color: #475569; }

    .status-badge { padding: 0.35rem 0.75rem; border-radius: 99px; font-size: 0.78rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.3rem; }
    .status-badge.pending { background: #fef3c7; color: #92400e; }
    .status-badge.accepted { background: #dcfce7; color: #166534; }
    .status-badge.rejected { background: #fee2e2; color: #991b1b; }

    .actions-cell { min-width: 100px; }
    .action-buttons { display: flex; gap: 0.5rem; }
    .btn-action { width: 36px; height: 36px; border-radius: 10px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .btn-action.pending-btn { width: auto; font-size: 0.8rem; padding: 0 0.8rem; font-weight: 700; color: #b45309; }
    .btn-action:hover { transform: scale(1.05); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .btn-action:disabled { opacity: 0.5; cursor: not-allowed; }

    .error-banner { background: #fff1f2; border: 1px solid #fda4af; padding: 2rem; border-radius: 16px; display: flex; align-items: flex-start; gap: 1.5rem; color: #9f1239; margin-bottom: 2rem; }
    .btn-retry { background: #e11d48; color: white; border: none; padding: 0.6rem 1.25rem; border-radius: 10px; font-weight: 700; cursor: pointer; margin-top: 1rem; }
  `]
})
export class ApplicationListComponent implements OnInit {
  applications: Application[] = [];
  loading = true;
  errorMessage: string | null = null;
  updatingId: number | null = null;
  toast: { message: string; type: 'success' | 'error' } | null = null;
  private destroy$ = new Subject<void>();
  ApplicationStatus = ApplicationStatus;

  constructor(
    private svc: ApplicationService,
    private notifSvc: NotificationWebSocketService
  ) { }

  ngOnInit(): void {
    this.setupRealTimeUpdates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupRealTimeUpdates(): void {
    this.loading = true;
    this.errorMessage = null;

    interval(5000).pipe(
      startWith(0),
      switchMap(() => this.svc.getAll()),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data: Application[]) => {
        this.applications = data;
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Polling error:', err);
        this.loading = false;
        if (this.applications.length === 0) {
          this.errorMessage = 'ERROR';
        }
      }
    });
  }

  getCount(status: ApplicationStatus): number {
    return this.applications.filter(a => a.status === status).length;
  }

  getStatusLabel(status: ApplicationStatus): string {
    switch (status) {
      case ApplicationStatus.PENDING: return 'En attente';
      case ApplicationStatus.ACCEPTED: return 'Accepté';
      case ApplicationStatus.REJECTED: return 'Refusé';
      default: return status;
    }
  }

  getStatusIcon(status: ApplicationStatus): string {
    switch (status) {
      case ApplicationStatus.PENDING: return '⏳';
      case ApplicationStatus.ACCEPTED: return '✅';
      case ApplicationStatus.REJECTED: return '❌';
      default: return '';
    }
  }

  updateStatus(id: number, status: ApplicationStatus): void {
    this.updatingId = id;
    this.svc.updateStatus(id, status).subscribe({
      next: (updated: Application) => {
        const index = this.applications.findIndex(a => a.id === id);
        if (index !== -1) {
          this.applications[index] = updated;
        }
        this.updatingId = null;
        this.showToast(
          status === ApplicationStatus.ACCEPTED ? 'Acceptée ✅' : 
          status === ApplicationStatus.REJECTED ? 'Refusée ❌' : 'Reset ⏳',
          'success'
        );

        // Send real-time notification to the student
        const notif: AppNotification = {
          message: `Votre candidature pour l'offre #${updated.jobOfferId || updated.jobOffer?.id} a été mise à jour : ${status}`,
          sender: 'Service Recrutement',
          type: 'CAREER',
          timestamp: new Date().toISOString()
        };
        this.notifSvc.sendNotification('career', notif);
      },
      error: () => {
        this.updatingId = null;
        this.showToast('Erreur lors de la mise à jour.', 'error');
      }
    });
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast = { message, type };
    setTimeout(() => this.toast = null, 3500);
  }
}
