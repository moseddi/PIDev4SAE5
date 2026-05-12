import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Channel, ChannelPost, PostType } from '../../models/channel.models';
import { ChannelService } from '../../services/channel.service';
import { ChannelWebSocketService } from '../../services/channel-websocket.service';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-channel-admin-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-wrap">

      <!-- Back + Header -->
      <div class="page-header">
        <button class="btn-back" (click)="goBack()">← Retour</button>
        @if (channel) {
          <div class="header-info">
            <div class="channel-avatar-lg">{{ channel.name.charAt(0).toUpperCase() }}</div>
            <div>
              <h1>{{ channel.name }}</h1>
              <p>{{ channel.description }}</p>
              <div class="header-stats">
                <span class="stat-tag members">👥 {{ channel.membersCount }} membres</span>
                <span class="stat-tag posts">📨 {{ channel.postsCount }} publications</span>
                <span class="stat-tag live"><span class="mini-dot"></span> LIVE</span>
              </div>
            </div>
          </div>
        }
      </div>

      <div class="layout-2col">

        <!-- LEFT: Publish Panel -->
        <div class="publish-panel">
          <div class="panel-header">
            <h2>📢 Nouvelle Publication</h2>
            <p>Publiez instantanément pour tous vos étudiants</p>
          </div>

          <!-- Type Selector -->
          <div class="type-selector">
            @for (t of postTypes; track t.value) {
              <button class="type-btn" [class.active]="selectedType === t.value"
                (click)="selectedType = t.value; resetForm()">
                <span class="type-icon">{{ t.icon }}</span>
                <span class="type-lbl">{{ t.label }}</span>
              </button>
            }
          </div>

          <!-- Form selon le type -->
          <div class="publish-form">
            @if (selectedType === 'TEXT') {
              <div class="field">
                <label>Message</label>
                <textarea [(ngModel)]="textContent" rows="5"
                  placeholder="Examen final le 15 juin à 9h en amphi A..."></textarea>
              </div>
            }
            @if (selectedType === 'PDF') {
              <div class="field">
                <label>Fichier PDF</label>
                <div class="file-drop" (click)="fileInput.click()">
                  @if (selectedFile) {
                    <span class="file-chosen">📎 {{ selectedFile.name }}</span>
                  } @else {
                    <span>📄 Cliquer pour sélectionner un PDF</span>
                  }
                </div>
                <input #fileInput type="file" accept=".pdf" style="display:none" (change)="onFileChange($event)" />
              </div>
              <div class="field">
                <label>Description (optionnel)</label>
                <input [(ngModel)]="textContent" type="text" placeholder="Ex: Notes du cours de mathématiques" />
              </div>
            }
            @if (selectedType === 'IMAGE') {
              <div class="field">
                <label>Image</label>
                <div class="file-drop" (click)="fileInput.click()">
                  @if (imagePreview) {
                    <img [src]="imagePreview" class="img-preview" />
                  } @else {
                    <span>🖼️ Cliquer pour sélectionner une image</span>
                  }
                </div>
                <input #fileInput type="file" accept="image/*" style="display:none" (change)="onFileChange($event)" />
              </div>
            }
            @if (selectedType === 'AUDIO') {
              <div class="field">
                <label>Fichier Audio</label>
                <div class="file-drop" (click)="fileInput.click()">
                  @if (selectedFile) {
                    <span class="file-chosen">🎵 {{ selectedFile.name }}</span>
                  } @else {
                    <span>🎤 Cliquer pour sélectionner un audio</span>
                  }
                </div>
                <input #fileInput type="file" accept="audio/*" style="display:none" (change)="onFileChange($event)" />
              </div>
              <div class="field">
                <label>Description</label>
                <input [(ngModel)]="textContent" type="text" placeholder="Rappel vocal — Cours du 12 avril" />
              </div>
            }
            @if (selectedType === 'LINK') {
              <div class="field">
                <label>URL</label>
                <input [(ngModel)]="linkUrl" type="url" placeholder="https://drive.google.com/..." />
              </div>
              <div class="field">
                <label>Description du lien</label>
                <input [(ngModel)]="textContent" type="text" placeholder="Support de cours chapitre 3" />
              </div>
            }

            <button class="btn-publish" (click)="publish()" [disabled]="publishing || !canPublish()">
              @if (publishing) { <span class="spinner-sm"></span> Publication... }
              @else { 📢 Publier maintenant }
            </button>
          </div>
        </div>

        <!-- RIGHT: Feed -->
        <div class="feed-panel">
          <div class="feed-header">
            <h2>📋 Flux du canal</h2>
            <span class="live-badge"><span class="live-dot"></span> Temps réel</span>
          </div>

          @if (loadingPosts) {
            <div class="loading-feed">
              <div class="spinner"></div>
              <p>Chargement des publications...</p>
            </div>
          } @else if (posts.length === 0) {
            <div class="empty-feed">
              <div class="ef-icon">📭</div>
              <p>Aucune publication pour l'instant.<br>Soyez le premier à publier !</p>
            </div>
          } @else {
            <div class="posts-list">
              @for (post of posts; track post.id) {
                <div class="post-card" [class]="'post-' + post.type.toLowerCase()">
                  <div class="post-type-chip">
                    <span>{{ getTypeEmoji(post.type) }}</span>
                    {{ post.type }}
                  </div>
                  <div class="post-content">
                    @if (post.type === 'IMAGE' && post.fileUrl) {
                      <img [src]="'/assessment-api' + post.fileUrl" class="post-image" />
                    }
                    @if (post.type === 'AUDIO' && post.fileUrl) {
                      <audio controls class="post-audio">
                        <source [src]="'/assessment-api' + post.fileUrl" />
                      </audio>
                    }
                    @if (post.type === 'PDF' && post.fileUrl) {
                      <a class="pdf-link" [href]="'/assessment-api' + post.fileUrl" target="_blank" download>
                        📄 {{ post.fileName || 'Télécharger le PDF' }}
                      </a>
                    }
                    @if (post.type === 'LINK' && post.linkUrl) {
                      <a class="ext-link" [href]="post.linkUrl" target="_blank">
                        🔗 {{ post.linkUrl }}
                      </a>
                    }
                    @if (post.content) {
                      <p class="post-text">{{ post.content }}</p>
                    }
                  </div>
                  <div class="post-meta">
                    <span class="post-time">{{ formatTime(post.createdAt) }}</span>
                    <div class="post-reactions">
                      <span>❤️ {{ post.likesCount }}</span>
                      <span>💬 {{ post.commentsCount }}</span>
                      <span>🔗 {{ post.sharesCount }}</span>
                    </div>
                    <button class="btn-del-post" (click)="deletePost(post)">🗑️</button>
                  </div>
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
    .page-wrap { font-family: 'Inter', sans-serif; padding: 1.5rem 2rem; max-width: 1400px; margin: 0 auto; }

    .page-header { margin-bottom: 2rem; }
    .btn-back { background: #f1f5f9; border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 600; color: #475569; margin-bottom: 1rem; transition: all 0.2s; }
    .btn-back:hover { background: #e2e8f0; }
    .header-info { display: flex; gap: 1.25rem; align-items: flex-start; }
    .channel-avatar-lg {
      width: 64px; height: 64px; border-radius: 18px;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: white; font-size: 1.8rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .header-info h1 { font-size: 1.6rem; font-weight: 900; color: #1e293b; margin: 0 0 0.25rem; }
    .header-info p { color: #64748b; font-size: 0.9rem; margin: 0 0 0.75rem; }
    .header-stats { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .stat-tag { padding: 0.3rem 0.8rem; border-radius: 99px; font-size: 0.78rem; font-weight: 700; }
    .stat-tag.members { background: #ede9fe; color: #7c3aed; }
    .stat-tag.posts { background: #dbeafe; color: #1d4ed8; }
    .stat-tag.live { background: #dcfce7; color: #16a34a; display: flex; align-items: center; gap: 0.4rem; }
    .mini-dot { width: 8px; height: 8px; border-radius: 50%; background: #16a34a; animation: pulse-green 1.5s infinite; }
    @keyframes pulse-green { 0%,100% { box-shadow: 0 0 0 0 rgba(22,163,74,.4); } 50% { box-shadow: 0 0 0 5px rgba(22,163,74,0); } }

    .layout-2col { display: grid; grid-template-columns: 380px 1fr; gap: 2rem; align-items: start; }

    /* Publish Panel */
    .publish-panel {
      background: white; border-radius: 20px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      border: 1px solid #e2e8f0; overflow: hidden;
      position: sticky; top: 1rem;
    }
    .panel-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; background: #f8fafc; }
    .panel-header h2 { font-size: 1rem; font-weight: 800; color: #1e293b; margin: 0 0 0.2rem; }
    .panel-header p { font-size: 0.8rem; color: #64748b; margin: 0; }

    .type-selector { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0; border-bottom: 1px solid #f1f5f9; }
    .type-btn {
      display: flex; flex-direction: column; align-items: center; gap: 0.25rem;
      padding: 0.75rem 0.5rem; background: none; border: none; cursor: pointer;
      border-bottom: 2px solid transparent; transition: all 0.2s;
      color: #94a3b8;
    }
    .type-btn.active { color: #6366f1; border-bottom-color: #6366f1; background: rgba(99,102,241,0.05); }
    .type-btn:hover { color: #6366f1; }
    .type-icon { font-size: 1.3rem; }
    .type-lbl { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }

    .publish-form { padding: 1.5rem; }
    .field { margin-bottom: 1.1rem; }
    .field label { display: block; font-weight: 700; font-size: 0.82rem; color: #374151; margin-bottom: 0.4rem; }
    .field input, .field textarea {
      width: 100%; border: 2px solid #e2e8f0; border-radius: 10px;
      padding: 0.65rem 0.9rem; font-size: 0.88rem; font-family: inherit;
      outline: none; resize: vertical; transition: border-color 0.2s;
    }
    .field input:focus, .field textarea:focus { border-color: #6366f1; }
    .file-drop {
      border: 2px dashed #c7d2fe; border-radius: 10px; padding: 1.5rem;
      text-align: center; cursor: pointer; color: #6366f1; font-size: 0.85rem;
      font-weight: 600; transition: all 0.2s;
    }
    .file-drop:hover { background: rgba(99,102,241,0.04); border-color: #6366f1; }
    .file-chosen { color: #16a34a; font-weight: 700; }
    .img-preview { max-height: 120px; border-radius: 8px; object-fit: cover; }
    .btn-publish {
      width: 100%; background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: white; border: none; padding: 0.85rem;
      border-radius: 12px; font-weight: 800; font-size: 0.95rem;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      transition: all 0.2s; box-shadow: 0 4px 14px rgba(99,102,241,0.35);
    }
    .btn-publish:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(99,102,241,0.4); }
    .btn-publish:disabled { opacity: 0.5; cursor: not-allowed; }
    .spinner-sm { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Feed */
    .feed-panel { background: white; border-radius: 20px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; overflow: hidden; }
    .feed-header { padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; background: #f8fafc; display: flex; justify-content: space-between; align-items: center; }
    .feed-header h2 { font-size: 1rem; font-weight: 800; color: #1e293b; margin: 0; }
    .live-badge { display: flex; align-items: center; gap: 0.4rem; background: #dcfce7; color: #16a34a; padding: 0.3rem 0.75rem; border-radius: 99px; font-size: 0.75rem; font-weight: 700; }
    .live-dot { width: 8px; height: 8px; border-radius: 50%; background: #16a34a; animation: pulse-green 1.5s infinite; }
    .loading-feed, .empty-feed { padding: 4rem 2rem; text-align: center; color: #94a3b8; }
    .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 1rem; }
    .ef-icon { font-size: 3rem; margin-bottom: 0.75rem; }
    .empty-feed p { font-size: 0.9rem; line-height: 1.6; }

    .posts-list { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; max-height: calc(100vh - 200px); overflow-y: auto; }
    .post-card { border-radius: 14px; border: 1px solid #e2e8f0; padding: 1.25rem; transition: box-shadow 0.2s; animation: slideIn 0.3s ease; }
    @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    .post-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
    .post-card.post-text { border-left: 4px solid #6366f1; }
    .post-card.post-pdf { border-left: 4px solid #ef4444; }
    .post-card.post-image { border-left: 4px solid #10b981; }
    .post-card.post-audio { border-left: 4px solid #f59e0b; }
    .post-card.post-link { border-left: 4px solid #3b82f6; }
    .post-type-chip { display: inline-flex; align-items: center; gap: 0.3rem; background: #f1f5f9; padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.72rem; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 0.75rem; }
    .post-image { width: 100%; max-height: 200px; object-fit: cover; border-radius: 10px; margin-bottom: 0.75rem; }
    .post-audio { width: 100%; margin-bottom: 0.75rem; }
    .pdf-link, .ext-link { display: inline-flex; align-items: center; gap: 0.5rem; color: #6366f1; font-weight: 700; text-decoration: none; font-size: 0.88rem; padding: 0.5rem 0.75rem; background: #ede9fe; border-radius: 8px; margin-bottom: 0.75rem; }
    .pdf-link:hover, .ext-link:hover { background: #ddd6fe; }
    .post-text { font-size: 0.92rem; color: #334155; line-height: 1.6; margin: 0; }
    .post-meta { display: flex; align-items: center; gap: 1rem; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #f1f5f9; }
    .post-time { font-size: 0.75rem; color: #94a3b8; flex: 1; }
    .post-reactions { display: flex; gap: 0.75rem; font-size: 0.82rem; color: #64748b; font-weight: 600; }
    .btn-del-post { background: none; border: none; color: #f87171; cursor: pointer; font-size: 0.9rem; padding: 0.2rem; }
    .btn-del-post:hover { color: #ef4444; }
  `]
})
export class ChannelAdminDetailComponent implements OnInit, OnDestroy {
  channel: Channel | null = null;
  posts: ChannelPost[] = [];
  loading = true;
  loadingPosts = true;
  publishing = false;
  channelId!: number;

  selectedType: PostType = 'TEXT';
  textContent = '';
  linkUrl = '';
  selectedFile: File | null = null;
  imagePreview: string | null = null;

  private wsSub?: Subscription;

  postTypes = [
    { value: 'TEXT' as PostType, icon: '📝', label: 'Texte' },
    { value: 'PDF' as PostType, icon: '📄', label: 'PDF' },
    { value: 'IMAGE' as PostType, icon: '🖼️', label: 'Image' },
    { value: 'AUDIO' as PostType, icon: '🎵', label: 'Audio' },
    { value: 'LINK' as PostType, icon: '🔗', label: 'Lien' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private svc: ChannelService,
    private wsSvc: ChannelWebSocketService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.channelId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadChannel();
    this.loadPosts();
    this.subscribeWS();
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
    this.wsSvc.unsubscribeFromChannel(this.channelId);
  }

  loadChannel(): void {
    this.svc.getChannelById(this.channelId).subscribe({
      next: d => { this.channel = d; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  loadPosts(): void {
    this.loadingPosts = true;
    this.svc.getPostsByChannel(this.channelId).subscribe({
      next: data => { this.posts = data; this.loadingPosts = false; },
      error: () => { this.loadingPosts = false; }
    });
  }

  subscribeWS(): void {
    this.wsSub = this.wsSvc.getChannelMessages(this.channelId).subscribe(msg => {
      if (msg.type === 'NEW_POST' && msg.post) {
        this.posts.unshift(msg.post);
        if (this.channel) this.channel.postsCount++;
      } else if (msg.type === 'NEW_MEMBER' && msg.membersCount !== undefined) {
        if (this.channel) this.channel.membersCount = msg.membersCount;
      }
    });
  }

  canPublish(): boolean {
    if (this.selectedType === 'TEXT') return !!this.textContent.trim();
    if (this.selectedType === 'LINK') return !!this.linkUrl.trim();
    return !!this.selectedFile;
  }

  resetForm(): void {
    this.textContent = '';
    this.linkUrl = '';
    this.selectedFile = null;
    this.imagePreview = null;
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      if (this.selectedType === 'IMAGE') {
        const reader = new FileReader();
        reader.onload = (e) => { this.imagePreview = e.target?.result as string; };
        reader.readAsDataURL(this.selectedFile);
      }
    }
  }

  publish(): void {
    if (!this.canPublish() || this.publishing) return;
    this.publishing = true;
    const authorId = this.auth.getCurrentUser()?.id || 1;
    const fd = new FormData();
    fd.append('authorId', authorId.toString());
    fd.append('postType', this.selectedType);
    fd.append('content', this.textContent.trim());
    if (this.linkUrl) fd.append('linkUrl', this.linkUrl.trim());
    if (this.selectedFile) fd.append('file', this.selectedFile);

    this.svc.createPost(this.channelId, fd).subscribe({
      next: (post) => {
        this.posts.unshift(post);
        this.resetForm();
        this.publishing = false;
        if (this.channel) this.channel.postsCount++;
      },
      error: () => { this.publishing = false; }
    });
  }

  deletePost(post: ChannelPost): void {
    this.svc.deletePost(this.channelId, post.id).subscribe({
      next: () => { this.posts = this.posts.filter(p => p.id !== post.id); }
    });
  }

  goBack(): void {
    this.router.navigate(['/backoffice/admin/channels']);
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
}
