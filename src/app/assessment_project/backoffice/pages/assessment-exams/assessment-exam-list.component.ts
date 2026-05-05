import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AssessmentExamService, AssessmentExam, AssessmentExamType } from '../../services/assessment-exam.service';

@Component({
    selector: 'app-assessment-exam-list',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">📝 Examens &amp; Évaluations</h1>
          <p class="page-sub">Gérez les examens papier, générez les sujets PDF et saisissez les notes</p>
        </div>
        <a routerLink="nouveau" class="btn-primary">+ Nouvel examen</a>
      </div>

      <!-- Loading -->
      <div class="loading" *ngIf="loading">Chargement…</div>

      <!-- Error -->
      <div class="error-box" *ngIf="error">{{ error }}</div>

      <!-- Empty -->
      <div class="empty" *ngIf="!loading && !error && exams.length === 0">
        <div class="empty-icon">📋</div>
        <p>Aucun examen créé. <a routerLink="nouveau">Créer le premier examen</a></p>
      </div>

      <!-- Cards grid -->
      <div class="grid" *ngIf="!loading && exams.length > 0">
        <div class="card" *ngFor="let exam of exams">

          <div class="card-header">
            <div>
              <span class="type-badge" [class]="'type-' + (exam.examType || 'EXAM').toLowerCase()">
                {{ typeLabel(exam.examType) }}
              </span>
              <h3 class="card-title">{{ exam.title }}</h3>
            </div>
          </div>

          <div class="card-meta">
            <span>⏱ {{ exam.duration }} min</span>
            <span>🎯 Note min : {{ exam.passingScore }}/100</span>
            <span>❓ {{ exam.questions?.length || 0 }} question(s)</span>
          </div>

          <div class="card-actions">
            <!-- PDF Exam -->
            <button class="btn-action pdf" (click)="downloadPdf(exam)" [disabled]="pdfLoading[exam.id!]">
              <span *ngIf="!pdfLoading[exam.id!]">📄 Sujet PDF</span>
              <span *ngIf="pdfLoading[exam.id!]">⏳ Génération…</span>
            </button>

            <!-- Questions -->
            <a [routerLink]="['questions', exam.id]" class="btn-action questions">
              ❓ Questions
            </a>

            <!-- Grades -->
            <a [routerLink]="['notes', exam.id]" class="btn-action grades">
              📊 Notes
            </a>

            <!-- Edit -->
            <a [routerLink]="['modifier', exam.id]" class="btn-action edit">✏️</a>

            <!-- Delete -->
            <button class="btn-action delete" (click)="deleteExam(exam)">🗑️</button>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .page { max-width: 1100px; margin: 0 auto; padding: 2rem; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
    .page-title { margin: 0; font-size: 1.75rem; font-weight: 800; color: #0f172a; }
    .page-sub { margin: 0.25rem 0 0; color: #64748b; font-size: 0.9rem; }
    .btn-primary { padding: 0.65rem 1.4rem; background: linear-gradient(135deg,#2d5757,#1a3a3a); color: #fff; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 0.9rem; white-space: nowrap; }
    .loading, .empty { text-align: center; padding: 3rem; color: #64748b; }
    .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
    .empty a { color: #2d5757; font-weight: 600; }
    .error-box { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 1rem; border-radius: 10px; margin-bottom: 1rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.5rem; }
    .card { background: #fff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.07); border: 1px solid #f1f5f9; overflow: hidden; }
    .card-header { padding: 1.25rem 1.5rem 0.5rem; }
    .type-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 50px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
    .type-exam   { background: #dbeafe; color: #1d4ed8; }
    .type-test   { background: #fef9c3; color: #a16207; }
    .type-quiz   { background: #f0fdf4; color: #15803d; }
    .card-title { margin: 0; font-size: 1.1rem; font-weight: 700; color: #0f172a; }
    .card-meta { display: flex; gap: 1rem; flex-wrap: wrap; padding: 0.5rem 1.5rem 0.75rem; font-size: 0.82rem; color: #64748b; }
    .card-actions { display: flex; gap: 0.5rem; padding: 0.75rem 1.5rem 1.25rem; flex-wrap: wrap; }
    .btn-action { padding: 0.5rem 0.85rem; border-radius: 9px; border: none; font-size: 0.82rem; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 0.25rem; transition: opacity 0.2s; }
    .btn-action:disabled { opacity: 0.6; cursor: wait; }
    .btn-action.pdf       { background: #eff6ff; color: #1d4ed8; }
    .btn-action.questions { background: #f0fdf4; color: #15803d; }
    .btn-action.grades    { background: #fdf4ff; color: #7c3aed; }
    .btn-action.edit      { background: #fefce8; color: #a16207; }
    .btn-action.delete    { background: #fef2f2; color: #dc2626; margin-left: auto; }
    .btn-action:hover     { opacity: 0.8; }
  `]
})
export class AssessmentExamListComponent implements OnInit {
    exams: AssessmentExam[] = [];
    loading = true;
    error = '';
    pdfLoading: Record<number, boolean> = {};

    constructor(private svc: AssessmentExamService) { }

    ngOnInit() {
        this.svc.getExams().subscribe({
            next: (d) => { this.exams = d; this.loading = false; },
            error: (e) => { this.error = 'Impossible de joindre assessment-service (port 8088). ' + (e?.message ?? ''); this.loading = false; }
        });
    }

    typeLabel(t?: AssessmentExamType): string {
        if (t === AssessmentExamType.EXAM) return '📋 Examen';
        if (t === AssessmentExamType.TEST) return '🧪 Test';
        if (t === AssessmentExamType.QUIZ) return '⚡ Quiz';
        return 'Examen';
    }

    downloadPdf(exam: AssessmentExam) {
        if (!exam.id) return;
        this.pdfLoading[exam.id] = true;
        this.svc.downloadExamPdf(exam.id).subscribe({
            next: (blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `examen_${exam.title?.replace(/\s+/g, '_') ?? 'exam'}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
                this.pdfLoading[exam.id!] = false;
            },
            error: () => { this.pdfLoading[exam.id!] = false; alert('Erreur lors de la génération du PDF.'); }
        });
    }

    deleteExam(exam: AssessmentExam) {
        if (!confirm(`Supprimer l'examen « ${exam.title} » ?`)) return;
        this.svc.deleteExam(exam.id!).subscribe({
            next: () => this.exams = this.exams.filter(e => e.id !== exam.id),
            error: () => alert('Erreur lors de la suppression.')
        });
    }
}
