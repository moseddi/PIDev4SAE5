import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Channel, ChannelPost, ChannelComment, PostType } from '../../../backoffice/models/channel.models';
import { ChannelService } from '../../../backoffice/services/channel.service';
import { ChannelWebSocketService } from '../../../backoffice/services/channel-websocket.service';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-channel-student-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-container">

      <!-- Premium App Header -->
      <header class="app-header" *ngIf="channel">
        <div class="header-left">
          <button class="icon-btn back-btn" (click)="goBack()">
            <i class="bi bi-chevron-left"></i>
          </button>
          <div class="header-user">
            <div class="avatar-wrapper">
              <div class="header-avatar">{{ channel.name.charAt(0) }}</div>
              <div class="status-indicator"></div>
            </div>
            <div class="header-meta">
              <h1 class="header-title">{{ channel.name }}</h1>
              <span class="header-subtitle">{{ channel.membersCount | number }} membres</span>
            </div>
          </div>
        </div>
        <div class="header-right">
          <button class="btn-leave" *ngIf="isMember" (click)="leave()">
            <i class="bi bi-box-arrow-right"></i> Quitter
          </button>
          <button class="icon-btn notif-btn">
            <i class="bi bi-bell"></i>
          </button>
        </div>
      </header>

      <!-- Chat Feed -->
      <main class="chat-body" #scrollFrame>
        
        <!-- Welcome / Loading State -->
        <div *ngIf="loadingPosts" class="chat-loader">
          <div class="spinner"></div>
        </div>

        <div *ngIf="!loadingPosts && posts.length === 0" class="empty-feed">
          <div class="empty-illu">💬</div>
          <p>Bienvenue dans ce canal ! Attendez le premier message de votre enseignant.</p>
        </div>

        <div class="messages-list" *ngIf="!loadingPosts && posts.length > 0">
          
          <!-- Hero Intro Section (KARMA Style) -->
          <div class="channel-intro" *ngIf="channel">
            <div class="intro-avatar-bg">
              <div class="intro-avatar">{{ channel.name.charAt(0) }}</div>
            </div>
            <h2 class="intro-name">{{ channel.name }} ♟️</h2>
            <div class="intro-handle">&#64;{{ channel.name.toLowerCase().replace(' ', '_') }} • {{ channel.membersCount | number }} membres</div>
            
            <div class="intro-actions">
              <div class="intro-action-item" (click)="inviteModal = true">
                <div class="action-circle"><i class="bi bi-link-45deg"></i></div>
                <span>Lien d'invitation</span>
              </div>
              <div class="intro-action-item" (click)="shareModal = true">
                <div class="action-circle"><i class="bi bi-plus-lg"></i></div>
                <span>Partager</span>
              </div>
              <div class="intro-action-item" (click)="detailsModal = true">
                <div class="action-circle"><i class="bi bi-info-circle"></i></div>
                <span>Voir les détails</span>
              </div>
            </div>

            <div class="intro-divider">
              <span>{{ formatDay(posts[posts.length-1].createdAt) }}</span>
            </div>
            
            <div class="system-logs">
              <p>L'enseignant a nommé le canal <strong>{{ channel.name }}</strong> ❄️.</p>
              <p>Le thème a été personnalisé pour ce groupe.</p>
            </div>
          </div>

          @for (post of posts; track post.id; let i = $index) {
            
            <!-- Date Separator (Simplified) -->
            <div class="date-sep" *ngIf="i === 0 || isNewDay(posts[i-1].createdAt, post.createdAt)">
              {{ formatDay(post.createdAt) }}
            </div>

            <div class="msg-rowprof">
              <div class="msg-avatar">👨‍🏫</div>
              <div class="msg-content-wrapper">
                <div class="msg-bubble" [class]="'type-' + post.type.toLowerCase()">
                  
                  <!-- Post Type Specific Rendering -->
                  
                  <!-- IMAGE -->
                  <div class="bubble-media" *ngIf="post.type === 'IMAGE' && post.fileUrl">
                    <img [src]="post.fileUrl" class="bubble-img" alt="Post content" />
                  </div>

                  <!-- AUDIO -->
                  <div class="bubble-audio" *ngIf="post.type === 'AUDIO' && post.fileUrl">
                    <button class="audio-play-btn"><i class="bi bi-play-fill"></i></button>
                    <div class="audio-visualizer">
                      <div class="wave-bar" *ngFor="let b of [1,2,3,4,5,6,7,8,9,10]" [style.height.px]="getRandomHeight()"></div>
                    </div>
                    <span class="audio-timer">0:{{ i % 10 + 20 }}</span>
                  </div>

                  <!-- PDF / DOCUMENT -->
                  <a class="bubble-doc" *ngIf="post.type === 'PDF' && post.fileUrl" [href]="post.fileUrl" target="_blank" download>
                    <div class="doc-icon">📄</div>
                    <div class="doc-info">
                      <span class="doc-name">{{ post.fileName || 'document.pdf' }}</span>
                      <span class="doc-size">PDF Document</span>
                    </div>
                    <div class="doc-dl"><i class="bi bi-download"></i></div>
                  </a>

                  <!-- LINK -->
                  <a class="bubble-link" *ngIf="post.type === 'LINK' && post.linkUrl" [href]="post.linkUrl" target="_blank">
                    <div class="link-prev">
                      <i class="bi bi-link-45deg"></i>
                    </div>
                    <div class="link-data">
                      <span class="link-url">{{ post.linkUrl }}</span>
                      <span class="link-hint">Ouvrir le lien</span>
                    </div>
                  </a>

                  <!-- TEXT CONTENT -->
                  <div class="bubble-text" *ngIf="post.content">
                    {{ post.content }}
                  </div>

                  <!-- Msg Timestamp -->
                  <div class="bubble-time">{{ formatTimeShort(post.createdAt) }}</div>
                </div>

                <!-- Reaction Row (Match Screenshot) -->
                <div class="reaction-row" [class.locked]="!isMember">
                  <button class="react-btn" (click)="toggleComments(post)" [disabled]="!isMember" [title]="!isMember ? 'Rejoignez pour répondre' : ''">
                    <i class="bi bi-arrow-90deg-left"></i> {{ post.commentsCount }}
                  </button>
                  <button class="react-btn" [class.active]="post.liked" (click)="like(post)" [disabled]="!isMember" [title]="!isMember ? 'Rejoignez pour liker' : ''">
                    ❤️ {{ post.likesCount }}
                  </button>
                  <button class="react-btn share-btn" (click)="share(post)" [disabled]="!isMember" [title]="!isMember ? 'Rejoignez pour partager' : ''">
                    <i class="bi bi-share"></i>
                  </button>
                </div>

                <!-- Comments Display (Nested in feed like chat) -->
                <div class="chat-comments" *ngIf="isMember && openComments.has(post.id)">
                  @for (c of (commentsMap[post.id] || post.comments || []); track c.id) {
                    <div class="chat-comment">
                       <span class="comment-user">{{ c.authorName }}:</span> {{ c.content }}
                    </div>
                  }
                  <div class="comment-input-area">
                    <input [(ngModel)]="commentTexts[post.id]" (keyup.enter)="submitComment(post)" placeholder="Votre réponse..." />
                    <button (click)="submitComment(post)"><i class="bi bi-send"></i></button>
                  </div>
                </div>

              </div>
            </div>
          }
        </div>
      </main>

      <!-- Non-Member Floating CTA -->
      <footer class="chat-footer" *ngIf="!isMember">
        <div class="join-card">
          <div class="join-info">
            <i class="bi bi-lock-fill"></i>
            <div>
              <strong>Canal Privé</strong>
              <p>Rejoignez pour réagir et recevoir les notifications.</p>
            </div>
          </div>
          <button class="btn-join-action" (click)="join()" [disabled]="joining">
            Rejoindre
          </button>
        </div>
      </footer>

      <!-- Details Modal (Full Screen Reference) -->
      <div class="details-overlay" [class.open]="detailsModal">
        <div class="details-header-sticky">
           <button class="icon-btn" (click)="detailsModal = false"><i class="bi bi-chevron-left"></i></button>
           <span>Détails du canal</span>
           <div style="width: 40px"></div>
        </div>

        <div class="details-content" *ngIf="channel">
           <div class="details-hero">
              <div class="details-avatar">{{ channel.name.charAt(0) }}</div>
              <h2 class="details-name">{{ channel.name }} ♟️</h2>
              <div class="details-stats">&#64;{{ channel.name.toLowerCase().replace(' ', '_') }} • {{ channel.membersCount | number }} membres</div>
           </div>

           <div class="details-quick-actions">
              <div class="qa-item"><i class="bi bi-search"></i><span>Rechercher</span></div>
              <div class="qa-item"><i class="bi bi-bell"></i><span>Notifications</span></div>
              <div class="qa-item"><i class="bi bi-three-dots"></i><span>Options</span></div>
           </div>

           <div class="details-list">
              <div class="dl-item" (click)="inviteModal = true">
                 <i class="bi bi-link-45deg"></i>
                 <div class="dl-text">
                    <strong>Lien d'invitation</strong>
                    <span>localhost:4200/assessment/frontoffice/canaux/{{channelId}}</span>
                 </div>
                 <i class="bi bi-chevron-right"></i>
              </div>
              <div class="dl-item">
                 <i class="bi bi-people"></i>
                 <div class="dl-text">
                    <strong>Personnes</strong>
                    <span>{{ channel.membersCount }} membres actifs</span>
                 </div>
                 <i class="bi bi-chevron-right"></i>
              </div>
           </div>

           <!-- Media Gallery Tabs -->
           <div class="gallery-tabs">
              <button [class.active]="detailsTab === 'media'" (click)="detailsTab = 'media'">
                 <i class="bi bi-images"></i>
              </button>
              <button [class.active]="detailsTab === 'links'" (click)="detailsTab = 'links'">
                 <i class="bi bi-link-45deg"></i>
              </button>
           </div>

           <div class="gallery-content">
              <!-- Media Grid -->
              <div class="media-grid" *ngIf="detailsTab === 'media'">
                 @for (p of mediaPosts; track p.id) {
                    <div class="grid-item">
                       <img *ngIf="p.type === 'IMAGE'" [src]="p.fileUrl" />
                       <div *ngIf="p.type === 'PDF'" class="pdf-icon">📄<br>PDF</div>
                       <div *ngIf="p.type === 'AUDIO'" class="audio-icon">🎵<br>Audio</div>
                    </div>
                 }
                 <div *ngIf="mediaPosts.length === 0" class="no-media">Aucun média partagé</div>
              </div>

              <!-- Links List -->
              <div class="links-list" *ngIf="detailsTab === 'links'">
                 @for (p of linkPosts; track p.id) {
                    <a [href]="p.linkUrl" target="_blank" class="link-item">
                       <i class="bi bi-link-45deg"></i>
                       <span>{{ p.linkUrl }}</span>
                    </a>
                 }
                 <div *ngIf="linkPosts.length === 0" class="no-media">Aucun lien partagé</div>
              </div>
           </div>
        </div>
      </div>

      <!-- Share Modal -->
      <div class="modal-overlay" *ngIf="shareModal" (click)="shareModal = false">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Partager via</h2>
            <button class="close-modal" (click)="shareModal = false">✕</button>
          </div>
          <div class="modal-body">
            <div class="share-grid">
              <a class="share-item whatsapp" href="https://wa.me/?text=Regardez cette publication !" target="_blank">
                <div class="share-icon"><i class="bi bi-whatsapp"></i></div>
                <span>WhatsApp</span>
              </a>
              <a class="share-item messenger" href="fb-messenger://share/?link=localhost:4200" target="_blank">
                <div class="share-icon"><i class="bi bi-messenger"></i></div>
                <span>Messenger</span>
              </a>
              <a class="share-item email" href="mailto:?subject=Publication Canal&body=Regardez ca !">
                <div class="share-icon"><i class="bi bi-envelope-fill"></i></div>
                <span>Email</span>
              </a>
              <div class="share-item copy" (click)="copyLink()">
                <div class="share-icon"><i class="bi bi-link-45deg"></i></div>
                <span>Lien</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Invite Link Overlay -->
      <div class="invite-overlay" [class.open]="inviteModal">
        <div class="details-header-sticky" style="border-bottom: 1px solid var(--border);">
           <button class="icon-btn" (click)="inviteModal = false"><i class="bi bi-chevron-left"></i></button>
           <span style="flex: 1; text-align: center; font-size: 1.1rem; margin-right: 40px;">Lien d'invitation</span>
        </div>

        <div class="invite-content">
           <div class="invite-header-info">
             <strong>Lien d'invitation</strong>
             <span class="invite-url">http://localhost:4200/assessment/frontoffice/canaux/{{channelId}}</span>
             <p class="invite-desc">
               Tout le monde peut prévisualiser et rejoindre ce canal grâce à ce lien. <span class="link-primary">En savoir plus</span>
             </p>
           </div>
           
           <div class="invite-actions-list">
             <div class="invite-action-item" (click)="copyLink()">
               <i class="bi bi-copy"></i>
               <span>Copier</span>
             </div>
             <div class="invite-action-item" (click)="showQrCode()">
               <i class="bi bi-qr-code-scan"></i>
               <span>Code QR</span>
             </div>
           </div>
        </div>
      </div>

      <!-- QR Code Modal (Centered Overlay) -->
      <div class="qr-overlay" *ngIf="qrModal" (click)="qrModal = false">
        <div class="qr-central-card" (click)="$event.stopPropagation()">
          
          <div class="qr-card-inner">
            <div class="qr-header-avatar">
              <div class="qr-avatar-circle">{{ channel?.name?.charAt(0) }}</div>
            </div>

            <h2 class="qr-name">&#64; {{ channel?.name }} ♟️</h2>
            <div class="qr-handle">{{ channel?.name?.toLowerCase()?.replace(' ', '_') }} <i class="bi bi-patch-check-fill text-primary"></i></div>

            <div class="qr-image-box">
              <img [src]="'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + getInviteUrl()" alt="QR" />
            </div>
          </div>

          <!-- Color Dots -->
          <div class="qr-colors">
            <div class="dot gradient"></div>
            <div class="dot purple"></div>
            <div class="dot blue"></div>
            <div class="dot teal"></div>
            <div class="dot black"></div>
          </div>

          <p class="qr-instructions">
            Tout le monde peut scanner ce code QR avec son smartphone pour rejoindre ce canal.
          </p>

          <!-- Action Buttons -->
          <div class="qr-actions">
            <button class="qr-action-btn primary-action">Partager le code QR</button>
            <button class="qr-action-btn secondary-action">Enregistrer sur la pellicule</button>
            <button class="qr-action-btn close-action" (click)="qrModal = false">Terminé</button>
          </div>

        </div>
      </div>

    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

    :host {
      --primary: #5c4df2;
      --bg: #f8f9fc;
      --bubble-bg: #ffffff;
      --text-main: #1a1d23;
      --text-muted: #8d94a0;
      --border: rgba(0,0,0,0.06);
    }

    * { box-sizing: border-box; }

    .chat-container {
      font-family: 'Plus Jakarta Sans', sans-serif;
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--bg);
      color: var(--text-main);
      position: relative;
    }

    /* Header */
    .app-header {
      background: white;
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .header-left { display: flex; align-items: center; gap: 0.5rem; }
    .icon-btn {
      width: 40px; height: 40px; border: none; background: transparent;
      font-size: 1.25rem; border-radius: 50%; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.2s;
    }
    .icon-btn:hover { background: rgba(0,0,0,0.05); }
    .header-user { display: flex; align-items: center; gap: 0.75rem; }
    .avatar-wrapper { position: relative; }
    .header-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: linear-gradient(135deg, #FF6B6B, #5c4df2);
      color: white; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
    }
    .status-indicator {
      position: absolute; bottom: 0; right: 0; width: 12px; height: 12px;
      border: 2px solid white; background: #22c55e; border-radius: 50%;
    }
    .header-meta { display: flex; flex-direction: column; }
    .header-title { font-size: 0.95rem; font-weight: 800; margin: 0; display: flex; align-items: center; gap: 4px; }
    .header-title::after { content: '✔️'; font-size: 0.7rem; color: #5c4df2; } /* Verified look */
    .header-subtitle { font-size: 0.75rem; color: var(--text-muted); font-weight: 500; }

    .btn-leave {
      background: #fef2f2; color: #ef4444; border: 1px solid #fee2e2;
      padding: 6px 14px; border-radius: 12px; font-size: 0.82rem; font-weight: 700;
      display: flex; align-items: center; gap: 6px; cursor: pointer;
      transition: all 0.2s; margin-right: 8px;
    }
    .btn-leave:hover { background: #fee2e2; transform: translateY(-1px); }
    .btn-leave i { font-size: 1rem; }

    /* Chat Body */
    .chat-body {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
    }

    .date-sep {
      text-align: center;
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--text-muted);
      margin: 1.5rem 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .msg-rowprof {
      display: flex;
      gap: 10px;
      margin-bottom: 1.5rem;
      max-width: 85%;
    }
    .msg-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: #eee; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; margin-top: auto;
    }
    .msg-content-wrapper { display: flex; flex-direction: column; gap: 4px; }

    /* Message Bubble */
    .msg-bubble {
      background: var(--bubble-bg);
      padding: 12px 14px;
      border-radius: 20px 20px 20px 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.04);
      position: relative;
    }

    .bubble-img {
      width: 100%; border-radius: 12px; margin-bottom: 8px;
      display: block; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .bubble-audio {
      display: flex; align-items: center; gap: 12px;
      background: #f1f3f5; padding: 10px; border-radius: 12px; margin-bottom: 8px;
    }
    .audio-play-btn {
      width: 36px; height: 36px; border-radius: 50%; border: none;
      background: white; color: black; display: flex; align-items: center; justify-content: center;
      cursor: pointer; box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .audio-visualizer { flex: 1; display: flex; align-items: center; gap: 2px; height: 20px; }
    .wave-bar { width: 3px; background: #666; border-radius: 2px; transition: height 0.2s; }
    .audio-timer { font-size: 0.75rem; color: #555; font-weight: 500; }

    .bubble-doc {
      display: flex; align-items: center; gap: 12px; text-decoration: none;
      background: #fff5f5; border: 1px solid #ffe5e5; padding: 10px; border-radius: 12px; margin-bottom: 8px;
    }
    .doc-icon { font-size: 1.5rem; }
    .doc-info { flex: 1; display: flex; flex-direction: column; }
    .doc-name { font-size: 0.85rem; font-weight: 700; color: #333; }
    .doc-size { font-size: 0.72rem; color: #999; }
    .doc-dl { color: #5c4df2; }

    .bubble-text { font-size: 0.95rem; line-height: 1.5; color: #333; }
    .bubble-time { font-size: 0.65rem; color: var(--text-muted); text-align: right; margin-top: 4px; }

    /* Reactions (Screenshot Style) */
    .reaction-row {
      display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px;
    }
    .react-btn {
      background: white; border: 1px solid var(--border);
      padding: 4px 10px; border-radius: 10px;
      font-size: 0.8rem; font-weight: 600; color: #444;
      cursor: pointer; display: flex; align-items: center; gap: 4px;
      transition: all 0.2s;
    }
    .react-btn:hover { background: #f0f0f0; }
    .react-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .react-btn.active { color: #f22e62; border-color: #ffccd5; background: #fff5f7; }
    .more-btn { color: var(--text-muted); }
    .reaction-row.locked { opacity: 0.7; }

    /* Floating Footer */
    .chat-footer {
      padding: 1rem; position: absolute; bottom: 0; left: 0; width: 100%;
      background: linear-gradient(0deg, white, transparent);
      z-index: 10;
    }
    .join-card {
      background: white; border-radius: 18px; padding: 1rem;
      box-shadow: 0 -10px 40px rgba(0,0,0,0.1);
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
      border: 1px solid var(--border);
    }
    .join-info { display: flex; align-items: center; gap: 1rem; }
    .join-info i { font-size: 1.5rem; color: #5c4df2; }
    .join-info strong { font-size: 0.9rem; display: block; }
    .join-info p { margin: 0; font-size: 0.75rem; color: var(--text-muted); }
    .btn-join-action {
      background: var(--primary); color: white; border: none;
      padding: 0.75rem 1.5rem; border-radius: 14px; font-weight: 700; cursor: pointer;
    }

    /* Small Components */
    .chat-comments {
      background: rgba(0,0,0,0.02); border-radius: 12px; margin-top: 8px; padding: 8px;
    }
    .chat-comment { font-size: 0.82rem; margin-bottom: 4px; line-height: 1.3; }
    .comment-user { font-weight: 800; color: var(--primary); }
    .comment-input-area { display: flex; gap: 5px; margin-top: 8px; }
    .comment-input-area input { flex: 1; border: 1px solid #ddd; border-radius: 20px; padding: 5px 12px; font-size: 0.8rem; }
    .comment-input-area button { border: none; background: none; color: var(--primary); cursor: pointer; }

    .chat-loader { display: flex; justify-content: center; padding: 2rem; }
    .spinner { width: 30px; height: 30px; border: 3px solid #ddd; border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-feed {
       text-align: center; margin-top: 3rem; color: var(--text-muted);
    }
    .empty-illu { font-size: 4rem; opacity: 0.2; margin-bottom: 1rem; }
    
    /* Hero Intro (KARMA Style) */
    .channel-intro {
      display: flex; flex-direction: column; align-items: center;
      padding: 3rem 1rem 2rem; text-align: center;
      background: linear-gradient(180deg, rgba(0,0,0,0.03) 0%, transparent 100%);
      margin-bottom: 2rem; border-radius: 0 0 40px 40px;
    }
    .intro-avatar-bg {
      width: 100px; height: 100px; border-radius: 50%;
      padding: 4px; background: white; box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      margin-bottom: 1.5rem;
    }
    .intro-avatar {
      width: 100%; height: 100%; border-radius: 50%;
      background: linear-gradient(135deg, #1e293b, #475569);
      color: white; font-size: 2.5rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
    }
    .intro-name { font-size: 1.6rem; font-weight: 800; margin: 0 0 0.5rem; }
    .intro-handle { font-size: 0.85rem; color: var(--text-muted); font-weight: 600; margin-bottom: 2rem; }
    
    .intro-actions { display: flex; gap: 2.5rem; margin-bottom: 2.5rem; }
    .intro-action-item { display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; }
    .action-circle {
      width: 50px; height: 50px; border-radius: 50%;
      background: white; border: 1px solid var(--border);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.4rem; color: var(--text-main);
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
      transition: all 0.2s;
    }
    .intro-action-item:hover .action-circle { transform: translateY(-3px); background: var(--bg); }
    .intro-action-item span { font-size: 0.72rem; font-weight: 700; color: var(--text-muted); max-width: 60px; line-height: 1.2; }

    .intro-divider {
      width: 100%; display: flex; align-items: center; gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .intro-divider::before, .intro-divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
    .intro-divider span { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); }

    .system-logs { display: flex; flex-direction: column; gap: 6px; }
    .system-logs p { margin: 0; font-size: 0.8rem; color: var(--text-muted); font-weight: 500; }
    .system-logs strong { color: var(--text-main); }

    /* Modal Share */
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal-card {
      background: white; width: 90%; max-width: 400px; border-radius: 24px;
      overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.2); animation: slideUp 0.3s ease;
    }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .modal-header {
      padding: 1.25rem; display: flex; justify-content: space-between; align-items: center;
      border-bottom: 1px solid var(--border);
    }
    .modal-header h2 { margin: 0; font-size: 1.1rem; font-weight: 800; }
    .close-modal { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: #999; }
    
    .modal-body { padding: 1.5rem; }
    .share-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
    .share-item {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      text-decoration: none; color: var(--text-main); font-size: 0.75rem; font-weight: 600;
      cursor: pointer;
    }
    .share-icon {
      width: 50px; height: 50px; border-radius: 16px; 
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; color: white; transition: transform 0.2s;
    }
    .share-item:hover .share-icon { transform: scale(1.1); }
    
    .whatsapp .share-icon { background: #25D366; }
    .messenger .share-icon { background: #0084FF; }
    .email .share-icon { background: #f43f5e; }
    .copy .share-icon { background: #64748b; }
    
    /* Invite Overlay */
    .invite-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: white; z-index: 3000;
      transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex; flex-direction: column;
    }
    .invite-overlay.open { transform: translateX(0); }
    
    .invite-content { padding: 1.5rem; }
    .invite-header-info { border-bottom: 1px solid var(--border); padding-bottom: 1.5rem; margin-bottom: 1rem; }
    .invite-header-info strong { font-size: 1rem; color: var(--text-main); display: block; margin-bottom: 4px; }
    .invite-url { font-size: 0.9rem; color: var(--text-muted); display: block; margin-bottom: 1rem; word-break: break-all; }
    .invite-desc { font-size: 0.85rem; color: var(--text-muted); margin: 0; line-height: 1.4; }
    .link-primary { color: var(--primary); cursor: pointer; }
    
    .invite-actions-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .invite-action-item {
      display: flex; align-items: center; gap: 1rem; padding: 1rem 0;
      font-size: 1.05rem; font-weight: 500; color: var(--text-main); cursor: pointer;
    }
    .invite-action-item i { font-size: 1.4rem; width: 28px; text-align: center; }
    
    /* QR Modal (Refined) */
    .qr-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.5); backdrop-filter: blur(8px);
      z-index: 4000; display: flex; align-items: center; justify-content: center;
      animation: fadeIn 0.3s ease;
    }
    .qr-central-card {
      background: white; width: 90%; max-width: 380px; border-radius: 35px;
      overflow: hidden; box-shadow: 0 30px 60px rgba(0,0,0,0.3);
      display: flex; flex-direction: column; align-items: center;
    }
    .qr-card-inner {
      width: 85%; background: white; border-radius: 25px; padding: 2.5rem 1.5rem 1.5rem;
      box-shadow: 0 10px 40px rgba(0,0,0,0.06); margin-top: 3rem; position: relative;
      border: 1px solid rgba(0,0,0,0.03); text-align: center;
    }
    .qr-header-avatar {
      position: absolute; top: -35px; left: 50%; transform: translateX(-50%);
      width: 70px; height: 70px; border-radius: 50%; padding: 4px; background: white;
    }
    .qr-avatar-circle {
      width: 100%; height: 100%; border-radius: 50%;
      background: #1e293b; color: white; display: flex; align-items: center; justify-content: center;
      font-size: 1.8rem; font-weight: 800;
    }
    .qr-name { font-size: 1.3rem; margin: 0 0 4px; font-weight: 800; }
    .qr-handle { font-size: 0.85rem; color: var(--text-muted); font-weight: 600; margin-bottom: 1.5rem; }
    .qr-image-box img { width: 180px; height: 180px; }

    .qr-colors { display: flex; gap: 12px; margin: 1.5rem 0; }
    .dot { width: 28px; height: 28px; border-radius: 50%; cursor: pointer; border: 2px solid white; box-shadow: 0 0 0 1px #ddd; }
    .dot.gradient { background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); }
    .dot.purple { background: #a855f7; }
    .dot.blue { background: #3b82f6; }
    .dot.teal { background: #14b8a6; }
    .dot.black { background: #000; }

    .qr-instructions {
      padding: 0 2rem; font-size: 0.85rem; color: var(--text-muted);
      text-align: center; line-height: 1.4; margin-bottom: 2rem;
    }

    .qr-actions { width: 100%; display: flex; flex-direction: column; border-top: 1px solid #eee; }
    .qr-action-btn {
      width: 100%; border: none; background: white; padding: 1rem;
      font-size: 0.95rem; font-weight: 700; cursor: pointer;
      border-bottom: 1px solid #f3f3f3; transition: background 0.2s;
    }
    .qr-action-btn:hover { background: #fafafa; }
    .primary-action { color: #4338ca; }
    .secondary-action { color: #1a1d23; }
    .close-action { color: #1a1d23; border-bottom: none; font-weight: 800; }
    
    /* Details Overlay (Reference UI) */
    .details-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: #f8f9fc; z-index: 2000;
      transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex; flex-direction: column; overflow-y: auto;
    }
    .details-overlay.open { transform: translateX(0); }
    
    .details-header-sticky {
      background: #f8f9fc; padding: 1rem; display: flex; align-items: center; 
      justify-content: space-between; position: sticky; top: 0; z-index: 10;
      font-weight: 700;
    }
    
    .details-hero {
      display: flex; flex-direction: column; align-items: center;
      padding: 2rem 1rem; text-align: center;
    }
    .details-avatar {
      width: 100px; height: 100px; border-radius: 50%;
      background: linear-gradient(135deg, #FF6B6B, #5c4df2);
      color: white; font-size: 2.5rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 1rem; box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    }
    .details-name { font-size: 1.5rem; font-weight: 800; margin: 0 0 4px; }
    .details-stats { font-size: 0.85rem; color: var(--text-muted); font-weight: 500; }
    
    .details-quick-actions {
      display: flex; justify-content: center; gap: 2rem; margin-bottom: 2rem;
    }
    .qa-item { display: flex; flex-direction: column; align-items: center; gap: 6px; cursor: pointer; }
    .qa-item i { font-size: 1.4rem; color: var(--text-main); transition: color 0.2s; }
    .qa-item span { font-size: 0.72rem; color: var(--text-muted); font-weight: 600; }
    .qa-item:hover i { color: var(--primary); }
    
    .details-list {
      background: white; border-radius: 24px 24px 0 0; padding: 1rem;
      display: flex; flex-direction: column; gap: 4px;
    }
    .dl-item {
      display: flex; align-items: center; gap: 1rem; padding: 1rem;
      border-radius: 16px; transition: background 0.2s; cursor: pointer;
    }
    .dl-item:hover { background: #f8f9fc; }
    .dl-item > i:first-child { font-size: 1.25rem; color: var(--text-muted); width: 24px; }
    .dl-text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .dl-text strong { font-size: 0.9rem; font-weight: 700; color: var(--text-main); }
    .dl-text span { font-size: 0.75rem; color: var(--text-muted); word-break: break-all; }
    .bi-chevron-right { font-size: 0.9rem; color: #ccc; }
    
    .gallery-tabs {
       display: flex; border-bottom: 1px solid var(--border); background: white;
       margin-top: 1rem;
    }
    .gallery-tabs button {
       flex: 1; border: none; background: none; padding: 1rem;
       font-size: 1.2rem; color: var(--text-muted); cursor: pointer;
       position: relative;
    }
    .gallery-tabs button.active { color: var(--primary); }
    .gallery-tabs button.active::after {
       content: ''; position: absolute; bottom: 0; left: 25%; width: 50%;
       height: 3px; background: var(--primary); border-radius: 3px 3px 0 0;
    }
    
    .gallery-content { background: white; padding: 1rem; flex: 1; }
    .media-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
    .grid-item {
       aspect-ratio: 1; background: #eee; border-radius: 4px; overflow: hidden;
       display: flex; align-items: center; justify-content: center;
    }
    .grid-item img { width: 100%; height: 100%; object-fit: cover; }
    .pdf-icon, .audio-icon { text-align: center; font-size: 0.7rem; font-weight: 700; color: #666; }
    
    .links-list { display: flex; flex-direction: column; gap: 15px; }
    .link-item { 
       display: flex; align-items: center; gap: 10px; text-decoration: none;
       background: #f8f9fc; padding: 10px; border-radius: 10px; color: var(--primary);
       font-size: 0.8rem; font-weight: 600;
    }
    .no-media { text-align: center; padding: 2rem; color: var(--text-muted); font-size: 0.85rem; }
  `]
})
export class ChannelStudentViewComponent implements OnInit, OnDestroy {
  channel: Channel | null = null;
  posts: ChannelPost[] = [];
  isMember = false;
  loadingPosts = true;
  joining = false;
  channelId!: number;
  newPostAlert = false;
  shareModal = false;
  detailsModal = false;
  inviteModal = false;
  qrModal = false;
  detailsTab: 'media' | 'links' = 'media';
  openComments = new Set<number>();
  commentsMap: Record<number, ChannelComment[]> = {};
  commentTexts: Record<number, string> = {};
  recentPostIds = new Set<number>();
  private wsSub?: Subscription;

  get mediaPosts() {
    return this.posts.filter(p => p.type === 'IMAGE' || p.type === 'PDF' || p.type === 'AUDIO');
  }

  get linkPosts() {
    return this.posts.filter(p => p.type === 'LINK');
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private svc: ChannelService,
    private wsSvc: ChannelWebSocketService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.channelId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadData();
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
    this.wsSvc.unsubscribeFromChannel(this.channelId);
  }

  loadData(): void {
    const userId = this.auth.getCurrentUser()?.id;

    this.svc.getChannelById(this.channelId, userId).subscribe(ch => {
      this.channel = ch;
      this.isMember = !!ch.isMember;
      if (this.isMember) this.subscribeWS();
    });

    this.svc.getPostsByChannel(this.channelId, userId).subscribe({
      next: data => {
        this.posts = data;
        this.loadingPosts = false;
      },
      error: () => { this.loadingPosts = false; }
    });
  }

  subscribeWS(): void {
    this.wsSub = this.wsSvc.getChannelMessages(this.channelId).subscribe(msg => {
      if (msg.type === 'NEW_POST' && msg.post) {
        this.posts.unshift(msg.post);
        this.recentPostIds.add(msg.post.id);
        this.newPostAlert = true;
        setTimeout(() => this.newPostAlert = false, 6000);
        if (this.channel) this.channel.postsCount++;
      } else if (msg.type === 'LIKE_UPDATE' && msg.postId !== undefined) {
        const p = this.posts.find(x => x.id === msg.postId);
        if (p && msg.likesCount !== undefined) p.likesCount = msg.likesCount;
      }
    });
  }

  join(): void {
    const userId = this.auth.getCurrentUser()?.id;
    if (!userId) return;

    this.joining = true;
    this.svc.joinChannel(this.channelId, userId).subscribe({
      next: () => {
        this.isMember = true;
        this.joining = false;
        if (this.channel) this.channel.membersCount++;
        this.subscribeWS();
      },
      error: () => { this.joining = false; }
    });
  }

  leave(): void {
    const userId = this.auth.getCurrentUser()?.id;
    if (!userId) return;

    this.svc.leaveChannel(this.channelId, userId).subscribe({
      next: () => {
        this.isMember = false;
        this.wsSub?.unsubscribe();
        if (this.channel && this.channel.membersCount > 0) this.channel.membersCount--;
      }
    });
  }

  like(post: ChannelPost): void {
    const userId = this.auth.getCurrentUser()?.id;
    if (!this.isMember || !userId) return;

    this.svc.likePost(this.channelId, post.id, userId).subscribe({
      next: (res) => {
        post.liked = !post.liked;
        post.likesCount = res.likesCount;
      }
    });
  }

  share(post: ChannelPost): void {
    const userId = this.auth.getCurrentUser()?.id;
    if (!this.isMember || !userId) return;

    this.svc.sharePost(this.channelId, post.id, userId).subscribe({
      next: () => {
        post.sharesCount++;
        this.shareModal = true;
      }
    });
  }

  toggleComments(post: ChannelPost): void {
    if (!this.isMember) return;
    if (this.openComments.has(post.id)) {
      this.openComments.delete(post.id);
    } else {
      this.openComments.add(post.id);
      if (!this.commentsMap[post.id] && post.comments) {
        this.commentsMap[post.id] = post.comments;
      }
    }
  }

  submitComment(post: ChannelPost): void {
    const text = this.commentTexts[post.id]?.trim();
    const userId = this.auth.getCurrentUser()?.id;
    if (!text || !userId) return;

    this.svc.addComment(this.channelId, post.id, userId, text).subscribe({
      next: (c) => {
        if (!this.commentsMap[post.id]) this.commentsMap[post.id] = [];
        this.commentsMap[post.id].push(c);
        post.commentsCount++;
        this.commentTexts[post.id] = '';
      }
    });
  }

  isNew(post: ChannelPost): boolean {
    return this.recentPostIds.has(post.id);
  }

  goBack(): void {
    this.router.navigate(['/assessment/frontoffice/canaux']);
  }

  getTypeEmoji(type: PostType): string {
    const map: Record<PostType, string> = { TEXT: '📝', PDF: '📄', IMAGE: '🖼️', AUDIO: '🎵', LINK: '🔗' };
    return map[type] ?? '📌';
  }

  formatTime(ts: string): string {
    if (!ts) return '';
    try {
      return new Date(ts).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    } catch { return ts; }
  }

  formatTimeShort(ts: string): string {
    if (!ts) return '';
    try {
      return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch { return ts; }
  }

  formatDay(ts: string): string {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      const days = ['DIM.', 'LUN.', 'MAR.', 'MER.', 'JEU.', 'VEN.', 'SAM.'];
      return `${days[d.getDay()]} ${d.getHours()}:${d.getMinutes() < 10 ? '0' : ''}${d.getMinutes()}`;
    } catch { return ''; }
  }

  isNewDay(prevTs: string, currTs: string): boolean {
    if (!prevTs) return true;
    const p = new Date(prevTs);
    const c = new Date(currTs);
    return p.toDateString() !== c.toDateString() || (c.getTime() - p.getTime() > 3600000); // 1 hour gap to show time
  }

  getRandomHeight(): number {
    return Math.floor(Math.random() * 15) + 5;
  }

  getInviteUrl(): string {
    return window.location.origin + '/assessment/frontoffice/canaux/' + this.channelId;
  }

  copyLink(): void {
    const url = this.getInviteUrl();
    navigator.clipboard.writeText(url).then(() => {
      alert('Lien copié dans le presse-papier !');
    });
  }

  showQrCode(): void {
    this.qrModal = true;
  }
}
