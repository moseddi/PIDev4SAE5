import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Answer, Question } from '../../models/certification.models';
import { AnswerService } from '../../services/answer.service';
import { QuestionService } from '../../services/question.service';

@Component({
    selector: 'app-answer-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    template: `
    <div class="form-page">
      <div class="breadcrumb">
        <a routerLink="../../..">Dashboard</a> <span>/</span>
        <a routerLink="../..">Réponses</a> <span>/</span>
        <span>{{ isEdit ? 'Modifier' : 'Nouvelle réponse' }}</span>
      </div>

      <div class="form-card">
        <div class="form-header">
          <div class="form-icon">✅</div>
          <div>
            <h2 class="form-title">{{ isEdit ? 'Modifier la réponse' : 'Nouvelle réponse' }}</h2>
            <p class="form-sub">Définissez si cette réponse est correcte ou non</p>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="form-body">

          <div class="field">
            <label for="questionId">Question *</label>
            <select id="questionId" formControlName="questionId" class="input select">
              <option value="">— Sélectionnez une question —</option>
              <option *ngFor="let q of questions" [value]="q.id">
                #{{ q.id }} — {{ q.content | slice:0:60 }}{{ q.content.length > 60 ? '…' : '' }}
              </option>
            </select>
            <span class="error" *ngIf="f['questionId'].touched && f['questionId'].invalid">Sélectionnez une question</span>
          </div>

          <div class="field">
            <label for="content">Contenu de la réponse *</label>
            <textarea id="content" formControlName="content" class="input textarea"
                      placeholder="Rédigez le texte de cette réponse…" rows="3"></textarea>
            <span class="error" *ngIf="f['content'].touched && f['content'].invalid">Le contenu est requis</span>
          </div>

          <div class="field">
            <label>Est-ce la bonne réponse ? *</label>
            <div class="correct-toggle">
              <button type="button" class="toggle-btn" [class.correct]="f['correct'].value === true"
                      (click)="form.patchValue({ correct: true })">
                ✅ Oui, c'est correct
              </button>
              <button type="button" class="toggle-btn" [class.wrong]="f['correct'].value === false"
                      (click)="form.patchValue({ correct: false })">
                ❌ Non, c'est incorrect
              </button>
            </div>
          </div>

          <div class="api-error" *ngIf="apiError">{{ apiError }}</div>

          <div class="form-actions">
            <a routerLink=".." class="btn-cancel">Annuler</a>
            <button type="submit" class="btn-submit" [disabled]="submitting">
              <span class="spinner-sm" *ngIf="submitting"></span>
              {{ submitting ? 'Enregistrement…' : (isEdit ? '✅ Mettre à jour' : '✅ Créer') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
    styles: [`
    .form-page { max-width:680px; }
    .breadcrumb { display:flex; gap:0.5rem; align-items:center; margin-bottom:1.5rem; font-size:0.85rem; color:#64748b; }
    .breadcrumb a { color:#8b5cf6; text-decoration:none; }
    .form-card { background:#fff; border-radius:20px; box-shadow:0 2px 16px rgba(0,0,0,0.07); overflow:hidden; border:1px solid #f1f5f9; }
    .form-header { display:flex; align-items:center; gap:1.25rem; padding:1.75rem 2rem; border-bottom:1px solid #f1f5f9; background:linear-gradient(135deg,#fdf4ff,#f5f3ff); }
    .form-icon { font-size:2.5rem; }
    .form-title { margin:0 0 0.2rem; font-size:1.25rem; font-weight:800; color:#0f172a; }
    .form-sub { margin:0; color:#64748b; font-size:0.85rem; }
    .form-body { padding:2rem; display:flex; flex-direction:column; gap:1.5rem; }
    .field { display:flex; flex-direction:column; gap:0.5rem; }
    .field label { font-weight:600; font-size:0.88rem; color:#374151; }
    .input { padding:0.75rem 1rem; border:1.5px solid #e2e8f0; border-radius:10px; font-size:0.95rem; color:#0f172a; transition:border 0.2s; outline:none; width:100%; box-sizing:border-box; font-family:inherit; }
    .input:focus { border-color:#8b5cf6; box-shadow:0 0 0 3px rgba(139,92,246,0.15); }
    .select { appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 0.75rem center; background-size:1rem; padding-right:2.5rem; }
    .textarea { resize:vertical; min-height:90px; }
    .error { color:#dc2626; font-size:0.8rem; }
    .correct-toggle { display:flex; gap:0.75rem; flex-wrap:wrap; }
    .toggle-btn { padding:0.65rem 1.25rem; border-radius:12px; font-weight:600; font-size:0.9rem; border:2px solid #e2e8f0; background:#f8fafc; color:#64748b; cursor:pointer; transition:all 0.2s; }
    .toggle-btn:hover { background:#f1f5f9; }
    .toggle-btn.correct { background:#dcfce7; color:#15803d; border-color:#86efac; }
    .toggle-btn.wrong { background:#fef2f2; color:#dc2626; border-color:#fca5a5; }
    .api-error { background:#fef2f2; border:1px solid #fecaca; color:#dc2626; padding:0.75rem 1rem; border-radius:10px; font-size:0.88rem; }
    .form-actions { display:flex; gap:0.75rem; justify-content:flex-end; padding-top:0.5rem; }
    .btn-cancel { padding:0.65rem 1.4rem; border-radius:10px; background:#f1f5f9; color:#64748b; text-decoration:none; font-weight:600; font-size:0.9rem; }
    .btn-submit { display:flex; align-items:center; gap:0.5rem; padding:0.65rem 1.6rem; border-radius:10px; background:linear-gradient(135deg,#8b5cf6,#7c3aed); color:#fff; border:none; font-weight:700; font-size:0.9rem; cursor:pointer; transition:opacity 0.2s; }
    .btn-submit:disabled { opacity:0.6; cursor:not-allowed; }
    .spinner-sm { width:16px; height:16px; border:2px solid rgba(255,255,255,0.4); border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
  `]
})
export class AnswerFormComponent implements OnInit {
    form!: FormGroup;
    isEdit = false;
    submitting = false;
    apiError = '';
    questions: Question[] = [];

    constructor(
        private fb: FormBuilder,
        private svc: AnswerService,
        private questionSvc: QuestionService,
        private router: Router,
        private route: ActivatedRoute,
    ) { }

    get f() { return this.form.controls; }

    ngOnInit(): void {
        this.form = this.fb.group({
            questionId: ['', Validators.required],
            content: ['', Validators.required],
            correct: [false],
        });
        this.questionSvc.getAll().subscribe(d => this.questions = d);

        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEdit = true;
            this.svc.getById(+id).subscribe(a =>
                this.form.patchValue({ questionId: a.questionId || a.question?.id, content: a.content, correct: a.correct })
            );
        }
    }

    submit(): void {
        if (this.form.invalid) { this.form.markAllAsTouched(); return; }
        this.submitting = true;
        this.apiError = '';
        const payload: Answer = { ...this.form.value, questionId: +this.form.value.questionId };
        const id = this.route.snapshot.paramMap.get('id');
        const req = id ? this.svc.update(+id, payload) : this.svc.create(payload);
        req.subscribe({
            next: () => this.router.navigate(['..'], { relativeTo: this.route }),
            error: err => { this.apiError = err?.error?.message || 'Erreur lors de l\'enregistrement.'; this.submitting = false; }
        });
    }
}
