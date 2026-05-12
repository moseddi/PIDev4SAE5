import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  AssessmentExamService, AssessmentExam, AssessmentQuestion,
  AssessmentAnswer, AssessmentQuestionType
} from '../../services/assessment-exam.service';

@Component({
  selector: 'app-assessment-exam-questions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="breadcrumb">
        <a routerLink="../../../..">Examens</a> <span>/</span>
        <span>Questions — {{ exam?.title }}</span>
      </div>

      <div class="top-row">
        <div>
          <h2 class="section-title">❓ Questions de l'examen</h2>
          <p class="section-sub" *ngIf="exam">
            <span class="badge">{{ exam.examType }}</span>
            {{ exam.duration }} min
            &nbsp;|&nbsp; Note minimale : {{ exam.passingScore }}/100
          </p>
        </div>
        <a [routerLink]="['../../../notes', examId]" class="btn-secondary">📊 Voir les notes →</a>
      </div>

      <!-- Existing questions list -->
      <div class="questions-list">
        <div class="loading" *ngIf="loading">Chargement des questions…</div>

        <div class="empty" *ngIf="!loading && questions.length === 0">
          Aucune question pour l'instant. Ajoutez-en une ci-dessous.
        </div>

        <div class="question-card" *ngFor="let q of questions; let i = index">
          <div class="q-header">
            <span class="q-num">Q{{ i + 1 }}</span>
            <span class="q-type-badge qtype-{{ q.type.toLowerCase() }}">{{ typeLabel(q.type) }}</span>
          </div>
          <p class="q-text">{{ q.content }}</p>

          <!-- Answers for MCQ / TRUE_FALSE -->
          <div class="answers-preview" *ngIf="q.type !== questionTypes.OPEN && q.answers && q.answers.length > 0">
            <div *ngFor="let a of q.answers; let j = index" class="answer-chip" [class.correct]="a.correct">
              {{ getLetter(j) }}. {{ a.content }} <span *ngIf="a.correct">✓</span>
            </div>
          </div>

          <div class="q-footer">
            <button class="btn-del" (click)="deleteQuestion(q)">🗑️ Supprimer</button>
          </div>
        </div>
      </div>

      <!-- Add question form -->
      <div class="add-card">
        <h3>➕ Ajouter une question</h3>

        <form [formGroup]="qForm" (ngSubmit)="addQuestion()">

          <!-- Type selector -->
          <div class="field">
            <label>Type de question</label>
            <div class="type-row">
              <button type="button" *ngFor="let t of questionTypeOptions" class="type-btn"
                [class.selected]="qForm.value.type === t.value"
                (click)="selectType(t.value)">{{ t.label }}</button>
            </div>
          </div>

          <!-- Content -->
          <div class="field">
            <label>Énoncé *</label>
            <textarea class="input" formControlName="content" rows="3"
              placeholder="Rédigez la question ici…"></textarea>
            <span class="err" *ngIf="qForm.get('content')!.touched && qForm.get('content')!.invalid">L'énoncé est requis</span>
          </div>

          <!-- Options for MCQ / TRUE_FALSE -->
          <div *ngIf="qForm.value.type !== questionTypes.OPEN">
            <div class="field">
              <label>Options de réponse</label>
              <p class="hint">Cochez la bonne réponse ✓</p>
              <div formArrayName="answers" class="options-list">
                <div *ngFor="let ctrl of answersArray.controls; let j = index"
                  [formGroupName]="j" class="option-row">
                  <input type="radio" [name]="'correct_' + j"
                    [checked]="ctrl.get('correct')!.value"
                    (change)="setCorrect(j)" />
                  <span class="opt-letter">{{ getLetter(j) }}</span>
                  <input type="text" class="input opt-input" formControlName="content"
                    [placeholder]="'Option ' + getLetter(j)" />
                  <button type="button" class="btn-del-opt"
                    (click)="removeAnswer(j)"
                    *ngIf="answersArray.length > 2">✕</button>
                </div>
              </div>
              <button type="button" class="btn-add-opt" (click)="addAnswer()"
                *ngIf="answersArray.length < 6">+ Ajouter une option</button>
            </div>
          </div>

          <div class="api-error" *ngIf="qError">{{ qError }}</div>

          <div class="actions">
            <button type="submit" class="btn-submit" [disabled]="qSubmitting">
              {{ qSubmitting ? 'Ajout…' : '✅ Ajouter la question' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 800px; margin: 0 auto; padding: 2rem; }
    .breadcrumb { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 1.5rem; font-size: 0.85rem; color: #64748b; }
    .breadcrumb a { color: #2d5757; text-decoration: none; font-weight: 600; }
    .top-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .section-title { margin: 0; font-size: 1.4rem; font-weight: 800; color: #0f172a; }
    .section-sub { margin: 0.25rem 0 0; color: #64748b; font-size: 0.88rem; }
    .badge { background: #dbeafe; color: #1d4ed8; padding: 0.2rem 0.6rem; border-radius: 50px; font-size: 0.75rem; font-weight: 700; }
    .btn-secondary { padding: 0.55rem 1.2rem; background: #f1f5f9; color: #2d5757; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 0.88rem; white-space: nowrap; }
    .loading, .empty { text-align: center; color: #94a3b8; padding: 2rem; }
    .questions-list { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem; }
    .question-card { background: #fff; border-radius: 14px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); padding: 1.25rem; border: 1px solid #f1f5f9; }
    .q-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
    .q-num { background: #2d5757; color: #fff; padding: 0.2rem 0.6rem; border-radius: 6px; font-size: 0.78rem; font-weight: 700; }
    .q-type-badge { padding: 0.2rem 0.6rem; border-radius: 50px; font-size: 0.75rem; font-weight: 700; }
    .qtype-multiple_choice { background: #eff6ff; color: #1d4ed8; }
    .qtype-true_false      { background: #fef9c3; color: #a16207; }
    .qtype-open            { background: #f0fdf4; color: #15803d; }
    .q-text { margin: 0 0 0.75rem; color: #1e3a3a; font-size: 1rem; }
    .answers-preview { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; }
    .answer-chip { padding: 0.3rem 0.75rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.85rem; color: #475569; }
    .answer-chip.correct { background: #f0fdf4; border-color: #86efac; color: #15803d; font-weight: 700; }
    .q-footer { display: flex; justify-content: flex-end; }
    .btn-del { background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.85rem; font-weight: 600; }
    .add-card { background: #fff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.07); padding: 2rem; border: 2px dashed #cbd5e1; }
    .add-card h3 { margin: 0 0 1.5rem; font-size: 1.1rem; color: #2d5757; }
    .field { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1.25rem; }
    .field label { font-weight: 600; font-size: 0.88rem; color: #374151; }
    .hint { font-size: 0.78rem; color: #94a3b8; margin: 0; }
    .input { padding: 0.7rem 1rem; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 0.95rem; color: #0f172a; outline: none; width: 100%; box-sizing: border-box; font-family: inherit; transition: border 0.2s; }
    .input:focus { border-color: #2d5757; }
    .err { color: #dc2626; font-size: 0.8rem; }
    .type-row { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .type-btn { padding: 0.5rem 1rem; border-radius: 9px; background: #f1f5f9; color: #64748b; border: 2px solid transparent; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; }
    .type-btn.selected { background: #e8f4f4; color: #2d5757; border-color: #2d5757; }
    .options-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .option-row { display: flex; align-items: center; gap: 0.5rem; }
    .opt-letter { font-weight: 700; color: #2d5757; width: 22px; text-align: center; }
    .opt-input { flex: 1; }
    .btn-del-opt { background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.9rem; }
    .btn-add-opt { margin-top: 0.5rem; background: none; border: 1.5px dashed #cbd5e1; color: #64748b; padding: 0.5rem 1rem; border-radius: 9px; cursor: pointer; font-size: 0.85rem; transition: all 0.2s; }
    .btn-add-opt:hover { border-color: #2d5757; color: #2d5757; }
    .api-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 0.75rem; border-radius: 10px; font-size: 0.88rem; margin-bottom: 1rem; }
    .actions { display: flex; justify-content: flex-end; }
    .btn-submit { padding: 0.65rem 1.6rem; border-radius: 10px; background: linear-gradient(135deg,#2d5757,#1a3a3a); color: #fff; border: none; font-weight: 700; font-size: 0.9rem; cursor: pointer; }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
  `]
})
export class AssessmentExamQuestionsComponent implements OnInit {
  examId!: number;
  exam: AssessmentExam | null = null;
  questions: AssessmentQuestion[] = [];
  loading = true;
  qSubmitting = false;
  qError = '';
  qForm!: FormGroup;

  readonly questionTypes = AssessmentQuestionType;
  readonly questionTypeOptions = [
    { value: AssessmentQuestionType.MULTIPLE_CHOICE, label: '🔘 Choix multiple' },
    { value: AssessmentQuestionType.TRUE_FALSE, label: '✅ Vrai / Faux' },
    { value: AssessmentQuestionType.OPEN, label: '✏️ Question ouverte' },
  ];

  constructor(
    private route: ActivatedRoute,
    private svc: AssessmentExamService,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.examId = +this.route.snapshot.paramMap.get('id')!;
    this.initForm();
    this.loadAll();
  }

  private loadAll() {
    this.loading = true;
    this.svc.getExam(this.examId).subscribe(e => this.exam = e);
    this.svc.getQuestions(this.examId).subscribe({
      next: (qs) => {
        // Load answers for MCQ questions
        this.questions = qs;
        qs.forEach(q => {
          if (q.type !== AssessmentQuestionType.OPEN && q.id) {
            this.svc.getAnswers(q.id).subscribe(answers => q.answers = answers);
          }
        });
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  private initForm(type: AssessmentQuestionType = AssessmentQuestionType.MULTIPLE_CHOICE) {
    let defaultAnswers: FormGroup[];

    if (type === AssessmentQuestionType.TRUE_FALSE) {
      defaultAnswers = [
        this.fb.group({ content: ['Vrai', Validators.required], correct: [true] }),
        this.fb.group({ content: ['Faux', Validators.required], correct: [false] }),
      ];
    } else if (type !== AssessmentQuestionType.OPEN) {
      defaultAnswers = [
        this.fb.group({ content: ['', Validators.required], correct: [false] }),
        this.fb.group({ content: ['', Validators.required], correct: [true] }),
        this.fb.group({ content: ['', Validators.required], correct: [false] }),
        this.fb.group({ content: ['', Validators.required], correct: [false] }),
      ];
    } else {
      defaultAnswers = [];
    }
    this.qForm = this.fb.group({
      content: ['', Validators.required],
      type: [type],
      answers: this.fb.array(defaultAnswers)
    });
  }


  get answersArray(): FormArray {
    return this.qForm.get('answers') as FormArray;
  }

  selectType(type: AssessmentQuestionType) {
    const content = this.qForm.value.content;
    this.initForm(type);
    this.qForm.patchValue({ content, type });
  }

  private buildAnswer(correct: boolean) {
    return this.fb.group({ content: ['', Validators.required], correct: [correct] });
  }

  addAnswer() {
    this.answersArray.push(this.buildAnswer(false));
  }

  removeAnswer(i: number) {
    this.answersArray.removeAt(i);
  }

  setCorrect(idx: number) {
    this.answersArray.controls.forEach((ctrl, i) => ctrl.patchValue({ correct: i === idx }));
  }

  getLetter(i: number): string {
    return String.fromCharCode(65 + i);
  }

  typeLabel(t?: AssessmentQuestionType): string {
    if (t === AssessmentQuestionType.MULTIPLE_CHOICE) return 'Choix multiple';
    if (t === AssessmentQuestionType.TRUE_FALSE) return 'Vrai / Faux';
    if (t === AssessmentQuestionType.OPEN) return 'Question ouverte';
    return '';
  }

  addQuestion() {
    if (this.qForm.invalid) { this.qForm.markAllAsTouched(); return; }
    this.qSubmitting = true;
    this.qError = '';

    const v = this.qForm.value;
    const newQ: AssessmentQuestion = {
      content: v.content,
      type: v.type,
      exam: { id: this.examId }
    };

    this.svc.createQuestion(newQ).subscribe({
      next: (created) => {
        // Save answers for MCQ
        if (v.type !== AssessmentQuestionType.OPEN && v.answers?.length && created.id) {
          const answersSaved: AssessmentAnswer[] = [];
          let pending = v.answers.length;

          v.answers.forEach((a: { content: string; correct: boolean }) => {
            this.svc.createAnswer({ content: a.content, correct: a.correct, question: { id: created.id! } })
              .subscribe(savedA => {
                answersSaved.push(savedA);
                pending--;
                if (pending === 0) {
                  created.answers = answersSaved;
                  this.questions.push(created);
                  this.qSubmitting = false;
                  this.initForm(v.type);
                }
              });
          });
        } else {
          this.questions.push(created);
          this.qSubmitting = false;
          this.initForm();
        }
      },
      error: (e) => {
        this.qError = e?.error?.message ?? e?.message ?? 'Erreur serveur.';
        this.qSubmitting = false;
      }
    });
  }

  deleteQuestion(q: AssessmentQuestion) {
    if (!confirm(`Supprimer la question « ${q.content?.substring(0, 50)}… » ?`)) return;
    this.svc.deleteQuestion(q.id!).subscribe({
      next: () => this.questions = this.questions.filter(x => x.id !== q.id),
      error: () => alert('Erreur lors de la suppression.')
    });
  }
}
