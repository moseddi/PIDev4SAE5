import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApplicationService } from '../../../backoffice/services/application.service';
import { AuthService } from '../../../shared/services/auth.service';
import { Application, ApplicationStatus } from '../../../backoffice/models/application.models';
import { Subject, interval } from 'rxjs';
import { takeUntil, startWith, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-mes-candidatures',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container py-5 mt-5">
      <div class="card shadow-sm border-0 rounded-4 overflow-hidden">
        <div class="card-header bg-white border-0 py-4 px-4 d-flex justify-content-between align-items-center">
          <div>
            <h1 class="h3 mb-1 fw-bold text-dark">📩 Mes Candidatures</h1>
            <p class="text-secondary small mb-0">Suivez l'état de vos postulations en temps réel.</p>
          </div>
          <div class="status-summary d-none d-md-flex gap-3">
             <div class="summary-item">
                <span class="label">Total</span>
                <span class="value">{{ myApplications.length }}</span>
             </div>
             <div class="summary-divider"></div>
             <div class="summary-item">
                <span class="label text-success">Acceptés</span>
                <span class="value">{{ acceptedCount }}</span>
             </div>
          </div>
        </div>
        
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-hover mb-0">
              <thead class="table-light border-0">
                <tr>
                  <th class="ps-4 py-3 border-0">Poste</th>
                  <th class="py-3 border-0">Niveau de Langue</th>
                  <th class="py-3 border-0">Statut</th>
                  <th class="pe-4 py-3 border-0 text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let app of myApplications" class="align-middle">
                  <td class="ps-4 py-4">
                    <div class="d-flex align-items-center">
                      <div class="job-icon-circle me-3">💼</div>
                      <div>
                        <div class="fw-bold text-dark">{{ app.jobOffer?.title || 'Offre inconnue' }}</div>
                        <div class="text-muted small">Candidature #{{ app.id }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="py-4">
                    <span class="lang-level-badge">{{ app.jobOffer?.requiredLevel || '—' }}</span>
                  </td>
                  <td class="py-4">
                    <span class="status-pill" [ngClass]="getStatusClass(app.status)">
                      {{ app.status }}
                    </span>
                  </td>
                  <td class="pe-4 py-4 text-end">
                    <button class="btn btn-outline-secondary btn-sm rounded-pill px-3 me-2">Détails</button>
                    <button class="btn btn-light btn-sm rounded-pill px-3" (click)="withdraw(app.id)">Retirer</button>
                  </td>
                </tr>
                
                <tr *ngIf="myApplications.length === 0">
                  <td colspan="4" class="text-center py-5 border-0">
                    <div class="empty-state text-center">
                      <div class="empty-icon text-muted mb-3">📭</div>
                      <h4 class="text-secondary">Aucune candidature pour le moment</h4>
                      <p class="text-muted mb-4 small">Consultez les offres d'emploi pour postuler.</p>
                      <a href="/assessment/frontoffice/offres-emploi" class="btn-primary-custom">Voir les offres</a>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { max-width: 1200px; padding-top: 50px !important; }
    .card { border: 1px solid rgba(0,0,0,0.05); }
    
    .status-pill {
      font-size: 0.75rem;
      font-weight: 800;
      padding: 0.35rem 1rem;
      border-radius: 50px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .status-PENDING { background: #fee2e2; color: #ef4444; }
    .status-ACCEPTED { background: #dcfce7; color: #166534; }
    .status-REJECTED { background: #f1f5f9; color: #64748b; }
    
    .job-icon-circle {
      width: 42px;
      height: 42px;
      background: rgba(45, 87, 87, 0.05);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
    }
    
    .lang-level-badge {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      color: #475569;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.8rem;
    }
    
    .summary-item { text-align: center; }
    .summary-item .label { display: block; font-size: 0.7rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 2px; }
    .summary-item .value { font-size: 1.1rem; font-weight: 900; color: #1e293b; }
    .summary-divider { width: 1px; background: #e2e8f0; height: 30px; margin-top: 5px; }
    
    .btn-primary-custom {
      background: #2D5757;
      color: white;
      text-decoration: none;
      padding: 10px 20px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.9rem;
      display: inline-block;
      transition: background 0.2s;
    }
    .btn-primary-custom:hover { background: #1a3a3a; color: white; transform: translateY(-1px); }
    
    .empty-icon { font-size: 3.5rem; opacity: 0.2; }
    
    tr:hover { background-color: rgba(247, 237, 226, 0.2); }
  `]
})
export class MesCandidaturesComponent implements OnInit {
  myApplications: Application[] = [];
  private destroy$ = new Subject<void>();

  get acceptedCount(): number {
    return this.myApplications.filter(a => a.status === ApplicationStatus.ACCEPTED).length;
  }

  constructor(
    private appSvc: ApplicationService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.setupRealTimeUpdates();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupRealTimeUpdates(): void {
    const user = this.auth.getCurrentUser();
    
    // Polling every 5 seconds + listening to service updates
    interval(5000).pipe(
      startWith(0),
      switchMap(() => this.appSvc.getAll()),
      takeUntil(this.destroy$)
    ).subscribe(apps => {
      if (user && user.id) {
        const userApps = apps.filter(a => a.userId === user.id);
        this.myApplications = userApps.length > 0 ? userApps : apps;
      } else {
        this.myApplications = apps;
      }
    });
  }

  getStatusClass(status: ApplicationStatus): string {
    return 'status-' + status;
  }

  withdraw(id: number): void {
    if (confirm('Voulez-vous vraiment retirer votre candidature ?')) {
      // In a real app we'd call a service DELETE method
      // For now we simulate by filtering locally
      this.myApplications = this.myApplications.filter(a => a.id !== id);
      
      // Notify the service/storage if needed
      // (This is a mock-based implementation)
      console.log('Application withdrawn:', id);
    }
  }
}
