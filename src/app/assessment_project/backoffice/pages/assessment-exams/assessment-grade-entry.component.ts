import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  AssessmentExamService, AssessmentExam, AssessmentAttempt, AssessmentUser
} from '../../services/assessment-exam.service';

@Component({
  selector: 'app-assessment-grade-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="breadcrumb">
        <a routerLink="../../../..">Examens</a> <span>/</span>
        <span>Notes — {{ exam?.title }}</span>
      </div>

      <!-- Exam info banner -->
      <div class="exam-banner" *ngIf="exam">
        <div class="banner-info">
          <h2 class="exam-title">{{ exam.title }}</h2>
          <div class="banner-meta">
            <span>⏱ {{ exam.duration }} min</span>
            <span>🎯 Seuil : {{ exam.passingScore }}/100 pour le certificat</span>
            <a [routerLink]="['../../../questions', exam.id]" class="banner-link">❓ Gérer les questions</a>
          </div>
        </div>
        <button class="btn-pdf" (click)="downloadPdf()" [disabled]="pdfLoading">
          {{ pdfLoading ? '⏳' : '📄' }} Télécharger le sujet PDF
        </button>
      </div>

      <!-- Stats row -->
      <div class="stats-row" *ngIf="attempts.length > 0">
        <div class="stat-card">
          <span class="stat-num">{{ attempts.length }}</span>
          <span class="stat-lbl">Élèves</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">{{ passCount }}</span>
          <span class="stat-lbl">Réussis ✅</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">{{ attempts.length - passCount }}</span>
          <span class="stat-lbl">Échoués ❌</span>
        </div>
        <div class="stat-card">
          <span class="stat-num">{{ avgScore }}%</span>
          <span class="stat-lbl">Moyenne</span>
        </div>
      </div>

      <!-- Attempts table -->
      <div class="table-card">
        <h3 class="table-title">📊 Liste des notes</h3>

        <div class="loading" *ngIf="loading">Chargement…</div>

        <div class="empty-table" *ngIf="!loading && attempts.length === 0">
          Aucune note saisie pour l'instant.
        </div>

        <table class="table" *ngIf="!loading && attempts.length > 0">
          <thead>
            <tr>
              <th>Élève</th>
              <th>Score</th>
              <th>Résultat</th>
              <th>Date</th>
              <th>Certificat</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let a of attempts">
              <td class="td-name">{{ a.studentName }}</td>
              <td>
                <div class="score-bar-wrap">
                  <div class="score-bar" [style.width.%]="a.score"
                    [class.score-pass]="a.passed" [class.score-fail]="!a.passed"></div>
                </div>
                <span class="score-text">{{ a.score }}/100</span>
              </td>
              <td>
                <span class="badge-pass" *ngIf="a.passed">✅ Réussi</span>
                <span class="badge-fail" *ngIf="!a.passed">❌ Échoué</span>
              </td>
              <td class="td-date">{{ formatDate(a.date) }}</td>
              <td>
                <button class="btn-cert" *ngIf="a.passed" (click)="downloadCert(a)" [disabled]="certLoading[a.id!]">
                  {{ certLoading[a.id!] ? '⏳' : '🏅' }} PDF
                </button>
                <span *ngIf="!a.passed" class="no-cert">—</span>
              </td>
              <td>
                <button class="btn-del" (click)="deleteAttempt(a)">🗑️</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Add grade form -->
      <div class="add-card">
        <h3>📝 Saisir une note</h3>
        <form [formGroup]="gForm" (ngSubmit)="submitGrade()">

          <!-- Student dropdown -->
          <div class="field" style="margin-bottom:1.25rem">
            <label>Étudiant *</label>
            <select class="input select-student" formControlName="userId" (change)="onStudentSelect($event)">
              <option value="">— Sélectionner un étudiant —</option>
              <option *ngFor="let s of students" [value]="s.id">
                {{ s.username }}{{ s.email ? ' (' + s.email + ')' : '' }}
              </option>
            </select>
            <span class="err" *ngIf="gForm.get('userId')!.touched && gForm.get('userId')!.invalid">Requis</span>
            <div class="student-loading" *ngIf="studentsLoading">Chargement des étudiants…</div>
          </div>

          <div class="field score-field">
            <label>Note obtenue (0–100) *</label>
            <div class="score-input-row">
              <input type="range" min="0" max="100" class="slider" formControlName="score"
                (input)="onSlider($event)" />
              <input type="number" min="0" max="100" class="input score-num"
                formControlName="score" />
            </div>
            <div class="score-hint">
              <span [class.pass-hint]="gForm.value.score >= (exam?.passingScore ?? 50)"
                [class.fail-hint]="gForm.value.score < (exam?.passingScore ?? 50)">
                {{ gForm.value.score >= (exam?.passingScore ?? 50) ? '✅ Réussi — un certificat PDF sera généré automatiquement' : '❌ Score insuffisant pour le certificat (seuil : ' + (exam?.passingScore ?? 50) + ')' }}
              </span>
            </div>
          </div>

          <div class="api-error" *ngIf="gError">{{ gError }}</div>

          <div class="actions">
            <button type="submit" class="btn-submit" [disabled]="gSubmitting">
              {{ gSubmitting ? 'Enregistrement…' : '✅ Enregistrer la note' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 900px; margin: 0 auto; padding: 2rem; }
    .breadcrumb { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 1.5rem; font-size: 0.85rem; color: #64748b; }
    .breadcrumb a { color: #2d5757; text-decoration: none; font-weight: 600; }
    .exam-banner { background: linear-gradient(135deg, #2d5757, #1a4a4a); color: #fff; border-radius: 16px; padding: 1.5rem 2rem; display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
    .exam-title { margin: 0 0 0.5rem; font-size: 1.3rem; font-weight: 800; }
    .banner-meta { display: flex; gap: 1rem; flex-wrap: wrap; font-size: 0.88rem; opacity: 0.9; align-items: center; }
    .banner-link { color: #a7f3d0; text-decoration: none; font-weight: 600; }
    .btn-pdf { padding: 0.6rem 1.3rem; background: rgba(255,255,255,0.15); color: #fff; border: 2px solid rgba(255,255,255,0.3); border-radius: 10px; font-weight: 700; font-size: 0.88rem; cursor: pointer; transition: background 0.2s; white-space: nowrap; }
    .btn-pdf:hover { background: rgba(255,255,255,0.25); }
    .btn-pdf:disabled { opacity: 0.6; cursor: wait; }
    .stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: #fff; border-radius: 14px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); padding: 1.25rem; text-align: center; border: 1px solid #f1f5f9; }
    .stat-num { display: block; font-size: 2rem; font-weight: 800; color: #2d5757; }
    .stat-lbl { font-size: 0.82rem; color: #64748b; }
    .table-card { background: #fff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.07); padding: 1.5rem; margin-bottom: 2rem; border: 1px solid #f1f5f9; }
    .table-title { margin: 0 0 1.25rem; font-size: 1rem; font-weight: 700; color: #0f172a; }
    .loading, .empty-table { text-align: center; color: #94a3b8; padding: 2rem; }
    .table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    .table th { text-align: left; padding: 0.6rem 0.75rem; font-size: 0.78rem; font-weight: 700; color: #64748b; text-transform: uppercase; border-bottom: 2px solid #f1f5f9; }
    .table td { padding: 0.85rem 0.75rem; border-bottom: 1px solid #f8fafc; vertical-align: middle; }
    .td-name { font-weight: 600; color: #1e3a3a; }
    .td-date { font-size: 0.82rem; color: #94a3b8; }
    .score-bar-wrap { width: 80px; height: 6px; background: #f1f5f9; border-radius: 3px; overflow: hidden; margin-bottom: 4px; }
    .score-bar { height: 100%; border-radius: 3px; transition: width 0.3s; }
    .score-pass { background: #16a34a; }
    .score-fail { background: #ef4444; }
    .score-text { font-weight: 700; font-size: 0.88rem; }
    .badge-pass { background: #f0fdf4; color: #15803d; padding: 0.25rem 0.65rem; border-radius: 50px; font-size: 0.8rem; font-weight: 700; white-space: nowrap; }
    .badge-fail { background: #fef2f2; color: #dc2626; padding: 0.25rem 0.65rem; border-radius: 50px; font-size: 0.8rem; font-weight: 700; white-space: nowrap; }
    .btn-cert { background: linear-gradient(135deg,#f59e0b,#d97706); color: #fff; border: none; padding: 0.4rem 0.8rem; border-radius: 8px; font-weight: 700; font-size: 0.82rem; cursor: pointer; white-space: nowrap; }
    .btn-cert:disabled { opacity: 0.6; cursor: wait; }
    .no-cert { color: #cbd5e1; }
    .btn-del { background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.9rem; }
    .add-card { background: #fff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.07); padding: 2rem; border: 2px dashed #cbd5e1; }
    .add-card h3 { margin: 0 0 1.5rem; font-size: 1.1rem; color: #2d5757; }
    .field { display: flex; flex-direction: column; gap: 0.4rem; flex: 1; }
    .field label { font-weight: 600; font-size: 0.88rem; color: #374151; }
    .input { padding: 0.7rem 1rem; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 0.95rem; color: #0f172a; outline: none; width: 100%; box-sizing: border-box; font-family: inherit; transition: border 0.2s; }
    .input:focus { border-color: #2d5757; }
    .select-student { appearance: auto; cursor: pointer; background: #fff; }
    .student-loading { font-size: 0.8rem; color: #94a3b8; }
    .err { color: #dc2626; font-size: 0.8rem; }
    .score-field { margin-bottom: 1.5rem; }
    .score-input-row { display: flex; gap: 1rem; align-items: center; }
    .slider { flex: 1; accent-color: #2d5757; cursor: pointer; }
    .score-num { width: 80px; flex: none; text-align: center; }
    .score-hint { margin-top: 0.5rem; font-size: 0.85rem; font-weight: 600; }
    .pass-hint { color: #15803d; }
    .fail-hint { color: #dc2626; }
    .api-error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 0.75rem; border-radius: 10px; font-size: 0.88rem; margin-bottom: 1rem; }
    .actions { display: flex; justify-content: flex-end; }
    .btn-submit { padding: 0.65rem 1.6rem; border-radius: 10px; background: linear-gradient(135deg,#2d5757,#1a3a3a); color: #fff; border: none; font-weight: 700; font-size: 0.9rem; cursor: pointer; }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
    @media (max-width: 600px) { .stats-row { grid-template-columns: repeat(2,1fr); } }
  `]
})
export class AssessmentGradeEntryComponent implements OnInit {
  examId!: number;
  exam: AssessmentExam | null = null;
  attempts: AssessmentAttempt[] = [];
  students: AssessmentUser[] = [];
  loading = true;
  studentsLoading = true;
  gSubmitting = false;
  gError = '';
  pdfLoading = false;
  certLoading: Record<number, boolean> = {};
  gForm!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private svc: AssessmentExamService,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.examId = +this.route.snapshot.paramMap.get('id')!;
    this.gForm = this.fb.group({
      userId: ['', Validators.required],
      studentName: [''],
      score: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    });

    this.svc.getExam(this.examId).subscribe(e => this.exam = e);
    this.loadAttempts();
    this.loadStudents();
  }

  private loadAttempts() {
    this.loading = true;
    this.svc.getAttempts(this.examId).subscribe({
      next: (a) => { this.attempts = a; this.loading = false; },
      error: () => this.loading = false
    });
  }

  private loadStudents() {
    this.studentsLoading = true;
    this.svc.getStudents().subscribe({
      next: (s) => { this.students = s; this.studentsLoading = false; },
      error: () => this.studentsLoading = false
    });
  }

  onStudentSelect(event: Event) {
    const id = +(event.target as HTMLSelectElement).value;
    const student = this.students.find(s => s.id === id);
    if (student) {
      this.gForm.patchValue({ studentName: student.username, userId: id });
    }
  }

  get passCount() { return this.attempts.filter(a => a.passed).length; }
  get avgScore() {
    if (this.attempts.length === 0) return 0;
    return Math.round(this.attempts.reduce((s, a) => s + a.score, 0) / this.attempts.length);
  }

  onSlider(e: Event) {
    const v = +(e.target as HTMLInputElement).value;
    this.gForm.patchValue({ score: v });
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  submitGrade() {
    if (this.gForm.invalid) { this.gForm.markAllAsTouched(); return; }
    this.gSubmitting = true;
    this.gError = '';

    const v = this.gForm.value;
    const attempt: AssessmentAttempt = {
      studentName: v.studentName || `Étudiant #${v.userId}`,
      userId: +v.userId,
      score: +v.score,
      exam: { id: this.examId }
    };

    this.svc.createAttempt(attempt).subscribe({
      next: (a) => {
        this.attempts.unshift(a);
        this.gForm.reset({ score: 0, userId: '' });
        this.gSubmitting = false;
        if (a.passed) {
          alert(`✅ ${a.studentName} a réussi ! (${a.score}/100)\nUn certificat a été automatiquement généré.`);
        }
      },
      error: (e) => {
        this.gError = e?.error?.message ?? e?.message ?? 'Erreur serveur.';
        this.gSubmitting = false;
      }
    });
  }

  downloadPdf() {
    if (!this.exam?.id) return;
    this.pdfLoading = true;
    this.svc.downloadExamPdf(this.exam.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `examen_${this.exam!.title?.replace(/\s+/g, '_')}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.pdfLoading = false;
      },
      error: () => { this.pdfLoading = false; alert('Erreur PDF.'); }
    });
  }

  downloadCert(attempt: AssessmentAttempt) {
    if (!attempt.id) return;
    this.certLoading[attempt.id] = true;
    this.svc.downloadCertificate(attempt.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificat_${attempt.studentName?.replace(/\s+/g, '_')}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.certLoading[attempt.id!] = false;
      },
      error: () => { this.certLoading[attempt.id!] = false; alert('Erreur certificat.'); }
    });
  }

  deleteAttempt(a: AssessmentAttempt) {
    if (!confirm(`Supprimer la note de « ${a.studentName} » ?`)) return;
    this.svc.deleteAttempt(a.id!).subscribe({
      next: () => this.attempts = this.attempts.filter(x => x.id !== a.id),
      error: () => alert('Erreur lors de la suppression.')
    });
  }
}
