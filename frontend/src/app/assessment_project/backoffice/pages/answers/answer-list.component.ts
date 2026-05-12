import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Answer } from '../../models/certification.models';
import { AnswerService } from '../../services/answer.service';

@Component({
    selector: 'app-answer-list',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h2 class="page-title">✅ Réponses</h2>
          <p class="page-sub">Gestion des réponses aux questions</p>
        </div>
        <a routerLink="nouveau" class="btn-add">+ Nouvelle réponse</a>
      </div>

      <div class="loading" *ngIf="loading"><div class="spinner"></div> Chargement…</div>

      <div class="empty-state" *ngIf="!loading && answers.length === 0">
        <span class="empty-icon">✅</span>
        <p>Aucune réponse trouvée.</p>
        <a routerLink="nouveau" class="btn-add">Créer la première</a>
      </div>

      <div class="table-wrap" *ngIf="!loading && answers.length > 0">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Contenu</th>
              <th>Correcte</th>
              <th>Question</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let a of answers">
              <td class="id-cell">{{ a.id }}</td>
              <td class="content-cell">{{ a.content }}</td>
              <td>
                <span class="correct-badge" [class.correct]="a.correct" [class.wrong]="!a.correct">
                  {{ a.correct ? '✅ Correcte' : '❌ Incorrecte' }}
                </span>
              </td>
              <td class="q-cell">Question #{{ a.questionId || a.question?.id }}</td>
              <td class="actions-cell">
                <a [routerLink]="['modifier', a.id]" class="btn-edit">✏️ Modifier</a>
                <button class="btn-delete" (click)="confirmDelete(a)">🗑️ Supprimer</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="modal-overlay" *ngIf="toDelete" (click)="toDelete = null">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>Confirmer la suppression</h3>
          <p>Supprimer cette réponse ?</p>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="toDelete = null">Annuler</button>
            <button class="btn-confirm-delete" (click)="deleteAnswer()">Supprimer</button>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .page { }
    .page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:1.75rem; gap:1rem; flex-wrap:wrap; }
    .page-title { font-size:1.5rem; font-weight:800; color:#0f172a; margin:0 0 0.25rem; }
    .page-sub { color:#64748b; margin:0; font-size:0.9rem; }
    .btn-add { background:linear-gradient(135deg,#8b5cf6,#7c3aed); color:#fff; padding:0.65rem 1.4rem; border-radius:10px; font-weight:600; font-size:0.9rem; text-decoration:none; border:none; cursor:pointer; transition:opacity 0.2s; white-space:nowrap; }
    .btn-add:hover { opacity:0.9; }
    .loading { display:flex; align-items:center; gap:1rem; padding:3rem; color:#64748b; }
    .spinner { width:24px; height:24px; border:3px solid #e2e8f0; border-top-color:#8b5cf6; border-radius:50%; animation:spin 0.7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .empty-state { text-align:center; padding:4rem 2rem; color:#64748b; }
    .empty-icon { font-size:3.5rem; display:block; margin-bottom:1rem; }
    .table-wrap { background:#fff; border-radius:16px; box-shadow:0 2px 12px rgba(0,0,0,0.06); overflow:hidden; border:1px solid #f1f5f9; }
    .data-table { width:100%; border-collapse:collapse; }
    .data-table thead { background:#f8fafc; }
    .data-table th { padding:0.9rem 1.25rem; text-align:left; font-size:0.78rem; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.05em; border-bottom:1px solid #e2e8f0; }
    .data-table td { padding:1rem 1.25rem; border-bottom:1px solid #f1f5f9; font-size:0.9rem; color:#334155; vertical-align:middle; }
    .data-table tbody tr:last-child td { border-bottom:none; }
    .data-table tbody tr:hover { background:#fafbfc; }
    .id-cell { color:#94a3b8; font-size:0.8rem; }
    .content-cell { max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:500; }
    .q-cell { color:#64748b; font-size:0.85rem; }
    .correct-badge { padding:0.3rem 0.7rem; border-radius:8px; font-size:0.8rem; font-weight:700; }
    .correct-badge.correct { background:#dcfce7; color:#15803d; }
    .correct-badge.wrong { background:#fef2f2; color:#dc2626; }
    .actions-cell { display:flex; gap:0.5rem; }
    .btn-edit, .btn-delete { padding:0.4rem 0.85rem; border-radius:8px; font-size:0.8rem; font-weight:600; text-decoration:none; border:none; cursor:pointer; transition:all 0.2s; }
    .btn-edit { background:#eff6ff; color:#2563eb; }
    .btn-edit:hover { background:#dbeafe; }
    .btn-delete { background:#fef2f2; color:#dc2626; }
    .btn-delete:hover { background:#fee2e2; }
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.4); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:1000; }
    .modal { background:#fff; border-radius:20px; padding:2rem; max-width:420px; width:90%; box-shadow:0 20px 60px rgba(0,0,0,0.2); }
    .modal h3 { margin:0 0 0.75rem; color:#0f172a; }
    .modal p { color:#64748b; margin:0 0 1.5rem; line-height:1.6; }
    .modal-actions { display:flex; gap:0.75rem; justify-content:flex-end; }
    .btn-cancel { padding:0.6rem 1.25rem; border-radius:10px; background:#f1f5f9; color:#64748b; border:none; font-weight:600; cursor:pointer; }
    .btn-confirm-delete { padding:0.6rem 1.25rem; border-radius:10px; background:#dc2626; color:#fff; border:none; font-weight:600; cursor:pointer; }
  `]
})
export class AnswerListComponent implements OnInit {
    answers: Answer[] = [];
    loading = true;
    toDelete: Answer | null = null;

    constructor(private svc: AnswerService) { }

    ngOnInit(): void { this.load(); }

    load(): void {
        this.loading = true;
        this.svc.getAll().subscribe({
            next: d => { this.answers = d; this.loading = false; },
            error: () => { this.answers = []; this.loading = false; }
        });
    }

    confirmDelete(a: Answer): void { this.toDelete = a; }

    deleteAnswer(): void {
        if (!this.toDelete?.id) return;
        this.svc.delete(this.toDelete.id).subscribe({
            next: () => { this.toDelete = null; this.load(); },
            error: () => { this.toDelete = null; }
        });
    }
}
