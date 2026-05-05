import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { Quiz } from '../../models/quiz.models';
import { QuizService } from '../../services/quiz.service';

@Component({
    selector: 'app-admin-quiz-list',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h2 class="page-title">🎮 Quizzes</h2>
          <p class="page-sub">Gérez vos quizzes style Kahoot</p>
        </div>
        <a routerLink="nouveau" class="btn-add">+ Nouveau Quiz</a>
      </div>

      <div class="loading" *ngIf="loading">
        <div class="spinner"></div>
        <span>Chargement…</span>
      </div>

      <div class="empty-state" *ngIf="!loading && quizzes.length === 0">
        <span class="empty-icon">🎮</span>
        <p>Aucun quiz trouvé.</p>
        <a routerLink="nouveau" class="btn-add">Créer le premier</a>
      </div>

      <div class="table-wrap" *ngIf="!loading && quizzes.length > 0">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Titre</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let quiz of quizzes">
              <td class="id-cell">{{ quiz.id }}</td>
              <td class="title-cell">{{ quiz.title }}</td>
              <td class="desc-cell">{{ quiz.description }}</td>
              <td class="actions-cell">
                <a [routerLink]="['modifier', quiz.id]" class="btn-edit">✏️ Modifier</a>
                <button class="btn-delete" (click)="confirmDelete(quiz)">🗑️ Supprimer</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal-overlay" *ngIf="toDelete" (click)="toDelete = null">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>Confirmer la suppression</h3>
          <p>Supprimer le quiz <strong>{{ toDelete.title }}</strong> ?</p>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="toDelete = null">Annuler</button>
            <button class="btn-confirm-delete" (click)="deleteQuiz()">Supprimer</button>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .page { }
    .page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1.75rem; gap:1rem; flex-wrap:wrap; }
    .page-title { font-size:1.5rem; font-weight:800; color:#2D5757; margin:0 0 0.25rem; }
    .page-sub { color:#2D5757; margin:0; font-size:0.9rem; opacity: 0.8; }
    .btn-add {
      background:linear-gradient(135deg,#2D5757,#1a3a3a); 
      color:#F7EDE2;
      padding:0.65rem 1.4rem; 
      border-radius:12px; 
      font-weight:600;
      font-size:0.9rem; 
      text-decoration:none; 
      border:none; 
      cursor:pointer; 
      transition:all 0.3s ease; 
      white-space:nowrap;
      box-shadow: 0 4px 12px rgba(45, 87, 87, 0.2);
    }
    .btn-add:hover { 
      transform: translateY(-2px); 
      box-shadow: 0 8px 20px rgba(45, 87, 87, 0.3);
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
    .data-table tbody tr:hover { 
      background: rgba(247, 237, 226, 0.3); 
    }
    .id-cell { 
      color:#2D5757; 
      font-size:0.8rem; 
      opacity: 0.6;
    }
    .title-cell { 
      font-weight:600; 
      color:#2D5757; 
    }
    .desc-cell { 
      max-width:300px; 
      overflow:hidden; 
      text-overflow:ellipsis; 
      white-space:nowrap; 
      color:#2D5757; 
      opacity: 0.8;
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
      margin-top:1.5rem; 
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
  `]
})
export class QuizListComponent implements OnInit, OnDestroy {
    quizzes: Quiz[] = [];
    loading = true;
    toDelete: Quiz | null = null;
    private quizzesSubscription: Subscription | null = null;

    constructor(private quizService: QuizService) { }

    ngOnInit(): void {
        console.log('QuizListComponent initialized');
        this.loadQuizzes();
        // S'abonner aux mises à jour automatiques des quizzes
        this.quizzesSubscription = this.quizService.quizzes$.subscribe({
            next: (quizzes) => {
                console.log('Quizzes updated in list:', quizzes.length, quizzes);
                this.quizzes = quizzes;
                this.loading = false;
            },
            error: (error) => {
                console.error('Error in quizzes subscription:', error);
                this.quizzes = [];
                this.loading = false;
            }
        });
    }

    ngOnDestroy(): void {
        if (this.quizzesSubscription) {
            this.quizzesSubscription.unsubscribe();
        }
    }

    loadQuizzes(): void {
        console.log('Loading quizzes...');
        this.loading = true;
        this.quizService.getAllQuizzes().subscribe({
            next: () => {
                console.log('Quizzes loaded successfully');
                // Les données sont déjà mises à jour via le BehaviorSubject
                this.loading = false;
            },
            error: (error) => { 
                console.error('Error loading quizzes:', error);
                this.loading = false; 
            }
        });
    }

    confirmDelete(quiz: Quiz): void {
        this.toDelete = quiz;
    }

    deleteQuiz(): void {
        if (this.toDelete && this.toDelete.id) {
            this.quizService.deleteQuiz(this.toDelete.id).subscribe(() => {
                this.toDelete = null;
                this.loadQuizzes();
            });
        }
    }
}
