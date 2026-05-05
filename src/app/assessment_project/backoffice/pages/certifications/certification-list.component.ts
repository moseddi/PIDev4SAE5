import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Certification, Level, CertificationExam, Question, Answer } from '../../models/certification.models';
import { CertificationService } from '../../services/certification.service';
import { ExamService } from '../../services/exam.service';
import { QuestionService } from '../../services/question.service';
import { AnswerService } from '../../services/answer.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-certification-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h2 class="page-title">🎓 Gestion des Certifications</h2>
          <p class="page-sub">Vue complète : Certifications → Examens → Questions → Réponses</p>
        </div>
        <a routerLink="nouveau" class="btn-add">+ Ajouter Certification</a>
      </div>

      <div class="loading" *ngIf="loading">
        <div class="spinner"></div>
        <span>Chargement de la structure complète…</span>
      </div>

      <div class="empty-state" *ngIf="!loading && certifications.length === 0">
        <span class="empty-icon">📂</span>
        <p>Aucune donnée trouvée.</p>
        <a routerLink="nouveau" class="btn-add">Créer ma première certification</a>
      </div>

      <div class="tree-container" *ngIf="!loading && certifications.length > 0">
        <div class="cert-card" *ngFor="let cert of certifications">
          <div class="cert-header" (click)="toggleCert(cert.id!)">
            <div class="cert-info">
              <span class="expand-icon">{{ expandedCerts[cert.id!] ? '▼' : '▶' }}</span>
              <span class="cert-level" [class]="'level-' + cert.level">{{ cert.level }}</span>
              <h3 class="cert-title">{{ cert.title }}</h3>
              <span class="cert-badge">{{ getExamsForCert(cert.id!).length }} Examen(s)</span>
            </div>
            <div class="cert-actions">
              <a [routerLink]="['modifier', cert.id]" class="action-btn edit" (click)="$event.stopPropagation()">✏️</a>
              <button class="action-btn delete" (click)="confirmDelete(cert); $event.stopPropagation()">🗑️</button>
            </div>
          </div>

          <!-- Exams Section -->
          <div class="exams-list" *ngIf="expandedCerts[cert.id!]">
            <div class="list-header">
              <h4>Examens rattachés</h4>
              <a [routerLink]="['/backoffice/exams/nouveau']" [queryParams]="{certificationId: cert.id}" class="btn-add-sm">+ Ajouter Examen</a>
            </div>

            <div class="exam-item" *ngFor="let exam of getExamsForCert(cert.id!)">
              <div class="exam-header" (click)="toggleExam(exam.id!)">
                 <span class="expand-icon-sm">{{ expandedExams[exam.id!] ? '▼' : '▶' }}</span>
                 <span class="exam-icon">📝</span>
                 <span class="exam-title">{{ exam.title }}</span>
                 <span class="stats-badge">{{ getQuestionsForExam(exam.id!).length }} Q</span>
                 <div class="item-actions">
                    <a [routerLink]="['/backoffice/exams/modifier', exam.id]" class="mini-btn edit" (click)="$event.stopPropagation()">✏️</a>
                    <button class="mini-btn delete" (click)="confirmDeleteEntity('exam', exam); $event.stopPropagation()">🗑️</button>
                 </div>
              </div>

              <!-- Questions Section -->
              <div class="questions-list" *ngIf="expandedExams[exam.id!]">
                <div class="list-header">
                  <h5>Questions</h5>
                  <a [routerLink]="['/backoffice/questions/nouveau']" [queryParams]="{examId: exam.id}" class="btn-add-xs">+ Ajouter Question</a>
                </div>

                <div class="q-item" *ngFor="let q of getQuestionsForExam(exam.id!)">
                  <div class="q-header" (click)="toggleQuestion(q.id!)">
                    <span class="expand-icon-xs">{{ expandedQuestions[q.id!] ? '▼' : '▶' }}</span>
                    <span class="q-num">Q:</span>
                    <span class="q-text">{{ q.content }}</span>
                    <div class="item-actions">
                       <a [routerLink]="['/backoffice/questions/modifier', q.id]" class="mini-btn edit" (click)="$event.stopPropagation()">✏️</a>
                       <button class="mini-btn delete" (click)="confirmDeleteEntity('question', q); $event.stopPropagation()">🗑️</button>
                    </div>
                  </div>

                  <!-- Answers Section -->
                  <div class="answers-box" *ngIf="expandedQuestions[q.id!]">
                    <div class="list-header">
                      <h6>Réponses</h6>
                      <a [routerLink]="['/backoffice/answers/nouveau']" [queryParams]="{questionId: q.id}" class="btn-add-xs">+ Ajouter Réponse</a>
                    </div>

                    <div class="ans-row" *ngFor="let ans of getAnswersForQuestion(q.id!)" [class.is-correct]="ans.correct">
                       <span class="ans-bullet">{{ ans.correct ? '✅' : '⚪' }}</span>
                       <span class="ans-text">{{ ans.content }}</span>
                       <div class="item-actions-xs">
                          <a [routerLink]="['/backoffice/answers/modifier', ans.id]" class="micro-btn edit">✏️</a>
                          <button class="micro-btn delete" (click)="confirmDeleteEntity('answer', ans)">🗑️</button>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="empty-notif" *ngIf="getExamsForCert(cert.id!).length === 0">
              Aucun examen rattaché.
            </div>
          </div>
        </div>
      </div>

      <!-- General Delete Modal -->
      <div class="modal-overlay" *ngIf="toDeleteEntity" (click)="toDeleteEntity = null">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>Supprimer {{ toDeleteEntity.label }} ?</h3>
          <p>Confirmation de la suppression de : <strong>{{ toDeleteEntity.title }}</strong></p>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="toDeleteEntity = null">Annuler</button>
            <button class="btn-confirm-delete" (click)="deleteEntity()">Confirmer</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tree-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .cert-card {
      background: #fff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(45,87,87,0.08);
      border: 1px solid rgba(45,87,87,0.1);
      transition: transform 0.2s;
    }
    .cert-header {
      padding: 1.25rem 1.5rem;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      border-bottom: 2px solid #F7EDE2;
    }
    .cert-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .expand-icon {
      color: #2D5757;
      font-size: 0.8rem;
      opacity: 0.5;
    }
    .cert-level {
      padding: 0.3rem 0.8rem;
      border-radius: 10px;
      font-size: 0.8rem;
      font-weight: 800;
    }
    .level-A1 { background: #E0F2FE; color: #0369A1; }
    .level-A2 { background: #DCFCE7; color: #15803D; }
    .level-B1 { background: #FEF9C3; color: #A16207; }
    .level-B2 { background: #FFEDD5; color: #C2410C; }
    .level-C1 { background: #F3E8FF; color: #7E22CE; }
    .level-C2 { background: #FCE7F3; color: #BE185D; }

    .cert-title {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: #2D5757;
    }
    .cert-badge {
      background: #F7EDE2;
      color: #2D5757;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      border: 1px solid rgba(45,87,87,0.15);
    }
    .action-btn {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
      margin-left: 0.5rem;
    }
    .action-btn.edit { background: rgba(45,87,87,0.1); color: #2D5757; }
    .action-btn.delete { background: rgba(220,38,38,0.1); color: #DC2626; }
    .action-btn:hover { transform: translateY(-2px); }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      padding: 0 0.5rem;
    }
    .list-header h4, .list-header h5, .list-header h6 {
      margin: 0;
      color: #2D5757;
      opacity: 0.8;
      font-weight: 700;
    }
    .list-header h4 { font-size: 0.9rem; }
    .list-header h5 { font-size: 0.85rem; }
    .list-header h6 { font-size: 0.8rem; }

    .btn-add-sm, .btn-add-xs {
      text-decoration: none;
      font-weight: 700;
      border-radius: 6px;
      transition: all 0.2s;
    }
    .btn-add-sm {
      padding: 0.3rem 0.6rem;
      background: #2D5757;
      color: #fff;
      font-size: 0.75rem;
    }
    .btn-add-xs {
      padding: 0.2rem 0.5rem;
      background: rgba(45,87,87,0.1);
      color: #2D5757;
      border: 1px solid rgba(45,87,87,0.2);
      font-size: 0.7rem;
    }
    .btn-add-sm:hover, .btn-add-xs:hover { transform: scale(1.05); }

    .item-actions, .item-actions-xs {
      display: flex;
      gap: 0.35rem;
      margin-left: auto;
    }
    .mini-btn, .micro-btn {
      width: 26px;
      height: 26px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      cursor: pointer;
      text-decoration: none;
      font-size: 0.7rem;
    }
    .micro-btn { width: 22px; height: 22px; font-size: 0.6rem; }
    
    .mini-btn.edit, .micro-btn.edit { background: rgba(45,87,87,0.05); color: #2D5757; }
    .mini-btn.delete, .micro-btn.delete { background: rgba(220,38,38,0.05); color: #DC2626; }

    /* Exams */
    .exams-list {
      padding: 1rem 1.5rem 1.5rem 3rem;
      background: rgba(247, 237, 226, 0.2);
    }
    .exam-item {
      margin-bottom: 0.75rem;
      background: #fff;
      border-radius: 12px;
      border: 1px solid rgba(45,87,87,0.1);
      overflow: hidden;
    }
    .exam-header {
      padding: 0.85rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
    }
    .expand-icon-sm { font-size: 0.7rem; opacity: 0.4; }
    .exam-icon { font-size: 1rem; }
    .exam-title {
      font-weight: 600;
      color: #2D5757;
      font-size: 0.95rem;
      flex: 1;
    }
    .stats-badge {
      font-size: 0.7rem;
      font-weight: 800;
      padding: 0.15rem 0.5rem;
      background: #2D5757;
      color: #fff;
      border-radius: 6px;
    }

    /* Questions */
    .questions-list {
      padding: 0.5rem 1rem 1rem 2.5rem;
      background: rgba(45,87,87,0.02);
      border-top: 1px solid rgba(45,87,87,0.05);
    }
    .q-item {
      margin-bottom: 0.5rem;
    }
    .q-header {
      padding: 0.6rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-size: 0.9rem;
      border-radius: 8px;
    }
    .q-header:hover { background: rgba(45,87,87,0.05); }
    .expand-icon-xs { font-size: 0.6rem; opacity: 0.3; }
    .q-num { font-weight: 800; color: #2D5757; opacity: 0.5; }
    .q-text { color: #2D5757; font-weight: 500; }

    /* Answers */
    .answers-box {
      margin: 0.5rem 0 0.5rem 2rem;
      padding: 0.75rem;
      background: #fff;
      border-radius: 10px;
      border: 1px solid rgba(45,87,87,0.1);
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .ans-row {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.85rem;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
    }
    .ans-row.is-correct {
      background: rgba(21, 128, 61, 0.05);
      color: #15803D;
      font-weight: 600;
    }
    .ans-bullet { font-size: 0.9rem; }
    .empty-notif {
      padding: 1rem;
      text-align: center;
      font-style: italic;
      color: #2D5757;
      opacity: 0.6;
      font-size: 0.9rem;
    }

    /* Modal */
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
      transition: all 0.2s ease;
    }
    .btn-cancel:hover {
      background: rgba(45, 87, 87, 0.2);
    }
    .btn-confirm-delete { 
      padding:0.6rem 1.25rem; 
      border-radius:10px; 
      background:#dc2626; 
      color:#fff; 
      border:none; 
      font-weight:600; 
      cursor:pointer; 
      transition: all 0.2s ease;
    }
    .btn-confirm-delete:hover {
      background: #b91c1c;
      transform: translateY(-1px);
    }
  `]
})
export class CertificationListComponent implements OnInit {
  certifications: Certification[] = [];
  exams: CertificationExam[] = [];
  questions: Question[] = [];
  answers: Answer[] = [];

  loading = true;
  toDeleteEntity: { type: string, id: number, title: string, label: string } | null = null;

  // States for expand/collapse
  expandedCerts: { [key: number]: boolean } = {};
  expandedExams: { [key: number]: boolean } = {};
  expandedQuestions: { [key: number]: boolean } = {};

  constructor(
    private certSvc: CertificationService,
    private examSvc: ExamService,
    private qSvc: QuestionService,
    private aSvc: AnswerService
  ) { }

  ngOnInit(): void {
    this.loadFullTree();
  }

  loadFullTree(): void {
    this.loading = true;
    forkJoin({
      certs: this.certSvc.getAll(),
      exams: this.examSvc.getAll(),
      questions: this.qSvc.getAll(),
      answers: this.aSvc.getAll()
    }).subscribe({
      next: (res) => {
        this.certifications = res.certs;
        this.exams = res.exams;
        this.questions = res.questions;
        this.answers = res.answers;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        console.error("Erreur lors du chargement de la structure.");
      }
    });
  }

  // Toggle methods
  toggleCert(id: number) { this.expandedCerts[id] = !this.expandedCerts[id]; }
  toggleExam(id: number) { this.expandedExams[id] = !this.expandedExams[id]; }
  toggleQuestion(id: number) { this.expandedQuestions[id] = !this.expandedQuestions[id]; }

  // Filter helpers
  getExamsForCert(certId: number): CertificationExam[] {
    return this.exams.filter(e => {
      const cId = e.certificationId ?? (e as any).certification_id ?? e.certification?.id;
      return Number(cId) === Number(certId);
    });
  }

  getQuestionsForExam(examId: number): Question[] {
    return this.questions.filter(q => {
      const eId = q.examId ?? q.exam_id ?? q.exam?.id;
      return Number(eId) === Number(examId);
    });
  }

  getAnswersForQuestion(qId: number): Answer[] {
    return this.answers.filter(a => {
      const q_id = a.questionId ?? (a as any).question_id ?? a.question?.id;
      return Number(q_id) === Number(qId);
    });
  }

  confirmDeleteEntity(type: string, entity: any): void {
    this.toDeleteEntity = {
      type,
      id: entity.id,
      title: entity.title || entity.content || `#${entity.id}`,
      label: type === 'cert' ? 'la Certification' :
        type === 'exam' ? 'l\'Examen' :
          type === 'question' ? 'la Question' : 'la Réponse'
    };
  }

  deleteEntity(): void {
    if (!this.toDeleteEntity) return;

    const { type, id } = this.toDeleteEntity;
    let obs$;

    if (type === 'cert') obs$ = this.certSvc.delete(id);
    else if (type === 'exam') obs$ = this.examSvc.delete(id);
    else if (type === 'question') obs$ = this.qSvc.delete(id);
    else if (type === 'answer') obs$ = this.aSvc.delete(id);
    else return;

    obs$.subscribe({
      next: () => {
        this.toDeleteEntity = null;
        this.loadFullTree();
      },
      error: () => this.toDeleteEntity = null
    });
  }

  confirmDelete(cert: Certification): void {
    this.confirmDeleteEntity('cert', cert);
  }

  deleteCert(): void {
    this.deleteEntity();
  }
}
