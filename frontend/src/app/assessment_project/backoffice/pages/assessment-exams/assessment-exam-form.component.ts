import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AssessmentExamService, AssessmentExam, AssessmentExamType } from '../../services/assessment-exam.service';

@Component({
    selector: 'app-assessment-exam-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    template: `
    <div class="page">
      <div class="breadcrumb">
        <a routerLink="../..">Examens</a> <span>/</span>
        <span>{{ isEdit ? 'Modifier' : 'Nouvel examen' }}</span>
      </div>

      <div class="form-card">
        <div class="form-header">
          <div class="icon">📝</div>
          <div>
            <h2>{{ isEdit ? "Modifier l'examen" : 'Nouvel examen' }}</h2>
            <p>Renseignez les informations de l'examen. Les questions seront ajoutées ensuite.</p>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="form-body">

          <!-- Title -->
          <div class="field">
            <label>Titre *</label>
            <input type="text" class="input" formControlName="title" placeholder="Ex : Examen Final S1 2025" />
            <span class="err" *ngIf="f['title'].touched && f['title'].invalid">Le titre est requis</span>
          </div>

          <!-- Type -->
          <div class="field">
            <label>Type d'examen *</label>
            <div class="type-row">
              <button type="button" class="type-btn"
                [class.selected]="f['examType'].value === 'EXAM'"
                (click)="form.patchValue({examType:'EXAM'})">📋 Examen</button>
              <button type="button" class="type-btn"
                [class.selected]="f['examType'].value === 'TEST'"
                (click)="form.patchValue({examType:'TEST'})">🧪 Test</button>
              <button type="button" class="type-btn"
                [class.selected]="f['examType'].value === 'QUIZ'"
                (click)="form.patchValue({examType:'QUIZ'})">⚡ Quiz+Questions</button>
            </div>
          </div>

          <!-- Duration + PassingScore row -->
          <div class="field-row">
            <div class="field">
              <label>Durée (minutes) *</label>
              <input type="number" min="1" class="input" formControlName="duration" placeholder="60" />
            </div>
            <div class="field">
              <label>Note minimale (/ 100) *</label>
              <input type="number" min="0" max="100" class="input" formControlName="passingScore"
                placeholder="50" />
              <span class="hint">Score requis pour obtenir un certificat</span>
            </div>
          </div>

          <!-- Description -->
          <div class="field">
            <label>Description</label>
            <textarea class="input textarea" formControlName="description" rows="3"
              placeholder="Instructions, matières couvertes…"></textarea>
          </div>

          <div class="api-error" *ngIf="apiError">{{ apiError }}</div>

          <div class="actions">
            <a routerLink="../.." class="btn-cancel">Annuler</a>
            <button type="submit" class="btn-submit" [disabled]="submitting">
              {{ submitting ? 'Enregistrement…' : (isEdit ? '✅ Mettre à jour' : '✅ Créer') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
    styles: [`
    .page { max-width: 700px; }
    .breadcrumb { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 1.5rem; font-size: 0.85rem; color: #64748b; }
    .breadcrumb a { color: #2d5757; text-decoration: none; font-weight: 600; }
    .form-card { background: #fff; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.07); overflow: hidden; border: 1px solid #f1f5f9; }
    .form-header { display: flex; align-items: center; gap: 1.25rem; padding: 1.75rem 2rem; border-bottom: 1px solid #f1f5f9; background: linear-gradient(135deg,#f0f7f7,#e8f4f4); }
    .icon { font-size: 2.5rem; }
    .form-header h2 { margin: 0 0 0.2rem; font-size: 1.2rem; font-weight: 800; color: #0f172a; }
    .form-header p { margin: 0; color: #64748b; font-size: 0.85rem; }
    .form-body { padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
    .field { display: flex; flex-direction: column; gap: 0.4rem; flex: 1; }
    .field label { font-weight: 600; font-size: 0.88rem; color: #374151; }
    .field-row { display: flex; gap: 1.5rem; }
    .input { padding: 0.75rem 1rem; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 0.95rem; color: #0f172a; outline: none; width: 100%; box-sizing: border-box; font-family: inherit; transition: border 0.2s; }
    .input:focus { border-color: #2d5757; box-shadow: 0 0 0 3px rgba(45,87,87,0.12); }
    .textarea { resize: vertical; min-height: 80px; }
    .hint { font-size: 0.78rem; color: #94a3b8; }
    .err { color: #dc2626; font-size: 0.8rem; }
    .type-row { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .type-btn { padding: 0.65rem 1.2rem; border-radius: 10px; background: #f1f5f9; color: #64748b; border: 2px solid transparent; font-weight: 600; font-size: 0.88rem; cursor: pointer; transition: all 0.2s; }
    .type-btn.selected { background: #e8f4f4; color: #2d5757; border-color: #2d5757; }
    .api-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 0.75rem; border-radius: 10px; font-size: 0.88rem; }
    .actions { display: flex; gap: 0.75rem; justify-content: flex-end; padding-top: 0.5rem; }
    .btn-cancel { padding: 0.65rem 1.4rem; border-radius: 10px; background: #f1f5f9; color: #64748b; text-decoration: none; font-weight: 600; font-size: 0.9rem; }
    .btn-submit { padding: 0.65rem 1.6rem; border-radius: 10px; background: linear-gradient(135deg,#2d5757,#1a3a3a); color: #fff; border: none; font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: opacity 0.2s; }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class AssessmentExamFormComponent implements OnInit {
    form!: FormGroup;
    isEdit = false;
    submitting = false;
    apiError = '';

    constructor(
        private fb: FormBuilder,
        private svc: AssessmentExamService,
        private router: Router,
        private route: ActivatedRoute,
    ) { }

    get f() { return this.form.controls; }

    ngOnInit() {
        this.form = this.fb.group({
            title: ['', Validators.required],
            examType: [AssessmentExamType.EXAM, Validators.required],
            duration: [60, [Validators.required, Validators.min(1)]],
            passingScore: [50, [Validators.required, Validators.min(0), Validators.max(100)]],
            description: [''],
        });

        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEdit = true;
            this.svc.getExam(+id).subscribe({
                next: (e) => this.form.patchValue(e),
                error: () => this.apiError = 'Examen introuvable.'
            });
        }
    }

    submit() {
        if (this.form.invalid) { this.form.markAllAsTouched(); return; }
        this.submitting = true;
        this.apiError = '';

        const payload = this.form.value as AssessmentExam;
        const id = this.route.snapshot.paramMap.get('id');
        const req = id ? this.svc.updateExam(+id, payload) : this.svc.createExam(payload);

        req.subscribe({
            next: (e) => {
                if (!id) {
                    // redirect to questions page so admin can add questions right away
                    this.router.navigate(['..', 'questions', e.id], { relativeTo: this.route });
                } else {
                    this.router.navigate(['../..'], { relativeTo: this.route });
                }
            },
            error: (err) => {
                this.apiError = err?.error?.message ?? err?.message ?? 'Erreur serveur (port 8088).';
                this.submitting = false;
            }
        });
    }
}
