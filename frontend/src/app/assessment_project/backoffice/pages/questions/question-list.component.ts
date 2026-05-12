import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Question, QuestionType } from '../../models/certification.models';
import { QuestionService } from '../../services/question.service';

@Component({
    selector: 'app-question-list',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h2 class="page-title">❓ Questions</h2>
          <p class="page-sub">Gestion des questions d'examens</p>
        </div>
        <div class="header-actions">
          <button class="btn-test" (click)="testBackend()">🌐 Test Backend</button>
          <button class="btn-debug" (click)="debugRefresh()">🔧 Debug Refresh</button>
          <button class="btn-clear" (click)="clearStorage()">🗑️ Clear Storage</button>
          <a routerLink="nouveau" class="btn-add">+ Nouvelle question</a>
        </div>
      </div>

      <div class="loading" *ngIf="loading"><div class="spinner"></div> Chargement…</div>

      <div class="api-error" *ngIf="deleteError">{{ deleteError }}</div>

      <div class="empty-state" *ngIf="!loading && questions.length === 0">
        <span class="empty-icon">❓</span>
        <p>Aucune question trouvée.</p>
        <a routerLink="nouveau" class="btn-add">Créer la première</a>
      </div>

      <div class="table-wrap" *ngIf="!loading && questions.length > 0">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Contenu</th>
              <th>Type</th>
              <th>Examen</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let q of questions">
              <td class="id-cell">{{ q.id }}</td>
              <td class="content-cell">{{ getContent(q) }}</td>
              <td>
                <span class="type-badge" [class]="'type-' + q.type">{{ typeLabel(q.type) }}</span>
              </td>
              <td class="exam-cell">Examen #{{ q.exam_id ?? q.examId ?? q.exam?.id ?? '—' }}</td>
              <td class="actions-cell">
                <a [routerLink]="['modifier', q.id]" class="btn-edit">✏️ Modifier</a>
                <button class="btn-delete" (click)="confirmDelete(q)">🗑️ Supprimer</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal-overlay" *ngIf="toDelete" (click)="toDelete = null">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>Confirmer la suppression</h3>
          <p>Supprimer cette question ? Toutes ses réponses seront supprimées.</p>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="toDelete = null">Annuler</button>
            <button class="btn-confirm-delete" (click)="deleteQuestion()">Supprimer</button>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .page { }
    .page-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:2rem; }
    .page-title { margin:0; font-size:1.75rem; font-weight:800; color:#2D5757; }
    .page-sub { margin:0.25rem 0 0; color:#2D5757; font-size:0.95rem; opacity: 0.8; }
    .header-actions { display:flex; gap:0.75rem; align-items:center; }
    .btn-add { 
      padding:0.65rem 1.4rem; 
      border-radius:12px; 
      background:linear-gradient(135deg,#2D5757,#1a3a3a); 
      color:#F7EDE2; 
      text-decoration:none; 
      font-weight:600; 
      font-size:0.9rem; 
      transition:all 0.3s ease; 
      box-shadow: 0 4px 12px rgba(45, 87, 87, 0.2);
    }
    .btn-add:hover { 
      transform: translateY(-2px); 
      box-shadow: 0 8px 20px rgba(45, 87, 87, 0.3);
    }
    .btn-test { 
      padding:0.65rem 1.4rem; 
      border-radius:12px; 
      background:linear-gradient(135deg,#10b981,#059669); 
      color:#fff; 
      border:none; 
      font-weight:600; 
      font-size:0.9rem; 
      cursor:pointer; 
      transition:all 0.3s ease;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
    }
    .btn-test:hover { 
      transform: translateY(-2px); 
      box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
    }
    .btn-debug { 
      padding:0.65rem 1.4rem; 
      border-radius:12px; 
      background:linear-gradient(135deg,#f59e0b,#d97706); 
      color:#fff; 
      border:none; 
      font-weight:600; 
      font-size:0.9rem; 
      cursor:pointer; 
      transition:all 0.3s ease;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
    }
    .btn-debug:hover { 
      transform: translateY(-2px); 
      box-shadow: 0 8px 20px rgba(245, 158, 11, 0.3);
    }
    .btn-clear { 
      padding:0.65rem 1.4rem; 
      border-radius:12px; 
      background:linear-gradient(135deg,#dc2626,#b91c1c); 
      color:#fff; 
      border:none; 
      font-weight:600; 
      font-size:0.9rem; 
      cursor:pointer; 
      transition:all 0.3s ease;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
    }
    .btn-clear:hover { 
      transform: translateY(-2px); 
      box-shadow: 0 8px 20px rgba(220, 38, 38, 0.3);
    }
    
    .loading { display:flex; align-items:center; gap:1rem; padding:3rem; color:#2D5757; }
    .spinner { 
      width:24px; 
      height:24px; 
      border:3px solid rgba(45, 87, 87, 0.2); 
      border-top-color:#2D5757; 
      border-radius:50%; 
      animation:spin 0.7s linear infinite; 
    }
    @keyframes spin { to { transform:rotate(360deg); } }
    
    .empty-state { 
      text-align:center; 
      padding:4rem 2rem; 
      color:#2D5757; 
      background: #fff;
      border-radius: 16px;
      border: 2px dashed rgba(45, 87, 87, 0.2);
    }
    .empty-icon { 
      font-size:3.5rem; 
      display:block; 
      margin-bottom:1rem; 
      opacity: 0.7;
    }
    
    .table-wrap { 
      background:#fff; 
      border-radius:16px; 
      box-shadow:0 4px 20px rgba(45, 87, 87, 0.08); 
      overflow:hidden; 
      border:1px solid rgba(45, 87, 87, 0.1); 
    }
    .data-table { width:100%; border-collapse:collapse; }
    .data-table thead { 
      background: linear-gradient(135deg, rgba(45, 87, 87, 0.05), rgba(45, 87, 87, 0.02)); 
    }
    .data-table th { 
      padding:0.9rem 1.25rem; 
      text-align:left; 
      font-size:0.78rem; 
      font-weight:700; 
      color:#2D5757; 
      text-transform:uppercase; 
      letter-spacing:0.05em; 
      border-bottom:2px solid rgba(45, 87, 87, 0.1); 
    }
    .data-table td { 
      padding:1rem 1.25rem; 
      border-bottom:1px solid rgba(45, 87, 87, 0.05); 
      font-size:0.9rem; 
      color:#2D5757; 
      vertical-align:middle; 
    }
    .data-table tbody tr:last-child td { border-bottom:none; }
    .data-table tbody tr:hover { 
      background: rgba(247, 237, 226, 0.3); 
    }
    .id-cell { 
      color:#2D5757; 
      font-size:0.8rem; 
      opacity: 0.6;
    }
    .content-cell { 
      max-width:300px; 
      overflow:hidden; 
      text-overflow:ellipsis; 
      white-space:nowrap; 
      font-weight:500; 
    }
    .exam-cell { 
      color:#2D5757; 
      font-size:0.85rem; 
      opacity: 0.8;
    }
    .type-badge { 
      padding:0.3rem 0.7rem; 
      border-radius:8px; 
      font-size:0.78rem; 
      font-weight:700; 
      border: 1px solid rgba(45, 87, 87, 0.1);
    }
    .type-QCM, .type-MULTIPLE_CHOICE { 
      background:rgba(245, 158, 11, 0.1); 
      color:#a16207; 
    }
    .type-TRUE_FALSE { 
      background:rgba(16, 185, 129, 0.1); 
      color:#15803d; 
    }
    .type-OPEN { 
      background:rgba(139, 92, 246, 0.1); 
      color:#7c3aed; 
    }
    
    .actions-cell { 
      display:flex; 
      gap:0.5rem; 
    }
    
    .btn-edit, .btn-delete { 
      padding:0.5rem 1rem; 
      border-radius:10px; 
      font-size:0.8rem; 
      font-weight:600; 
      text-decoration:none; 
      border:none; 
      cursor:pointer; 
      transition:all 0.3s ease;
      position: relative;
      overflow: hidden;
    }
    
    .btn-edit { 
      background:linear-gradient(135deg, #2D5757, #1a3a3a); 
      color:#F7EDE2; 
      box-shadow: 0 3px 10px rgba(45, 87, 87, 0.2);
      border: 1px solid rgba(45, 87, 87, 0.3);
    }
    .btn-edit:hover { 
      transform: translateY(-2px); 
      box-shadow: 0 6px 16px rgba(45, 87, 87, 0.3);
      background:linear-gradient(135deg, #1a3a3a, #2D5757);
    }
    .btn-edit::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(247, 237, 226, 0.2), transparent);
      transition: left 0.5s;
    }
    .btn-edit:hover::before {
      left: 100%;
    }
    
    .btn-delete { 
      background:linear-gradient(135deg, #dc2626, #b91c1c); 
      color:#fff; 
      box-shadow: 0 3px 10px rgba(220, 38, 38, 0.2);
      border: 1px solid rgba(220, 38, 38, 0.3);
    }
    .btn-delete:hover { 
      transform: translateY(-2px); 
      box-shadow: 0 6px 16px rgba(220, 38, 38, 0.3);
      background:linear-gradient(135deg, #b91c1c, #dc2626);
    }
    .btn-delete::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: left 0.5s;
    }
    .btn-delete:hover::before {
      left: 100%;
    }
    
    .modal-overlay { 
      position:fixed; 
      inset:0; 
      background:rgba(45, 87, 87, 0.3); 
      backdrop-filter:blur(8px);
      display:flex; 
      align-items:center; 
      justify-content:center; 
      z-index:1000;
    }
    .modal { 
      background:#fff; 
      border-radius:20px; 
      padding:2rem;
      max-width:420px; 
      width:90%; 
      box-shadow:0 20px 60px rgba(45, 87, 87, 0.2);
      border: 1px solid rgba(45, 87, 87, 0.1);
    }
    .modal h3 { 
      margin:0 0 0.75rem; 
      color:#2D5757; 
      font-size: 1.2rem;
    }
    .modal p { 
      color:#2D5757; 
      margin:0 0 1.5rem; 
      line-height:1.6; 
      opacity: 0.8;
    }
    .modal-actions { 
      display:flex; 
      gap:0.75rem; 
      justify-content:flex-end; 
    }
    .btn-cancel { 
      padding:0.6rem 1.25rem; 
      border-radius:10px; 
      background: rgba(45, 87, 87, 0.1); 
      color:#2D5757; 
      border: 1px solid rgba(45, 87, 87, 0.2);
      font-weight:600; 
      cursor:pointer; 
      transition: all 0.3s ease;
    }
    .btn-cancel:hover {
      background: rgba(45, 87, 87, 0.2);
      transform: translateY(-1px);
    }
    .btn-confirm-delete { 
      padding:0.6rem 1.25rem; 
      border-radius:10px; 
      background:linear-gradient(135deg, #dc2626, #b91c1c); 
      color:#fff; 
      border:none; 
      font-weight:600; 
      cursor:pointer; 
      transition: all 0.3s ease;
      box-shadow: 0 3px 10px rgba(220, 38, 38, 0.2);
    }
    .btn-confirm-delete:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(220, 38, 38, 0.3);
      background:linear-gradient(135deg, #b91c1c, #dc2626);
    }
    .api-error { 
      background:rgba(220, 38, 38, 0.1); 
      border:1px solid rgba(220, 38, 38, 0.2); 
      color:#dc2626; 
      padding:0.75rem 1rem; 
      border-radius:10px; 
      margin-bottom:1rem; 
      font-size:0.88rem; 
    }
  `]
})
export class QuestionListComponent implements OnInit, OnDestroy {
    questions: Question[] = [];
    loading = true;
    toDelete: Question | null = null;
    deleteError = '';
    private questionsSubscription: Subscription | null = null;

    constructor(private svc: QuestionService) { }

    getContent(q: Question): string {
        return q.content ?? (q as { enonce?: string }).enonce ?? '—';
    }

    ngOnInit(): void { 
        console.log('QuestionListComponent initialized');
        this.load();
        // S'abonner aux mises à jour automatiques des questions
        this.questionsSubscription = this.svc.questions$.subscribe({
            next: (questions) => {
                console.log('Questions updated in list:', questions.length, questions);
                this.questions = questions;
                this.loading = false;
            },
            error: (error) => {
                console.error('Error in questions subscription:', error);
                this.questions = [];
                this.loading = false;
            }
        });
    }

    ngOnDestroy(): void {
        if (this.questionsSubscription) {
            this.questionsSubscription.unsubscribe();
        }
    }

    typeLabel(t: QuestionType | string | undefined): string {
        const map: Record<string, string> = {
            QCM: 'QCM',
            MULTIPLE_CHOICE: 'QCM',
            TRUE_FALSE: 'Vrai / Faux',
            OPEN: 'Ouverte',
        };
        return t ? (map[t] ?? t) : '—';
    }

    load(): void {
        console.log('Loading questions...');
        this.loading = true;
        this.svc.getAll().subscribe({
            next: () => {
                console.log('Questions loaded successfully');
                // Les données sont déjà mises à jour via le BehaviorSubject
                this.loading = false;
            },
            error: (error) => { 
                console.error('Error loading questions:', error);
                this.loading = false; 
            }
        });
    }

    confirmDelete(q: Question): void { this.toDelete = q; }

    deleteQuestion(): void {
        if (!this.toDelete?.id) return;
        this.deleteError = '';
        this.svc.delete(this.toDelete.id).subscribe({
            next: () => { 
                this.toDelete = null; 
                // La liste se met à jour automatiquement via le BehaviorSubject
            },
            error: (err) => {
                this.toDelete = null;
                this.deleteError = err?.error?.message ?? 'Impossible de supprimer la question.';
            }
        });
    }

    debugRefresh(): void {
        console.log('Debug refresh clicked');
        console.log('Current questions in component:', this.questions.length, this.questions);
        
        // Forcer le rafraîchissement du service
        (this.svc as any).forceRefresh();
        
        // Afficher l'état actuel du service
        const serviceState = (this.svc as any).getCurrentState();
        console.log('Service state:', serviceState.length, serviceState);
        
        // Forcer le rechargement
        this.load();
    }

    clearStorage(): void {
        console.log('Clear storage clicked');
        if (confirm('Êtes-vous sûr de vouloir supprimer toutes les questions du stockage local ?')) {
            localStorage.removeItem('mock_questions');
            console.log('Storage cleared, reloading page...');
            window.location.reload();
        }
    }

    testBackend(): void {
        console.log('Testing backend connection...');
        this.loading = true;
        
        // Forcer le rechargement depuis le backend
        this.svc.getAll().subscribe({
            next: () => {
                console.log('✅ Backend test completed');
                this.loading = false;
            },
            error: (error) => {
                console.log('❌ Backend test failed:', error);
                this.loading = false;
            }
        });
    }
}
