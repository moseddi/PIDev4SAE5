import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { Question, CertificationExam, Certification } from '../../models/certification.models';
import { QuestionService } from '../../services/question.service';
import { ExamService } from '../../services/exam.service';
import { CertificationService } from '../../services/certification.service';
import { AnswerService } from '../../services/answer.service';

interface AnswerLocal {
  id?: number;
  content: string;
  correct: boolean;
  _deleted?: boolean;
}

@Component({
  selector: 'app-question-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  template: `
    <div class="form-page">
      <div class="breadcrumb">
        <a routerLink="../../..">Dashboard</a> <span>/</span>
        <a routerLink="../..">Questions</a> <span>/</span>
        <span>{{ isEdit ? 'Modifier' : 'Nouvelle question' }}</span>
      </div>

      <div class="form-card">
        <div class="form-header">
          <div class="form-icon">❓</div>
          <div>
            <h2 class="form-title">{{ isEdit ? 'Modifier la question' : 'Nouvelle question' }}</h2>
            <p class="form-sub">Associez la question à une certification et à un examen</p>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="form-body">
          <div class="field">
            <label for="certificationId">Certification (optionnel – filtre les examens)</label>
            <select id="certificationId" formControlName="certificationId" class="input select">
              <option value="">— Tous les examens —</option>
              <option *ngFor="let c of certifications" [value]="c.id">
                {{ c.title }} — {{ c.level }}
              </option>
            </select>
          </div>

          <div class="field">
            <label for="examId">Examen *</label>
            <select id="examId" formControlName="examId" class="input select">
              <option value="">— Sélectionnez un examen —</option>
              <option *ngFor="let e of examOptions" [value]="e.id">
                {{ e.title || ('Examen #' + e.id) }} — {{ e.duration }} min
              </option>
            </select>
            <span class="error" *ngIf="f['examId'].touched && f['examId'].invalid">Sélectionnez un examen</span>
          </div>

          <div class="field">
            <label for="type">Type de question *</label>
            <select id="type" formControlName="type" class="input select">
              <option value="">— Sélectionnez un type —</option>
              <option value="MULTIPLE_CHOICE">QCM - Choix multiples</option>
              <option value="TRUE_FALSE">Vrai / Faux</option>
              <option value="OPEN">Question ouverte</option>
            </select>
            <span class="error" *ngIf="f['type'].touched && f['type'].invalid">Sélectionnez un type</span>
          </div>

          <div class="field">
            <label>Durée</label>
            <div class="duration-display" *ngIf="selectedExam">
              ⏱️ {{ selectedExam.duration }} min
            </div>
            <div class="duration-placeholder" *ngIf="!selectedExam">Sélectionnez un examen pour afficher la durée</div>
          </div>

          <div class="field">
            <label for="content">Énoncé de la question *</label>
            <textarea id="content" formControlName="content" class="input textarea"
                      placeholder="Rédigez votre question ici…" rows="4"></textarea>
            <span class="error" *ngIf="f['content'].touched && f['content'].invalid">L'énoncé est requis</span>
          </div>

          <!-- ─── Réponses inline ─────────────────────────────────────────── -->
          <div class="answers-section" *ngIf="showAnswers">
            <div class="answers-header">
              <span class="answers-label">Réponses</span>
              <span class="badge-qcm" *ngIf="questionType === 'MULTIPLE_CHOICE'">QCM</span>
              <span class="badge-tf"  *ngIf="questionType === 'TRUE_FALSE'">Vrai / Faux</span>
            </div>

            <div class="tf-hint" *ngIf="questionType === 'TRUE_FALSE'">
              Cliquez sur une ligne pour marquer la bonne réponse.
            </div>

            <div class="answers-list">
              <div class="answer-row"
                   *ngFor="let ans of visibleAnswers; let i = index"
                   [class.row-correct]="ans.correct">
                <span class="answer-num">{{ i + 1 }}</span>
                <input
                  type="text"
                  [(ngModel)]="ans.content"
                  [ngModelOptions]="{standalone: true}"
                  class="input answer-input"
                  [placeholder]="'Réponse ' + (i + 1)"
                  [readonly]="questionType === 'TRUE_FALSE'">
                <button type="button"
                        class="btn-correct"
                        [class.correct-on]="ans.correct"
                        (click)="questionType === 'TRUE_FALSE' ? setCorrectTF(i) : toggleCorrect(i)"
                        [title]="ans.correct ? 'Réponse correcte' : 'Marquer comme correcte'">
                  {{ ans.correct ? '✅' : '○' }}
                </button>
                <button type="button"
                        class="btn-del-answer"
                        (click)="removeAnswer(i)"
                        *ngIf="questionType !== 'TRUE_FALSE'"
                        title="Supprimer cette réponse">×</button>
              </div>
            </div>

            <p class="no-answers-hint" *ngIf="visibleAnswers.length === 0 && questionType === 'MULTIPLE_CHOICE'">
              Aucune réponse — utilisez le bouton ci-dessous pour en ajouter.
            </p>

            <button type="button" class="btn-add-answer" (click)="addAnswer()" *ngIf="canAddMore">
              + Ajouter une réponse
            </button>

            <p class="answer-count" *ngIf="questionType === 'MULTIPLE_CHOICE' && visibleAnswers.length > 0">
              {{ visibleAnswers.length }} réponse(s) · {{ correctCount }} correcte(s)
            </p>
          </div>
          <!-- ─────────────────────────────────────────────────────────────── -->

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
    .breadcrumb a { color:#f59e0b; text-decoration:none; }
    .form-card { background:#fff; border-radius:20px; box-shadow:0 2px 16px rgba(0,0,0,0.07); overflow:hidden; border:1px solid #f1f5f9; }
    .form-header { display:flex; align-items:center; gap:1.25rem; padding:1.75rem 2rem; border-bottom:1px solid #f1f5f9; background:linear-gradient(135deg,#fffbeb,#fef9c3); }
    .form-icon { font-size:2.5rem; }
    .form-title { margin:0 0 0.2rem; font-size:1.25rem; font-weight:800; color:#0f172a; }
    .form-sub { margin:0; color:#64748b; font-size:0.85rem; }
    .form-body { padding:2rem; display:flex; flex-direction:column; gap:1.5rem; }
    .field { display:flex; flex-direction:column; gap:0.5rem; }
    .field label { font-weight:600; font-size:0.88rem; color:#374151; }
    .input { padding:0.75rem 1rem; border:1.5px solid #e2e8f0; border-radius:10px; font-size:0.95rem; color:#0f172a; transition:border 0.2s; outline:none; width:100%; box-sizing:border-box; font-family:inherit; }
    .input:focus { border-color:#f59e0b; box-shadow:0 0 0 3px rgba(245,158,11,0.15); }
    .select { appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 0.75rem center; background-size:1rem; padding-right:2.5rem; }
    .textarea { resize:vertical; min-height:110px; }
    .error { color:#dc2626; font-size:0.8rem; }
    .duration-display { padding:0.75rem 1rem; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; font-weight:600; color:#166534; }
    .duration-placeholder { padding:0.75rem 1rem; color:#94a3b8; font-size:0.9rem; }
    .api-error { background:#fef2f2; border:1px solid #fecaca; color:#dc2626; padding:0.75rem 1rem; border-radius:10px; font-size:0.88rem; }
    .form-actions { display:flex; gap:0.75rem; justify-content:flex-end; padding-top:0.5rem; }
    .btn-cancel { padding:0.65rem 1.4rem; border-radius:10px; background:#f1f5f9; color:#64748b; text-decoration:none; font-weight:600; font-size:0.9rem; }
    .btn-submit { display:flex; align-items:center; gap:0.5rem; padding:0.65rem 1.6rem; border-radius:10px; background:linear-gradient(135deg,#f59e0b,#d97706); color:#fff; border:none; font-weight:700; font-size:0.9rem; cursor:pointer; transition:opacity 0.2s; }
    .btn-submit:disabled { opacity:0.6; cursor:not-allowed; }
    .spinner-sm { width:16px; height:16px; border:2px solid rgba(255,255,255,0.4); border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    /* ─── Answers section ───────────────────────────────────────────────── */
    .answers-section { background:#f8fafc; border-radius:14px; padding:1.25rem 1.5rem; border:1.5px dashed #cbd5e1; display:flex; flex-direction:column; gap:0.75rem; }
    .answers-header { display:flex; align-items:center; gap:0.6rem; }
    .answers-label { font-weight:700; font-size:0.9rem; color:#374151; }
    .badge-qcm { background:#eff6ff; color:#2563eb; border:1px solid #bfdbfe; border-radius:20px; padding:0.15rem 0.65rem; font-size:0.75rem; font-weight:700; }
    .badge-tf  { background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0; border-radius:20px; padding:0.15rem 0.65rem; font-size:0.75rem; font-weight:700; }
    .tf-hint { background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:0.45rem 0.75rem; font-size:0.8rem; color:#92400e; }
    .answers-list { display:flex; flex-direction:column; gap:0.5rem; }
    .answer-row { display:flex; align-items:center; gap:0.5rem; padding:0.4rem 0.6rem; border-radius:10px; border:1.5px solid #e2e8f0; background:#fff; transition:border-color 0.2s; }
    .answer-row.row-correct { border-color:#86efac; background:#f0fdf4; }
    .answer-num { min-width:1.4rem; font-size:0.8rem; font-weight:700; color:#94a3b8; text-align:center; }
    .answer-input { flex:1; border:none; outline:none; background:transparent; padding:0.3rem 0.25rem; font-size:0.93rem; color:#0f172a; font-family:inherit; }
    .answer-input[readonly] { color:#6b7280; cursor:default; }
    .btn-correct { padding:0.35rem 0.7rem; border-radius:8px; border:1.5px solid #d1d5db; background:#f9fafb; cursor:pointer; font-size:1rem; transition:all 0.15s; white-space:nowrap; }
    .btn-correct.correct-on { background:#dcfce7; border-color:#86efac; }
    .btn-del-answer { padding:0.35rem 0.55rem; border:none; background:#fef2f2; color:#dc2626; border-radius:8px; cursor:pointer; font-size:1rem; font-weight:700; line-height:1; transition:background 0.15s; }
    .btn-del-answer:hover { background:#fee2e2; }
    .btn-add-answer { align-self:flex-start; padding:0.55rem 1rem; background:#eff6ff; border:1.5px dashed #93c5fd; color:#2563eb; border-radius:8px; cursor:pointer; font-size:0.85rem; font-weight:600; transition:background 0.15s; }
    .btn-add-answer:hover { background:#dbeafe; }
    .no-answers-hint { margin:0; font-size:0.82rem; color:#94a3b8; text-align:center; padding:0.5rem 0; }
    .answer-count { margin:0; font-size:0.8rem; color:#64748b; }
  `]
})
export class QuestionFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  submitting = false;
  apiError = '';
  certifications: Certification[] = [];
  allExams: CertificationExam[] = [];
  examsForCert: CertificationExam[] = [];
  selectedExam: CertificationExam | null = null;
  private _patchingForEdit = false;

  // Inline answer management
  localAnswers: AnswerLocal[] = [];

  get examOptions(): CertificationExam[] {
    return this.examsForCert.length > 0 ? this.examsForCert : this.allExams;
  }

  get questionType(): string {
    return this.form?.get('type')?.value ?? '';
  }

  get showAnswers(): boolean {
    const t = this.questionType;
    return t === 'MULTIPLE_CHOICE' || t === 'TRUE_FALSE';
  }

  get visibleAnswers(): AnswerLocal[] {
    return this.localAnswers.filter(a => !a._deleted);
  }

  get canAddMore(): boolean {
    return this.questionType === 'MULTIPLE_CHOICE' && this.visibleAnswers.length < 6;
  }

  get correctCount(): number {
    return this.visibleAnswers.filter(a => a.correct).length;
  }

  constructor(
    private fb: FormBuilder,
    private svc: QuestionService,
    private examSvc: ExamService,
    private certSvc: CertificationService,
    private answerSvc: AnswerService,
    private router: Router,
    private route: ActivatedRoute,
  ) { }

  get f() { return this.form.controls; }

  ngOnInit(): void {
    this.form = this.fb.group({
      certificationId: [''],
      examId: ['', Validators.required],
      type: ['MULTIPLE_CHOICE', Validators.required],
      content: ['', Validators.required],
    });

    this.certSvc.getAll().subscribe((d: Certification[]) => this.certifications = d);
    this.examSvc.getAll().subscribe((d: CertificationExam[]) => this.allExams = d);

    this.form.get('certificationId')?.valueChanges.subscribe((certId: number | string) => {
      if (this._patchingForEdit) return;
      this.form.patchValue({ examId: '' }, { emitEvent: false });
      this.examsForCert = [];
      this.selectedExam = null;
      if (certId) {
        this.examSvc.getByCertification(Number(certId)).subscribe({
          next: (exams: CertificationExam[]) => { this.examsForCert = exams; },
          error: () => { this.examsForCert = []; }
        });
      }
    });

    this.form.get('examId')?.valueChanges.subscribe((examId: number | string) => {
      const id = examId ? Number(examId) : 0;
      this.selectedExam = this.examOptions.find((e: CertificationExam) => e.id === id) || null;
    });

    // Auto-populate TRUE_FALSE answers when type changes
    this.form.get('type')?.valueChanges.subscribe((newType: string) => {
      if (newType === 'TRUE_FALSE' && this.visibleAnswers.length === 0) {
        // Keep any DB-backed answers; only pre-fill if none exist
        this.localAnswers = [
          { content: 'Vrai', correct: true },
          { content: 'Faux', correct: false }
        ];
      }
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.svc.getById(+id).subscribe({
        next: (q: Question) => {
          this.loadQuestionForEdit(q);
          // Load existing answers for this question
          this.answerSvc.getByQuestion(+id).subscribe({
            next: (answers) => {
              this.localAnswers = answers.map(a => ({
                id: a.id,
                content: a.content,
                correct: a.correct
              }));
            }
          });
        },
        error: () => { this.apiError = 'Question introuvable.'; }
      });
    }
  }

  // ─── Answer management helpers ───────────────────────────────────────────

  addAnswer(): void {
    this.localAnswers.push({ content: '', correct: false });
  }

  removeAnswer(visibleIndex: number): void {
    const visible = this.visibleAnswers;
    const answer = visible[visibleIndex];
    if (answer.id) {
      // DB-backed: mark as deleted (will be DELETE-d on submit)
      answer._deleted = true;
    } else {
      // New (no id): remove from array immediately
      const idx = this.localAnswers.indexOf(answer);
      if (idx !== -1) this.localAnswers.splice(idx, 1);
    }
  }

  toggleCorrect(visibleIndex: number): void {
    const answer = this.visibleAnswers[visibleIndex];
    answer.correct = !answer.correct;
  }

  // TRUE_FALSE: only one correct at a time
  setCorrectTF(visibleIndex: number): void {
    this.visibleAnswers.forEach((a, i) => a.correct = (i === visibleIndex));
  }

  // ─── Private: load existing question for edit ─────────────────────────────

  private loadQuestionForEdit(q: Question): void {
    const examId = q.exam_id ?? q.exam?.id ?? q.examId ?? (q as any).examenId;
    let certId = (q.exam as CertificationExam)?.certificationId ?? (q.exam as CertificationExam)?.certification?.id;
    const content = (q as any).enonce ?? q.content ?? '';
    const type = q.type ?? 'MULTIPLE_CHOICE';

    if (examId && !certId) {
      this.examSvc.getById(examId).subscribe((exam: CertificationExam) => {
        certId = exam.certificationId ?? exam.certification?.id;
        this._patchingForEdit = true;
        this.form.patchValue({
          certificationId: certId || '',
          examId: examId || '',
          type: type,
          content,
        });
        if (certId) {
          this.examSvc.getByCertification(Number(certId)).subscribe((exams: CertificationExam[]) => {
            this.examsForCert = exams;
            this.selectedExam = exams.find((e: CertificationExam) => e.id === examId) || null;
            this._patchingForEdit = false;
          });
        } else {
          this._patchingForEdit = false;
        }
      });
    } else {
      this._patchingForEdit = true;
      this.form.patchValue({
        certificationId: certId || '',
        examId: examId || '',
        type: type,
        content,
      });
      if (certId && examId) {
        this.examSvc.getByCertification(Number(certId)).subscribe((exams: CertificationExam[]) => {
          this.examsForCert = exams;
          this.selectedExam = exams.find((e: CertificationExam) => e.id === examId) || null;
          this._patchingForEdit = false;
        });
      } else {
        this._patchingForEdit = false;
      }
    }
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.apiError = '';

    const formValue = this.form.value;
    const examId = Number(formValue.examId);
    const content = (formValue.content ?? '').trim();
    const type = formValue.type ?? 'MULTIPLE_CHOICE';
    const id = this.route.snapshot.paramMap.get('id');

    if (!examId || !content || !type) {
      this.form.markAllAsTouched();
      this.submitting = false;
      return;
    }

    const questionData = { content, type, examId };
    const req = id ? this.svc.update(+id, questionData) : this.svc.create(questionData);

    req.subscribe({
      next: (savedQuestion) => {
        const questionId = savedQuestion?.id ?? (id ? +id : 0);
        this.saveAnswersAndNavigate(questionId);
      },
      error: (err) => {
        this.apiError = err?.error?.message ?? err?.error?.error ?? 'Erreur lors de l\'enregistrement.';
        this.submitting = false;
      }
    });
  }

  private saveAnswersAndNavigate(questionId: number): void {
    if (!this.showAnswers || this.localAnswers.length === 0) {
      this.router.navigate(['..'], { relativeTo: this.route });
      return;
    }

    const ops: Observable<any>[] = [];

    for (const a of this.localAnswers) {
      if (a._deleted && a.id) {
        ops.push(this.answerSvc.delete(a.id));
      } else if (!a.id && !a._deleted && a.content.trim()) {
        ops.push(this.answerSvc.createForQuestion(questionId, {
          content: a.content.trim(),
          correct: a.correct
        }));
      } else if (a.id && !a._deleted) {
        ops.push(this.answerSvc.update(a.id, {
          id: a.id,
          content: a.content.trim(),
          correct: a.correct
        }));
      }
    }

    if (ops.length === 0) {
      this.router.navigate(['..'], { relativeTo: this.route });
      return;
    }

    forkJoin(ops).subscribe({
      next: () => this.router.navigate(['..'], { relativeTo: this.route }),
      error: () => this.router.navigate(['..'], { relativeTo: this.route })
    });
  }
}
