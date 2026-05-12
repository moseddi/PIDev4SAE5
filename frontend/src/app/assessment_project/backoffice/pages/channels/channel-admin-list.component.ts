import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Channel } from '../../models/channel.models';
import { ChannelService } from '../../services/channel.service';
import { AuthService } from '../../../shared/services/auth.service';
import { Subject, interval } from 'rxjs';
import { takeUntil, startWith, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-channel-admin-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-wrap">

      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">
            <span class="title-icon">📡</span>
            Gestion des Canaux
          </h1>
          <p class="page-sub">Communication temps réel avec vos étudiants via WebSocket</p>
        </div>
        <button class="btn-create" (click)="showCreate = true">
          <span>＋</span> Nouveau Canal
        </button>
      </div>

      <!-- Live indicator -->
      <div class="live-bar">
        <span class="live-dot"></span>
        <span>WebSocket actif — Messages diffusés en temps réel via <code>/topic/channel/&#123;id&#125;</code></span>
      </div>

      <!-- Create Modal -->
      @if (showCreate) {
        <div class="modal-overlay" (click)="showCreate = false">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>📡 Créer un nouveau canal</h2>
              <button class="modal-close" (click)="showCreate = false">✕</button>
            </div>
            <div class="modal-body">
              <div class="field">
                <label>Nom du canal *</label>
                <input [(ngModel)]="newName" type="text" placeholder="Ex: Master MS 2026, Révisions Examens..." />
              </div>
              <div class="field">
                <label>Description</label>
                <textarea [(ngModel)]="newDesc" rows="3"
                  placeholder="Décrivez l'objectif de ce canal pédagogique..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" (click)="showCreate = false">Annuler</button>
              <button class="btn-submit" (click)="createChannel()" [disabled]="!newName.trim() || creating">
                @if (creating) { <span class="spinner-sm"></span> Création... }
                @else { 📡 Créer le canal }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Channels Grid -->
      @if (loading) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Chargement des canaux...</p>
        </div>
      } @else if (channels.length === 0) {
        <div class="empty-state">
          <div class="empty-icon">📡</div>
          <h3>Aucun canal créé</h3>
          <p>Créez votre premier canal pour commencer à communiquer avec vos étudiants en temps réel.</p>
          <button class="btn-create" (click)="showCreate = true">＋ Créer mon premier canal</button>
        </div>
      } @else {
        <div class="channels-grid">
          @for (ch of channels; track ch.id) {
            <div class="channel-card">
              <div class="channel-card-top">
                <div class="channel-avatar">{{ ch.name.charAt(0).toUpperCase() }}</div>
                <div class="channel-meta">
                  <h3>{{ ch.name }}</h3>
                  <p>{{ ch.description || 'Aucune description' }}</p>
                </div>
              </div>
              <div class="channel-stats">
                <span class="stat"><span class="stat-num">{{ ch.membersCount }}</span> membres</span>
                <span class="stat-sep">•</span>
                <span class="stat"><span class="stat-num">{{ ch.postsCount }}</span> publications</span>
              </div>
              <div class="channel-actions">
                <!-- On utilise le préfixe /backoffice/admin si on intègre dans le grand dashboard -->
                <a class="btn-manage" [routerLink]="['/backoffice/admin/channels', ch.id]">
                  ⚙️ Gérer
                </a>
                <button class="btn-delete" (click)="confirmDelete(ch)">🗑️</button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Delete confirm -->
      @if (toDelete) {
        <div class="modal-overlay" (click)="toDelete = null">
          <div class="modal-card danger" (click)="$event.stopPropagation()">
            <div class="modal-header danger">
              <h2>⚠️ Supprimer le canal ?</h2>
              <button class="modal-close" (click)="toDelete = null">✕</button>
            </div>
            <div class="modal-body">
              <p>Vous allez supprimer le canal <strong>"{{ toDelete.name }}"</strong> et toutes ses publications.</p>
              <p class="warn-text">Cette action est irréversible.</p>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" (click)="toDelete = null">Annuler</button>
              <button class="btn-danger-confirm" (click)="deleteChannel()">🗑️ Supprimer définitivement</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { box-sizing: border-box; }
    .page-wrap { font-family: 'Inter', sans-serif; padding: 2rem; max-width: 1200px; margin: 0 auto; }

    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; gap: 1rem; }
    .page-title { font-size: 1.9rem; font-weight: 900; color: #1e293b; margin: 0 0 0.25rem; display: flex; align-items: center; gap: 0.6rem; }
    .title-icon { font-size: 2rem; }
    .page-sub { color: #64748b; font-size: 0.9rem; margin: 0; }

    .btn-create {
      display: flex; align-items: center; gap: 0.5rem;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: white; border: none; padding: 0.75rem 1.5rem;
      border-radius: 12px; font-weight: 700; font-size: 0.95rem;
      cursor: pointer; white-space: nowrap;
      box-shadow: 0 4px 14px rgba(99,102,241,0.35);
      transition: all 0.2s;
    }
    .btn-create:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(99,102,241,0.4); }

    .live-bar {
      display: flex; align-items: center; gap: 0.75rem;
      background: linear-gradient(135deg, #f0fdf4, #dcfce7);
      border: 1px solid #86efac; border-radius: 10px;
      padding: 0.75rem 1.25rem; margin-bottom: 2rem;
      font-size: 0.85rem; color: #166534; font-weight: 600;
    }
    .live-dot {
      width: 10px; height: 10px; border-radius: 50%;
      background: #16a34a; flex-shrink: 0;
      animation: pulse-green 1.5s infinite;
    }
    @keyframes pulse-green {
      0%, 100% { box-shadow: 0 0 0 0 rgba(22,163,74,0.4); }
      50% { box-shadow: 0 0 0 6px rgba(22,163,74,0); }
    }
    code { background: rgba(22,163,74,0.1); padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; }

    .loading-state, .empty-state { text-align: center; padding: 5rem 2rem; color: #64748b; }
    .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-icon { font-size: 4rem; margin-bottom: 1rem; }
    .empty-state h3 { font-size: 1.4rem; font-weight: 800; color: #1e293b; margin-bottom: 0.5rem; }
    .empty-state p { max-width: 400px; margin: 0 auto 1.5rem; }

    .channels-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
    .channel-card {
      background: white; border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.07);
      border: 1px solid #e2e8f0; padding: 1.5rem;
      transition: all 0.25s;
    }
    .channel-card:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(0,0,0,0.12); }
    .channel-card-top { display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 1rem; }
    .channel-avatar {
      width: 52px; height: 52px; border-radius: 14px;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: white; font-size: 1.4rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .channel-meta h3 { font-size: 1rem; font-weight: 800; color: #1e293b; margin: 0 0 0.25rem; }
    .channel-meta p { font-size: 0.82rem; color: #94a3b8; margin: 0; line-height: 1.4; }
    .channel-stats { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.25rem; font-size: 0.82rem; color: #64748b; }
    .stat-num { font-weight: 800; color: #6366f1; }
    .stat-sep { color: #cbd5e1; }
    .channel-actions { display: flex; gap: 0.5rem; }
    .btn-manage {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.4rem;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: white; text-decoration: none; padding: 0.6rem 1rem;
      border-radius: 10px; font-weight: 700; font-size: 0.85rem;
      transition: all 0.2s;
    }
    .btn-manage:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-delete {
      width: 40px; height: 40px; border: 2px solid #fecaca; background: #fef2f2;
      color: #ef4444; border-radius: 10px; cursor: pointer; font-size: 1rem;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.2s;
    }
    .btn-delete:hover { background: #fee2e2; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 1rem; }
    .modal-card { background: white; border-radius: 20px; width: 100%; max-width: 500px; box-shadow: 0 20px 60px rgba(0,0,0,0.25); overflow: hidden; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid #f1f5f9; background: #f8fafc; }
    .modal-header h2 { font-size: 1.1rem; font-weight: 800; color: #1e293b; margin: 0; }
    .modal-header.danger { background: #fef2f2; }
    .modal-close { background: none; border: none; font-size: 1.1rem; color: #94a3b8; cursor: pointer; padding: 0.25rem; }
    .modal-body { padding: 1.5rem; }
    .field { margin-bottom: 1.25rem; }
    .field label { display: block; font-weight: 700; font-size: 0.85rem; color: #374151; margin-bottom: 0.5rem; }
    .field input, .field textarea {
      width: 100%; border: 2px solid #e2e8f0; border-radius: 10px;
      padding: 0.75rem 1rem; font-size: 0.9rem; font-family: inherit;
      transition: border-color 0.2s; outline: none; resize: vertical;
    }
    .field input:focus, .field textarea:focus { border-color: #6366f1; }
    .modal-footer { padding: 1.25rem 1.5rem; border-top: 1px solid #f1f5f9; display: flex; gap: 0.75rem; justify-content: flex-end; }
    .btn-cancel { background: #f1f5f9; border: none; padding: 0.7rem 1.5rem; border-radius: 10px; font-weight: 700; color: #64748b; cursor: pointer; }
    .btn-submit {
      background: linear-gradient(135deg, #6366f1, #4f46e5); color: white;
      border: none; padding: 0.7rem 1.5rem; border-radius: 10px; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; gap: 0.5rem;
    }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
    .spinner-sm { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }
    .warn-text { color: #ef4444; font-size: 0.85rem; font-weight: 600; margin-top: 0.5rem; }
    .btn-danger-confirm { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; border: none; padding: 0.7rem 1.5rem; border-radius: 10px; font-weight: 700; cursor: pointer; }
  `]
})
export class ChannelAdminListComponent implements OnInit {
  channels: Channel[] = [];
  loading = true;
  showCreate = false;
  creating = false;
  newName = '';
  newDesc = '';
  toDelete: Channel | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private svc: ChannelService, 
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.setupRealTimeUpdates();
  }

  setupRealTimeUpdates(): void {
    interval(5000).pipe(
      startWith(0),
      switchMap(() => this.svc.getAllChannels()),
      takeUntil(this.destroy$)
    ).subscribe({
      next: data => { this.channels = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createChannel(): void {
    if (!this.newName.trim()) return;
    this.creating = true;
    const currentUserId = this.auth.getCurrentUser()?.id || 1;
    this.svc.createChannel({ 
      name: this.newName.trim(), 
      description: this.newDesc.trim(),
      createdBy: currentUserId
    }).subscribe({
      next: (ch) => {
        this.channels.unshift(ch);
        this.showCreate = false;
        this.newName = '';
        this.newDesc = '';
        this.creating = false;
      },
      error: () => { this.creating = false; }
    });
  }

  confirmDelete(ch: Channel): void {
    this.toDelete = ch;
  }

  deleteChannel(): void {
    if (!this.toDelete) return;
    this.svc.deleteChannel(this.toDelete.id).subscribe({
      next: () => {
        this.channels = this.channels.filter(c => c.id !== this.toDelete!.id);
        this.toDelete = null;
      }
    });
  }
}
