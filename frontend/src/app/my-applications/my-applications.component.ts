import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Application, ApplicationStatus } from '../models/application.models';
import { ApplicationService } from '../services/application.service';
import { NotificationWebSocketService } from '../assessment_project/backoffice/services/notification-websocket.service';
import { AppNotification } from '../assessment_project/backoffice/models/notification.model';
import { Subscription, interval, Subject } from 'rxjs';
import { takeUntil, switchMap, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">

      <!-- Hero -->
      <div class="hero-banner">
        <div class="hero-content">
          <span class="hero-tag">📩 Mes Candidatures</span>
          <h1 class="hero-title">Suivez vos <span class="accent">candidatures</span></h1>
          <p class="hero-sub">Consultez l'état de toutes vos candidatures en temps réel</p>
        </div>
        <div class="hero-right">
          <div class="header-actions">
            <button class="nav-btn-top" (click)="onViewOffers.emit()">
              💼 Voir les offres
            </button>

            <!-- Notification Bell Icon next to button -->
            <div class="notif-wrapper">
              <button class="btn-notif" (click)="toggleNotifMenu()">
                🔔
                <span *ngIf="unreadNotifs.length > 0" class="notif-badge">{{ unreadNotifs.length }}</span>
              </button>
              
              <!-- Full screen transparent overlay for click-outside -->
              <div *ngIf="showNotifMenu" class="notif-overlay" (click)="showNotifMenu = false"></div>

              <!-- Dropdown -->
              <div class="notif-dropdown" *ngIf="showNotifMenu">
                <div class="notif-dropdown-header">
                  <h4>Notifications</h4>
                  <button *ngIf="unreadNotifs.length > 0" (click)="markAllAsRead()">Tout marquer lu</button>
                </div>
                <div class="notif-dropdown-body">
                  <div *ngIf="unreadNotifs.length === 0" class="notif-empty">
                    Aucune nouvelle notification.
                  </div>
                  <div *ngFor="let n of unreadNotifs" class="notif-item" (click)="readNotif(n)">
                    <div class="notif-item-icon">💼</div>
                    <div class="notif-item-content">
                      <strong>{{ n.sender }}</strong>
                      <p>{{ n.message }}</p>
                      <span class="notif-time">{{ formatTime(n.timestamp) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="hero-stats">
            @if (!loading) {
              <div class="stat-pill pending">
                <span class="stat-count">{{ getCount(ApplicationStatus.PENDING) }}</span>
                <span class="stat-lbl">En attente</span>
              </div>
              <div class="stat-pill accepted">
                <span class="stat-count">{{ getCount(ApplicationStatus.ACCEPTED) }}</span>
                <span class="stat-lbl">Acceptées</span>
              </div>
              <div class="stat-pill rejected">
                <span class="stat-count">{{ getCount(ApplicationStatus.REJECTED) }}</span>
                <span class="stat-lbl">Refusées</span>
              </div>
            }
          </div>
        </div>
      </div>

      <div class="content-area">

        <!-- Loading -->
        @if (loading) {
          <div class="loading">
            <div class="spinner"></div>
            <p>Chargement de vos candidatures...</p>
          </div>
        }

        <!-- Empty State -->
        @if (!loading && applications.length === 0) {
          <div class="empty-state">
            <div class="empty-icon">📭</div>
            <h3>Aucune candidature</h3>
            <p>Vous n'avez pas encore postulé à une offre. Découvrez les opportunités disponibles !</p>
            <a class="btn-explore" (click)="onViewOffers.emit()" style="cursor: pointer;">
              💼 Voir les offres
            </a>
          </div>
        }

        <!-- Applications Table -->
        @if (!loading && applications.length > 0) {
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Offre d'emploi</th>
                  <th>Spécialité</th>
                  <th>Expérience</th>
                  <th>Date</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                @for (app of applications; track app.id) {
                  <tr>
                    <td class="id-cell">{{ app.id }}</td>
                    <td>
                      <div class="offer-info">
                        <span class="offer-title">{{ app.jobOfferTitle || 'Offre #' + app.jobOfferId }}</span>
                        <span class="offer-id">ID: {{ app.jobOfferId }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="specialty-badge">{{ app.specialty || '—' }}</span>
                    </td>
                    <td class="experience-text">{{ app.experience || '—' }}</td>
                    <td class="date-cell">{{ formatDate(app.createdAt) }}</td>
                    <td>
                      <span class="status-badge" [class]="app.status.toLowerCase()">
                        <span class="status-dot-inner"></span>
                        {{ getStatusLabel(app.status) }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { box-sizing: border-box; }
    .page { font-family: 'Inter', system-ui, sans-serif; min-height: 100vh; padding: 0; }

    /* ── Hero ──────────────────────────────── */
    .hero-banner {
      background: linear-gradient(135deg, #2D5757 0%, #1a3a3a 100%);
      padding: 3.5rem 2.5rem 2.5rem;
      display: flex; align-items: flex-end; justify-content: space-between; gap: 2rem;
      position: relative; overflow: hidden;
    }
    .hero-banner::before {
      content: ''; position: absolute; right: -60px; bottom: -60px;
      width: 280px; height: 280px; border-radius: 50%;
      background: rgba(255,255,255,0.04);
    }
    .hero-tag { display: inline-block; background: rgba(255,255,255,0.15); color: #F7EDE2; padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.85rem; font-weight: 700; margin-bottom: 0.75rem; }
    .hero-title { font-size: 2.2rem; font-weight: 900; color: white; margin: 0 0 0.5rem; line-height: 1.2; }
    .accent { color: #a7d7a7; }
    .hero-sub { color: rgba(255,255,255,0.65); font-size: 0.95rem; margin: 0; }
    .hero-right { display: flex; flex-direction: column; align-items: flex-end; gap: 1.25rem; z-index: 1; }
    .header-actions { display: flex; align-items: center; gap: 1rem; }
    .nav-btn-top { 
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      padding: 0.7rem 1.5rem;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 15px rgba(45, 87, 87, 0.15);
      height: 48px;
      white-space: nowrap;
    }
    .nav-btn-top:hover { 
      background: rgba(255, 255, 255, 0.25);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    }
    .hero-stats { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .stat-pill { display: flex; flex-direction: column; align-items: center; padding: 0.75rem 1.25rem; border-radius: 14px; min-width: 85px; border: 1px solid rgba(255,255,255,0.15); }
    .stat-pill.pending { background: rgba(245,158,11,0.15); }
    .stat-pill.accepted { background: rgba(16,185,129,0.15); }
    .stat-pill.rejected { background: rgba(239,68,68,0.15); }
    .stat-count { font-size: 1.75rem; font-weight: 800; color: white; line-height: 1; }
    .stat-lbl { font-size: 0.7rem; color: rgba(255,255,255,0.65); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; margin-top: 0.25rem; }

    /* ── Content ───────────────────────────── */
    .content-area { padding: 2rem 2.5rem; max-width: 1200px; margin: 0 auto; }

    /* Loading */
    .loading { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 5rem; color: #64748b; }
    .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #2D5757; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Empty */
    .empty-state { text-align: center; padding: 5rem 2rem; background: linear-gradient(135deg, #f8fafc, #f0fdf0); border-radius: 24px; border: 2px dashed #c7d2fe; }
    .empty-icon { font-size: 3.5rem; margin-bottom: 1rem; }
    .empty-state h3 { font-size: 1.35rem; font-weight: 800; color: #1e293b; margin: 0 0 0.5rem; }
    .empty-state p { color: #64748b; margin: 0 0 1.5rem; max-width: 400px; margin-left: auto; margin-right: auto; }
    .btn-explore { display: inline-flex; align-items: center; gap: 0.5rem; background: linear-gradient(135deg, #2D5757, #1a3a3a); color: white; text-decoration: none; padding: 0.75rem 1.75rem; border-radius: 12px; font-weight: 700; font-size: 0.95rem; transition: all 0.2s; box-shadow: 0 4px 14px rgba(45,87,87,0.3); }
    .btn-explore:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(45,87,87,0.4); }

    /* ── Table ─────────────────────────────── */
    .table-wrap { background: #fff; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); overflow: hidden; border: 1px solid #e2e8f0; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table thead { background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-bottom: 2px solid #e2e8f0; }
    .data-table th { padding: 1.1rem 1.25rem; text-align: left; font-size: 0.78rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .data-table td { padding: 1.1rem 1.25rem; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; color: #334155; vertical-align: middle; }
    .data-table tbody tr { transition: all 0.2s; }
    .data-table tbody tr:hover { background: #f8fafb; }

    .id-cell { color: #94a3b8; font-family: monospace; font-weight: 600; font-size: 0.85rem; }

    .offer-info { display: flex; flex-direction: column; gap: 0.1rem; }
    .offer-title { font-weight: 700; color: #1e293b; font-size: 0.92rem; }
    .offer-id { font-size: 0.72rem; color: #94a3b8; }

    .specialty-badge { padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.78rem; font-weight: 600; background: #eff6ff; color: #1d4ed8; }
    .experience-text { font-size: 0.85rem; color: #475569; font-weight: 500; }
    .date-cell { font-size: 0.82rem; color: #94a3b8; white-space: nowrap; }

    /* Status badges */
    .status-badge {
      display: inline-flex; align-items: center; gap: 0.4rem;
      padding: 0.4rem 0.85rem; border-radius: 99px;
      font-size: 0.8rem; font-weight: 700;
    }
    .status-badge .status-dot-inner {
      width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0;
    }
    .status-badge.pending { background: #fef3c7; color: #92400e; }
    .status-badge.pending .status-dot-inner { background: #f59e0b; }

    .status-badge.accepted { background: #dcfce7; color: #166534; }
    .status-badge.accepted .status-dot-inner { background: #10b981; }

    .status-badge.rejected { background: #fee2e2; color: #991b1b; }
    .status-badge.rejected .status-dot-inner { background: #ef4444; }
    .btn-notif { 
      background: rgba(255,255,255,0.15); 
      backdrop-filter: blur(10px); 
      border-radius: 12px; 
      width: 48px; 
      height: 48px; 
      border: 1px solid rgba(255,255,255,0.2); 
      color: white; 
      font-size: 1.4rem; 
      cursor: pointer; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      position: relative; 
      transition: all 0.3s; 
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    .btn-notif:hover { background: rgba(255,255,255,0.25); transform: translateY(-2px); }
    .notif-badge { position: absolute; top: -5px; right: -5px; background: #ef4444; color: white; font-size: 0.65rem; font-weight: 800; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #1a3a3a; }
    .notif-overlay { position: fixed; inset: 0; z-index: 1000; cursor: default; }
    .notif-dropdown { 
      position: absolute; 
      top: calc(100% + 15px); 
      right: 0; 
      width: 280px; 
      background: white; 
      border-radius: 16px; 
      box-shadow: 0 10px 40px rgba(0,0,0,0.15); 
      overflow: hidden; 
      z-index: 1001; 
      animation: slideUp 0.3s ease; 
      color: #1e293b; 
      text-align: left;
      border: 1px solid rgba(0,0,0,0.05);
    }
    @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .notif-dropdown-header { 
      padding: 14px 20px; 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      background: #f8fafc; 
    }
    .notif-dropdown-header h4 { 
      margin: 0; 
      font-size: 0.9rem; 
      font-weight: 700; 
      color: #334155;
    }
    .notif-dropdown-header button { background: none; border: none; font-size: 0.7rem; color: #2D5757; font-weight: 700; cursor: pointer; }
    .notif-dropdown-body { max-height: 300px; overflow-y: auto; }
    .notif-empty { padding: 3rem 1.5rem; text-align: center; color: #94a3b8; font-size: 0.85rem; font-weight: 500; }
    .notif-item { padding: 12px 16px; border-top: 1px solid #f1f5f9; display: flex; gap: 12px; cursor: pointer; }
    .notif-item:hover { background: #f8fafc; }
    .notif-item-icon { width: 32px; height: 32px; background: #dcfce7; color: #166534; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; }
    .notif-item-content { flex: 1; }
    .notif-item-content strong { display: block; font-size: 0.8rem; margin-bottom: 2px; }
    .notif-item-content p { margin: 0 0 4px 0; font-size: 0.75rem; color: #64748b; line-height: 1.3; }
    .notif-time { font-size: 0.65rem; color: #94a3b8; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
    @media (max-width: 768px) {
      .hero-banner { flex-direction: column; align-items: flex-start; padding: 2rem 1.5rem; }
      .hero-title { font-size: 1.8rem; }
      .content-area { padding: 1.5rem; }
      .table-wrap { overflow-x: auto; }
      .data-table { min-width: 650px; }
    }
  `]
})
export class MyApplicationsComponent implements OnInit {
  @Output() onViewOffers = new EventEmitter<void>();
  applications: Application[] = [];
  loading = true;
  ApplicationStatus = ApplicationStatus;

  showNotifMenu = false;
  unreadNotifs: AppNotification[] = [];
  private subs: Subscription[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private svc: ApplicationService,
    private notifSvc: NotificationWebSocketService
  ) {}

  ngOnInit(): void {
    this.setupRealTimeUpdates();
  }

  setupRealTimeUpdates(): void {
    // Polling every 5 seconds + startWith(0) to load immediately
    interval(5000).pipe(
      startWith(0),
      switchMap(() => this.svc.getMyApplications()),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data: Application[]) => {
        this.applications = data;
        this.loading = false;
      },
      error: () => {
        if (this.applications.length === 0) {
          this.applications = [];
          this.loading = false;
        }
      }
    });

    // Also listen to job notifications to trigger an extra refresh
    this.subs.push(
      this.notifSvc.getCareerUpdates().subscribe(n => {
        if (n) {
          console.log('[MyApplications] New notification received, refreshing...', n);
          this.unreadNotifs.unshift(n);
          // Trigger immediate refresh on notification
          this.svc.getMyApplications().subscribe(apps => this.applications = apps);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleNotifMenu(): void {
    this.showNotifMenu = !this.showNotifMenu;
  }

  markAllAsRead(): void {
    this.unreadNotifs = [];
    this.showNotifMenu = false;
  }

  readNotif(n: AppNotification): void {
    this.unreadNotifs = this.unreadNotifs.filter(notif => notif !== n);
    this.showNotifMenu = false;
  }

  formatTime(timestamp: string): string {
    if (!timestamp) return 'Récemment';
    const d = new Date(timestamp);
    return isNaN(d.getTime()) ? timestamp : d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  getCount(status: ApplicationStatus): number {
    return this.applications.filter(a => a.status === status).length;
  }

  getStatusLabel(status: ApplicationStatus): string {
    switch (status) {
      case ApplicationStatus.PENDING: return 'PENDING';
      case ApplicationStatus.ACCEPTED: return 'ACCEPTED';
      case ApplicationStatus.REJECTED: return 'REJECTED';
      default: return status;
    }
  }

  formatDate(dateStr: string | undefined): string {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }
}
