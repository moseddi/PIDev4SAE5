import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Certification,
  CertificationExam,
  Question,
  QuestionType,
  Answer,
} from '../../../backoffice/models/certification.models';
import { interval, Subscription, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { CertificationService } from '../../../backoffice/services/certification.service';
import { ExamService } from '../../../backoffice/services/exam.service';
import { QuestionService } from '../../../backoffice/services/question.service';
import { AnswerService } from '../../../backoffice/services/answer.service';
import { ResultService } from '../../../backoffice/services/result.service';
import { CertificateService } from '../../../backoffice/services/certificate.service';
import { AuthService } from '../../../shared/services/auth.service';

interface ExamQuestionDisplay {
  id: number;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  type: QuestionType;
}

interface ExamResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  level: string;
}

@Component({
  selector: 'app-passer-examen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="exam-page">
      <div class="loading-state" *ngIf="loading">
        <div class="loading-spinner">🔄</div>
        <h2>Chargement de l'examen...</h2>
      </div>

      <div class="no-questions-state" *ngIf="!loading && !submitted && questions.length === 0">
        <div class="warning-icon">⚠️</div>
        <h2>Aucun contenu disponible</h2>
        <p>Cette certification n'a pas encore d'examen avec des questions et réponses.</p>
        <p class="hint">Ajoutez un examen, des questions et des réponses dans le backoffice (Admin).</p>
        <button class="nav-btn primary" (click)="goBack()">Retour aux certifications</button>
      </div>

      <div class="exam-container" *ngIf="!loading && !submitted && questions.length > 0">
        <div class="exam-header">
          <div class="exam-info">
            <h1 class="exam-name">{{ currentExam?.title || certification?.title }}</h1>
            <p class="cert-name">Certification : {{ certification?.title }}</p>
            <p class="exam-description">{{ certification?.description }}</p>
          </div>
          <div class="exam-timer">
            <span class="time-label">Temps restant</span>
            <span class="time-value">{{ formatTime(timeRemaining) }}</span>
          </div>
        </div>

        <div class="progress-section">
          <span>Question {{ currentQuestionIndex + 1 }} / {{ questions.length }}</span>
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="getProgressPercentage()"></div>
          </div>
        </div>

        <div class="question-card">
          <div class="question-header">
            <span class="question-number">Question {{ currentQuestionIndex + 1 }}</span>
            <span class="question-type">{{ getQuestionTypeLabel() }}</span>
          </div>
          <h3 class="question-text">{{ questions[currentQuestionIndex].text }}</h3>
          <div class="answers-section">
            <div
              *ngFor="let option of questions[currentQuestionIndex]?.options; let i = index"
              class="answer-option"
              [class.selected]="selectedAnswer === i"
              (click)="selectAnswer(i)"
            >
              <span class="answer-letter">{{ getLetter(i) }}</span>
              <span class="answer-text">{{ option }}</span>
            </div>
          </div>
        </div>

        <div class="navigation-buttons">
          <button
            class="nav-btn secondary"
            (click)="previousQuestion()"
            [disabled]="currentQuestionIndex === 0"
          >
            ← Précédent
          </button>
          <button
            class="nav-btn primary"
            (click)="nextQuestion()"
            [disabled]="currentQuestionIndex === questions.length - 1"
          >
            Suivant →
          </button>
          <button
            class="nav-btn submit"
            (click)="submitExam()"
            *ngIf="currentQuestionIndex === questions.length - 1"
          >
            Soumettre l'examen
          </button>
        </div>
      </div>

      <div class="results-container" *ngIf="submitted && result">
        <div class="results-card" [class.passed-card]="result.passed" [class.failed-card]="!result.passed">
          <div class="result-icon">{{ result.passed ? '🏆' : '📋' }}</div>
          <h2>{{ result.passed ? 'Félicitations !' : 'Examen non réussi' }}</h2>
          <div class="score-display">
            <span class="score-value" [class.passed-score]="result.passed" [class.failed-score]="!result.passed">
              {{ result.percentage }}%
            </span>
          </div>
          <p class="score-detail">{{ result.score }} / {{ result.totalQuestions }} bonnes réponses</p>
          <p class="score-required">Score requis : {{ certification?.passingScore || 70 }}%</p>
          <div class="certificate-badge" *ngIf="result.passed">
            🎓 Certificat {{ certification?.title }} — niveau {{ result.level }} obtenu !
          </div>
          <div class="results-actions">
            <button class="nav-btn primary" (click)="goBack()">Retour aux certifications</button>
            <button class="nav-btn secondary" (click)="goToMyResults()" *ngIf="result.passed">
              Voir mes certificats →
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .exam-page {
        min-height: 100vh;
        background: linear-gradient(135deg, #f7ede2 0%, rgba(45, 87, 87, 0.05) 100%);
        padding: 2rem;
      }
      .loading-state,
      .no-questions-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem;
        text-align: center;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 25px;
        margin: 4rem auto;
        max-width: 600px;
      }
      .loading-spinner {
        font-size: 4rem;
        margin-bottom: 2rem;
        animation: spin 2s linear infinite;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      .hint {
        margin-top: 1rem;
        font-size: 0.95rem;
        color: #2d5757;
        opacity: 0.85;
      }
      .exam-container {
        max-width: 900px;
        margin: 0 auto;
      }
      .exam-header {
        background: #fff;
        border-radius: 25px;
        padding: 2rem;
        margin-bottom: 2rem;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        box-shadow: 0 10px 30px rgba(45, 87, 87, 0.1);
      }
      .exam-name {
        font-size: 1.75rem;
        color: #2d5757;
        margin: 0 0 0.5rem 0;
      }
      .cert-name {
        font-size: 0.95rem;
        color: #2d5757;
        opacity: 0.8;
        margin: 0 0 0.25rem 0;
      }
      .exam-description {
        font-size: 0.9rem;
        color: #2d5757;
        opacity: 0.7;
        margin: 0;
      }
      .exam-timer {
        background: #2d5757;
        color: #fff;
        padding: 1rem 1.5rem;
        border-radius: 15px;
        text-align: center;
      }
      .time-label { display: block; font-size: 0.8rem; opacity: 0.9; }
      .time-value { font-size: 1.5rem; font-weight: 800; }
      .progress-section { margin-bottom: 2rem; }
      .progress-bar { height: 10px; background: rgba(0,0,0,0.1); border-radius: 5px; overflow: hidden; margin-top: 0.5rem; }
      .progress-fill { height: 100%; background: #2d5757; transition: width 0.3s; }
      .question-card {
        background: #fff;
        padding: 2.5rem;
        border-radius: 25px;
        margin-bottom: 2rem;
        box-shadow: 0 10px 30px rgba(45, 87, 87, 0.1);
      }
      .question-header { display: flex; justify-content: space-between; margin-bottom: 1.5rem; }
      .question-number { font-weight: 800; color: #2d5757; }
      .question-type { font-weight: 600; opacity: 0.7; font-size: 0.9rem; }
      .question-text { font-size: 1.25rem; color: #1a3a3a; margin: 0 0 2rem 0; line-height: 1.5; }
      .answers-section { display: grid; gap: 1rem; }
      .answer-option {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.25rem;
        background: rgba(45, 87, 87, 0.05);
        border: 2px solid transparent;
        border-radius: 15px;
        cursor: pointer;
        transition: 0.2s;
      }
      .answer-option.selected {
        border-color: #2d5757;
        background: rgba(45, 87, 87, 0.12);
      }
      .answer-letter {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #2d5757;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        flex-shrink: 0;
      }
      .answer-text { flex: 1; }
      .navigation-buttons { display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
      .nav-btn {
        padding: 1rem 2rem;
        border-radius: 12px;
        font-weight: 700;
        cursor: pointer;
        border: none;
        font-size: 1rem;
      }
      .nav-btn.primary { background: #2d5757; color: #fff; }
      .nav-btn.secondary { background: rgba(45, 87, 87, 0.15); color: #2d5757; }
      .nav-btn.submit { background: #1a5c08; color: #fff; }
      .nav-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      .results-container { max-width: 500px; margin: 4rem auto; text-align: center; }
      .results-card {
        background: #fff;
        padding: 3rem;
        border-radius: 25px;
        box-shadow: 0 10px 30px rgba(45, 87, 87, 0.1);
      }
      .passed-card { border-top: 5px solid #16a34a; }
      .failed-card  { border-top: 5px solid #dc2626; }
      .result-icon  { font-size: 3rem; margin-bottom: 0.5rem; }
      .results-card h2 { color: #2d5757; margin: 0 0 1rem 0; }
      .score-display { font-size: 2.5rem; font-weight: 800; margin-bottom: 0.5rem; }
      .passed-score { color: #16a34a; }
      .failed-score { color: #dc2626; }
      .score-detail  { margin: 0 0 0.25rem; color: #64748b; }
      .score-required { margin: 0 0 1rem; color: #64748b; font-size: 0.9rem; }
      .certificate-badge {
        background: linear-gradient(135deg,#f0fdf4,#dcfce7);
        border: 2px solid #86efac;
        border-radius: 12px;
        padding: 0.75rem 1.25rem;
        margin: 1rem 0;
        font-weight: 700;
        color: #15803d;
        font-size: 0.95rem;
      }
      .results-actions { margin-top: 1.5rem; display:flex; gap:0.75rem; justify-content:center; flex-wrap:wrap; }
    `,
  ],
})
export class PasserExamenComponent implements OnInit, OnDestroy {
  certification: Certification | null = null;
  currentExam: CertificationExam | null = null;
  questions: ExamQuestionDisplay[] = [];
  currentQuestionIndex = 0;
  selectedAnswer: number | null = null;
  userAnswers: number[] = [];
  loading = true;
  submitted = false;
  result: ExamResult | null = null;
  timeRemaining = 0;
  private timerSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private certificationService: CertificationService,
    private examService: ExamService,
    private questionService: QuestionService,
    private answerService: AnswerService,
    private resultService: ResultService,
    private certificateService: CertificateService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadData(+id);
    } else {
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    this.timerSubscription?.unsubscribe();
  }

  private loadData(certId: number): void {
    console.log(`[PasserExamen] Chargement des données pour la certification ID: ${certId}`);
    this.certificationService.getById(certId).pipe(
      switchMap((cert) => {
        console.log(`[PasserExamen] Certification trouvée:`, cert);
        this.certification = cert;
        return this.examService.getByCertification(certId);
      }),
      switchMap((exams) => {
        console.log(`[PasserExamen] ${exams?.length || 0} examens trouvés.`);
        if (exams && exams.length > 0) {
          this.currentExam = exams[0];
          console.log(`[PasserExamen] Utilisation de l'examen:`, this.currentExam);
          this.timeRemaining = (this.currentExam.duration || 60) * 60;
          return this.questionService.getByExam(this.currentExam.id!);
        }
        console.warn(`[PasserExamen] Aucun examen trouvé pour cette certification.`);
        return of([] as Question[]);
      }),
      switchMap((questionsList: Question[]) => {
        console.log(`[PasserExamen] ${questionsList.length} questions trouvées.`);
        if (questionsList.length === 0) return of([]);
        const requests = questionsList.map((q) =>
          this.answerService.getByQuestion(q.id!).pipe(
            map((answers: Answer[]) => {
              console.log(`[PasserExamen] ${answers.length} réponses pour la question ${q.id}`);
              if (answers.length === 0) {
                // Pas de réponses réelles → on exclut cette question
                return null;
              }
              return {
                id: q.id!,
                text: q.content,
                options: answers.map((a) => a.content),
                correctAnswerIndex: answers.findIndex((a) => a.correct),
                type: q.type,
              };
            }),
            catchError(() => {
              console.warn(`[PasserExamen] Erreur réponses pour question ${q.id} — exclue de l'examen.`);
              return of(null);
            })
          )
        );
        return forkJoin(requests).pipe(
          map(results => results.filter(r => r !== null) as ExamQuestionDisplay[])
        );
      }),
      catchError((err) => {
        console.error(`[PasserExamen] Erreur globale lors du chargement:`, err);
        return of([]);
      })
    ).subscribe({
      next: (mapped: ExamQuestionDisplay[]) => {
        console.log(`[PasserExamen] Chargement terminé. ${mapped.length} questions prêtes.`);
        this.questions = mapped;
        this.userAnswers = new Array(this.questions.length).fill(-1);
        if (this.questions.length > 0 && this.timeRemaining > 0) {
          this.startTimer();
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private startTimer(): void {
    this.timerSubscription = interval(1000).subscribe(() => {
      if (this.timeRemaining > 0) {
        this.timeRemaining--;
        this.cdr.detectChanges();
      } else {
        this.submitExam();
      }
    });
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  getProgressPercentage(): number {
    if (this.questions.length === 0) return 0;
    return Math.round(((this.currentQuestionIndex + 1) / this.questions.length) * 100);
  }

  getLetter(i: number): string {
    return String.fromCharCode(65 + i);
  }

  getQuestionTypeLabel(): string {
    const t = this.questions[this.currentQuestionIndex]?.type;
    if (t === QuestionType.MULTIPLE_CHOICE) return 'Choix multiple';
    if (t === QuestionType.TRUE_FALSE) return 'Vrai / Faux';
    if (t === QuestionType.OPEN) return 'Question ouverte';
    return 'Question';
  }

  selectAnswer(index: number): void {
    this.selectedAnswer = index;
    this.userAnswers[this.currentQuestionIndex] = index;
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.selectedAnswer =
        this.userAnswers[this.currentQuestionIndex] >= 0
          ? this.userAnswers[this.currentQuestionIndex]
          : null;
    }
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.selectedAnswer =
        this.userAnswers[this.currentQuestionIndex] >= 0
          ? this.userAnswers[this.currentQuestionIndex]
          : null;
    }
  }

  submitExam(): void {
    if (this.submitted) return;
    this.submitted = true;
    this.timerSubscription?.unsubscribe();

    let correct = 0;
    this.questions.forEach((q, i) => {
      if (this.userAnswers[i] === q.correctAnswerIndex) correct++;
    });
    const percentage = Math.round((correct / this.questions.length) * 100);
    const passingScore = this.certification?.passingScore ?? 70;
    const passed = percentage >= passingScore;

    this.result = {
      score: correct,
      totalQuestions: this.questions.length,
      percentage,
      passed,
      level: this.certification?.level ?? 'A1',
    };

    const userId = this.authService.getCurrentUser()?.id ?? 0;

    if (this.certification?.id) {
      this.resultService.create({
        userId,
        certificationId: this.certification.id,
        score: percentage,
        passed,
        certificationExam: { id: this.currentExam?.id } as any,
      }).subscribe({
        next: () => {
          if (passed) {
            this.generateCertificate(userId);
          }
          this.cdr.detectChanges();
        }
      });
    }
    this.cdr.detectChanges();
  }

  private generateCertificate(userId: number): void {
    this.certificateService.create({
      userId,
      certificateName: this.certification?.title ?? 'Certification',
      level: this.certification?.level ?? 'A1',
    }).subscribe();
  }

  goBack(): void {
    this.router.navigate(['/certifications']);
  }

  goToMyResults(): void {
    this.router.navigate(['/assessment/frontoffice/mes-resultats']);
  }
}
