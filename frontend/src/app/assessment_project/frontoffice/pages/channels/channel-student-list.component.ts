import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Channel } from '../../../backoffice/models/channel.models';
import { ChannelService } from '../../../backoffice/services/channel.service';
import { AuthService } from '../../../shared/services/auth.service';
import { Subject, interval } from 'rxjs';
import { takeUntil, startWith, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-channel-student-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">

      <!-- Hero -->
      <div class="hero">
        <div class="hero-bg-orb orb1"></div>
        <div class="hero-bg-orb orb2"></div>
        <div class="hero-inner">
          <div class="hero-tag">📡 Canaux pédagogiques</div>
          <h1>Vos <span class="accent">Canaux</span> de Communication</h1>
          <p>Restez informé en temps réel. Rejoignez un canal pour recevoir les annonces, documents et ressources de vos enseignants.</p>
          <div class="hero-stats">
            <div class="hstat">
              <span class="hstat-num">{{ channels.length }}</span>
              <span class="hstat-lbl">Canaux disponibles</span>
            </div>
            <div class="hstat">
              <span class="hstat-num">{{ joinedCount }}</span>
              <span class="hstat-lbl">Canaux rejoints</span>
            </div>
            <div class="hstat live">
              <span class="live-indicator"><span class="live-dot"></span> LIVE</span>
              <span class="hstat-lbl">WebSocket actif</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="content-area">

        <!-- Section: Mes Canaux -->
        @if (joinedChannels.length > 0) {
          <div class="section">
            <h2 class="section-title">✅ Mes Canaux</h2>
            <div class="channels-grid">
              @for (ch of joinedChannels; track ch.id) {
                <div class="channel-card joined">
                  <div class="card-top">
                    <div class="ch-avatar joined-avatar">{{ ch.name.charAt(0) }}</div>
                    <div class="ch-meta">
                      <h3>{{ ch.name }}</h3>
                      <p>{{ ch.description || 'Canal pédagogique' }}</p>
                    </div>
                    <div class="member-badge">✓ Membre</div>
                  </div>
                  <div class="card-stats">
                    <span>👥 {{ ch.membersCount }} membres</span>
                    <span>•</span>
                    <span>📨 {{ ch.postsCount }} publications</span>
                  </div>
                  <div class="card-actions">
                    <a class="btn-view" [routerLink]="['/assessment/frontoffice/canaux', ch.id]">
                      👁️ Voir le canal
                    </a>
                    <button class="btn-leave" (click)="leave(ch)">Quitter</button>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Section: Découvrir -->
        <div class="section">
          <h2 class="section-title">🔍 Découvrir des Canaux</h2>

          @if (loading) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Chargement des canaux...</p>
            </div>
          } @else if (notJoinedChannels.length === 0 && joinedChannels.length > 0) {
            <div class="all-joined">
              <div class="aj-icon">🎉</div>
              <p>Vous avez rejoint tous les canaux disponibles !</p>
            </div>
          } @else if (channels.length === 0) {
            <div class="empty-state">
              <div class="empty-icon">📭</div>
              <p>Aucun canal disponible pour l'instant. <br/>Revenez plus tard !</p>
            </div>
          } @else {
            <div class="channels-grid">
              @for (ch of notJoinedChannels; track ch.id) {
                <div class="channel-card">
                  <div class="card-top">
                    <div class="ch-avatar">{{ ch.name.charAt(0) }}</div>
                    <div class="ch-meta">
                      <h3>{{ ch.name }}</h3>
                      <p>{{ ch.description || 'Canal pédagogique' }}</p>
                    </div>
                  </div>
                  <div class="previews">
                    <div class="preview-tag">🔒 Rejoindre pour accéder au contenu</div>
                  </div>
                  <div class="card-stats">
                    <span>👥 {{ ch.membersCount }} membres</span>
                    <span>•</span>
                    <span>📨 {{ ch.postsCount }} publications</span>
                  </div>
                  <button class="btn-join" (click)="join(ch)" [disabled]="joining.has(ch.id)">
                    @if (joining.has(ch.id)) { ⏳ Inscription... }
                    @else { ➕ Rejoindre le canal }
                  </button>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { box-sizing: border-box; }
    .page { font-family: 'Inter', sans-serif; min-height: 100vh; }

    /* Hero */
    .hero {
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%);
      padding: 4rem 2rem 3rem; position: relative; overflow: hidden;
    }
    .hero-bg-orb { position: absolute; border-radius: 50%; pointer-events: none; }
    .orb1 { width: 300px; height: 300px; background: rgba(99,102,241,0.15); top: -60px; right: -60px; }
    .orb2 { width: 200px; height: 200px; background: rgba(167,139,250,0.1); bottom: -40px; left: 10%; }
    .hero-inner { position: relative; z-index: 1; max-width: 900px; margin: 0 auto; }
    .hero-tag { display: inline-block; background: rgba(255,255,255,0.12); color: #c4b5fd; padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.85rem; font-weight: 700; margin-bottom: 1rem; }
    h1 { font-size: 2.5rem; font-weight: 900; color: white; margin: 0 0 0.75rem; }
    .accent { color: #a78bfa; }
    .hero p { color: rgba(255,255,255,0.7); font-size: 1rem; margin: 0 0 2rem; max-width: 600px; line-height: 1.6; }
    .hero-stats { display: flex; gap: 2rem; flex-wrap: wrap; }
    .hstat { display: flex; flex-direction: column; }
    .hstat-num { font-size: 1.8rem; font-weight: 900; color: white; }
    .hstat-lbl { font-size: 0.75rem; color: rgba(255,255,255,0.55); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .hstat.live { align-items: flex-start; }
    .live-indicator { display: flex; align-items: center; gap: 0.4rem; background: rgba(16,185,129,0.2); color: #6ee7b7; padding: 0.3rem 0.75rem; border-radius: 99px; font-size: 0.85rem; font-weight: 700; }
    .live-dot { width: 8px; height: 8px; border-radius: 50%; background: #6ee7b7; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(110,231,183,.4); } 50% { box-shadow: 0 0 0 6px rgba(110,231,183,0); } }

    /* Content */
    .content-area { padding: 2.5rem 2rem; max-width: 1200px; margin: 0 auto; }
    .section { margin-bottom: 3rem; }
    .section-title { font-size: 1.25rem; font-weight: 800; color: #1e293b; margin: 0 0 1.25rem; display: flex; align-items: center; gap: 0.5rem; }

    .loading-state { text-align: center; padding: 4rem; color: #64748b; }
    .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state, .all-joined { text-align: center; padding: 3rem; background: #f8fafc; border-radius: 16px; color: #64748b; }
    .empty-icon, .aj-icon { font-size: 3rem; margin-bottom: 0.75rem; }

    /* Grid */
    .channels-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.25rem; }

    .channel-card {
      background: white; border-radius: 18px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0; padding: 1.4rem;
      transition: all 0.25s;
    }
    .channel-card:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(0,0,0,0.1); }
    .channel-card.joined { border: 2px solid #a78bfa; }

    .card-top { display: flex; gap: 0.9rem; align-items: flex-start; margin-bottom: 1rem; }
    .ch-avatar {
      width: 48px; height: 48px; border-radius: 14px;
      background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
      color: #4f46e5; font-size: 1.3rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .ch-avatar.joined-avatar { background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; }
    .ch-meta { flex: 1; }
    .ch-meta h3 { font-size: 0.95rem; font-weight: 800; color: #1e293b; margin: 0 0 0.2rem; }
    .ch-meta p { font-size: 0.8rem; color: #94a3b8; margin: 0; line-height: 1.4; }
    .member-badge { background: #dcfce7; color: #15803d; padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.72rem; font-weight: 700; white-space: nowrap; }

    .previews { margin-bottom: 0.75rem; }
    .preview-tag { background: #f1f5f9; color: #64748b; padding: 0.4rem 0.75rem; border-radius: 8px; font-size: 0.75rem; font-weight: 600; display: inline-block; }

    .card-stats { font-size: 0.8rem; color: #94a3b8; margin-bottom: 1rem; display: flex; gap: 0.5rem; }
    .card-actions { display: flex; gap: 0.5rem; }

    .btn-join {
      width: 100%; background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: white; border: none; padding: 0.75rem 1rem;
      border-radius: 12px; font-weight: 700; font-size: 0.9rem;
      cursor: pointer; transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(99,102,241,0.3);
    }
    .btn-join:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(99,102,241,0.4); }
    .btn-join:disabled { opacity: 0.6; cursor: not-allowed; }

    .btn-view {
      flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.4rem;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: white; text-decoration: none; padding: 0.65rem 1rem;
      border-radius: 10px; font-weight: 700; font-size: 0.85rem;
      transition: all 0.2s;
    }
    .btn-view:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn-leave {
      background: #fef2f2; border: 2px solid #fecaca; color: #ef4444;
      padding: 0.6rem 0.9rem; border-radius: 10px; font-weight: 700;
      font-size: 0.82rem; cursor: pointer; transition: all 0.2s;
    }
    .btn-leave:hover { background: #fee2e2; }
  `]
})
export class ChannelStudentListComponent implements OnInit {
  channels: Channel[] = [];
  loading = true;
  joining = new Set<number>();
  private destroy$ = new Subject<void>();

  get joinedChannels(): Channel[] { return this.channels.filter(c => c.isMember); }
  get notJoinedChannels(): Channel[] { return this.channels.filter(c => !c.isMember); }
  get joinedCount(): number { return this.joinedChannels.length; }

  constructor(
    private svc: ChannelService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.setupRealTimeUpdates();
  }

  setupRealTimeUpdates(): void {
    const userId = this.auth.getCurrentUser()?.id;
    
    interval(5000).pipe(
      startWith(0),
      switchMap(() => this.svc.getAllChannels(userId)),
      takeUntil(this.destroy$)
    ).subscribe({
      next: data => { 
        this.channels = data; 
        this.loading = false; 
      },
      error: () => { 
        if (this.channels.length === 0) this.loading = false; 
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  join(ch: Channel): void {
    const userId = this.auth.getCurrentUser()?.id;
    if (!userId) return;

    this.joining.add(ch.id);
    this.svc.joinChannel(ch.id, userId).subscribe({
      next: () => {
        ch.isMember = true;
        ch.membersCount++;
        this.joining.delete(ch.id);
      },
      error: () => { this.joining.delete(ch.id); }
    });
  }

  leave(ch: Channel): void {
    const userId = this.auth.getCurrentUser()?.id;
    if (!userId) return;

    this.svc.leaveChannel(ch.id, userId).subscribe({
      next: () => {
        ch.isMember = false;
        if (ch.membersCount > 0) ch.membersCount--;
      }
    });
  }
}
