import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { interval, Subscription, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  AssessmentExamService,
  AssessmentExam,
  AssessmentQuestion,
  AssessmentAnswer,
  AssessmentAttempt,
  AssessmentQuestionType,
  SubmitExamPayload
} from '../../../backoffice/services/assessment-exam.service';
import { AuthService } from '../../../shared/services/auth.service';

/** Internal display model for a question */
interface QuestionDisplay {
  id: number;
  text: string;
  type: AssessmentQuestionType;
  options: { id: number; text: string }[];
  correctAnswerId: number | null;
}

@Component({
  selector: 'app-passer-assessment-exam',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="exam-page">
      <!-- Loading -->
      <div class="center-card" *ngIf="loading">
        <div class="spin">🔄</div>
        <h2>Chargement de l'examen…</h2>
      </div>

      <!-- Already passed blocker -->
      <div class="center-card passed-block" *ngIf="!loading && alreadyPassed">
        <div class="result-icon">🏆</div>
        <h2>Vous avez déjà réussi cet examen !</h2>
        <p>Votre score : <strong class="score-green">{{ previousScore }}%</strong></p>
        <p class="sub">Votre certificat est disponible dans « Mes Notes ».</p>
        <div class="block-actions">
          <a routerLink="/assessment/frontoffice/examens" class="btn primary">← Tous les examens</a>
          <a routerLink="/assessment/frontoffice/mes-notes-examen" class="btn secondary">📋 Mes Notes →</a>
        </div>
      </div>

      <!-- No questions -->
      <div class="center-card" *ngIf="!loading && !alreadyPassed && !submitted && questions.length === 0">
        <div class="warn-icon">⚠️</div>
        <h2>Aucune question disponible</h2>
        <p>Cet examen n'a pas encore de questions avec des réponses.</p>
        <a routerLink="/assessment/frontoffice/examens" class="btn primary">← Retour aux examens</a>
      </div>

      <!-- Exam in progress -->
      <div class="exam-container" *ngIf="!loading && !alreadyPassed && !submitted && questions.length > 0">
        <!-- Header -->
        <div class="exam-header">
          <div class="exam-info">
            <h1>{{ exam?.title }}</h1>
            <p *ngIf="exam?.description">{{ exam?.description }}</p>
          </div>
          <div class="timer-box">
            <span class="timer-label">Temps restant</span>
            <span class="timer-value" [class.timer-warn]="timeRemaining < 60">
              {{ formatTime(timeRemaining) }}
            </span>
          </div>
        </div>

        <!-- Progress -->
        <div class="progress-row">
          <span>Question {{ qi + 1 }} / {{ questions.length }}</span>
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="((qi + 1) / questions.length) * 100"></div>
          </div>
        </div>

        <!-- Question card -->
        <div class="question-card">
          <div class="q-header">
            <span class="q-num">Question {{ qi + 1 }}</span>
            <span class="q-type">{{ typeLabel(questions[qi].type) }}</span>
          </div>
          <h3 class="q-text">{{ questions[qi].text }}</h3>
          <div class="options-list">
            <div *ngFor="let opt of questions[qi].options; let i = index"
              class="option" [class.selected]="userAnswers[qi] === opt.id"
              (click)="selectAnswer(opt.id)">
              <span class="opt-letter">{{ letter(i) }}</span>
              <span class="opt-text">{{ opt.text }}</span>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <div class="nav-row">
          <button class="btn secondary" (click)="prev()" [disabled]="qi === 0">← Précédent</button>
          <button class="btn primary" (click)="next()" *ngIf="qi < questions.length - 1">Suivant →</button>
          <button class="btn submit-btn" (click)="submit()" *ngIf="qi === questions.length - 1" [disabled]="submitting">
            {{ submitting ? '⏳ Envoi…' : '✅ Soumettre l\'examen' }}
          </button>
        </div>

        <!-- Answered indicator -->
        <div class="dots-row">
          <span *ngFor="let q of questions; let i = index"
            class="dot" [class.dot-current]="i === qi"
            [class.dot-answered]="userAnswers[i] !== -1"
            (click)="goTo(i)">
          </span>
        </div>
      </div>

      <!-- Results -->
      <div class="result-container" *ngIf="submitted && result">
        <div class="result-card" [class.card-pass]="result.passed" [class.card-fail]="!result.passed">
          <div class="result-icon">{{ result.passed ? '🏆' : '📋' }}</div>
          <h2>{{ result.passed ? 'Félicitations !' : 'Examen non réussi' }}</h2>

          <div class="score-big" [class.score-pass]="result.passed" [class.score-fail]="!result.passed">
            {{ result.score }}%
          </div>
          <p class="score-detail">{{ result.correctCount }} / {{ questions.length }} bonnes réponses</p>
          <p class="score-req">Score requis : {{ exam?.passingScore }}%</p>

          <div class="cert-badge" *ngIf="result.passed">
            🎓 Certificat généré automatiquement ! Téléchargez-le depuis « Mes Notes ».
          </div>

          <div class="cert-badge fail-badge" *ngIf="!result.passed">
            💡 Vous n'avez pas atteint le seuil. Réessayez !
          </div>

          <div class="result-actions">
            <a routerLink="/assessment/frontoffice/examens" class="btn primary">← Tous les examens</a>
            <a routerLink="/assessment/frontoffice/mes-notes-examen" class="btn secondary" *ngIf="result.passed">
              📋 Mes Notes →
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .exam-page { min-height:100vh; padding:2rem; }
    .center-card {
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      padding:4rem; text-align:center; background:rgba(255,255,255,0.95);
      border-radius:25px; margin:4rem auto; max-width:600px; box-shadow:0 10px 30px rgba(45,87,87,0.1);
    }
    .spin { font-size:4rem; margin-bottom:2rem; animation:sp 2s linear infinite; }
    @keyframes sp { to { transform:rotate(360deg); } }
    .warn-icon { font-size:3rem; margin-bottom:1rem; }
    .center-card h2 { color:#2d5757; margin:0 0 0.5rem; }
    .center-card p { color:#64748b; margin:0 0 1.5rem; }
    .center-card .sub { font-size:0.88rem; color:#94a3b8; margin-top:-0.5rem; }
    .score-green { color:#16a34a; font-size:1.5rem; }
    .passed-block { border-top:5px solid #16a34a; }
    .block-actions { display:flex; gap:0.75rem; flex-wrap:wrap; }

    .exam-container { max-width:900px; margin:0 auto; }

    .exam-header {
      background:#fff; border-radius:20px; padding:2rem; margin-bottom:1.5rem;
      display:flex; justify-content:space-between; align-items:flex-start;
      box-shadow:0 10px 30px rgba(45,87,87,0.1); gap:1.5rem; flex-wrap:wrap;
    }
    .exam-info h1 { font-size:1.6rem; color:#2d5757; margin:0 0 0.3rem; }
    .exam-info p  { color:#64748b; margin:0; font-size:0.9rem; }
    .timer-box { background:#2d5757; color:#fff; padding:1rem 1.5rem; border-radius:15px; text-align:center; min-width:120px; }
    .timer-label { display:block; font-size:0.78rem; opacity:0.9; }
    .timer-value { font-size:1.5rem; font-weight:800; }
    .timer-warn  { color:#fbbf24; }

    .progress-row { margin-bottom:1.5rem; color:#64748b; font-size:0.9rem; }
    .progress-bar { height:10px; background:rgba(0,0,0,0.08); border-radius:5px; overflow:hidden; margin-top:0.5rem; }
    .progress-fill { height:100%; background:#2d5757; transition:width 0.3s; border-radius:5px; }

    .question-card {
      background:#fff; padding:2.5rem; border-radius:25px; margin-bottom:1.5rem;
      box-shadow:0 10px 30px rgba(45,87,87,0.1);
    }
    .q-header { display:flex; justify-content:space-between; margin-bottom:1.5rem; }
    .q-num  { font-weight:800; color:#2d5757; }
    .q-type { font-weight:600; opacity:0.7; font-size:0.88rem; }
    .q-text { font-size:1.2rem; color:#1a3a3a; margin:0 0 2rem; line-height:1.5; }

    .options-list { display:grid; gap:0.85rem; }
    .option {
      display:flex; align-items:center; gap:1rem; padding:1.15rem;
      background:rgba(45,87,87,0.04); border:2px solid transparent;
      border-radius:14px; cursor:pointer; transition:0.2s;
    }
    .option:hover { background:rgba(45,87,87,0.08); }
    .option.selected { border-color:#2d5757; background:rgba(45,87,87,0.12); }
    .opt-letter {
      width:34px; height:34px; border-radius:50%; background:#2d5757; color:#fff;
      display:flex; align-items:center; justify-content:center; font-weight:800; flex-shrink:0; font-size:0.88rem;
    }
    .opt-text { flex:1; color:#1e293b; font-size:0.95rem; }

    .nav-row { display:flex; justify-content:space-between; gap:1rem; flex-wrap:wrap; margin-bottom:1.5rem; }
    .btn {
      padding:0.85rem 1.8rem; border-radius:12px; font-weight:700; cursor:pointer;
      border:none; font-size:0.95rem; text-decoration:none; display:inline-block; text-align:center;
    }
    .btn.primary   { background:#2d5757; color:#fff; }
    .btn.secondary  { background:rgba(45,87,87,0.12); color:#2d5757; }
    .btn.submit-btn { background:#16a34a; color:#fff; }
    .btn:disabled   { opacity:0.5; cursor:not-allowed; }

    .dots-row { display:flex; gap:0.5rem; justify-content:center; flex-wrap:wrap; }
    .dot { width:14px; height:14px; border-radius:50%; background:#e2e8f0; cursor:pointer; transition:0.2s; }
    .dot-answered { background:#86efac; }
    .dot-current  { background:#2d5757; transform:scale(1.3); }

    .result-container { max-width:520px; margin:4rem auto; }
    .result-card {
      background:#fff; padding:3rem; border-radius:25px; text-align:center;
      box-shadow:0 10px 30px rgba(45,87,87,0.1);
    }
    .card-pass { border-top:5px solid #16a34a; }
    .card-fail { border-top:5px solid #dc2626; }
    .result-icon { font-size:3rem; margin-bottom:0.5rem; }
    .result-card h2 { color:#2d5757; margin:0 0 1rem; }
    .score-big  { font-size:3rem; font-weight:800; margin-bottom:0.5rem; }
    .score-pass { color:#16a34a; }
    .score-fail { color:#dc2626; }
    .score-detail { margin:0 0 0.25rem; color:#64748b; }
    .score-req    { margin:0 0 1.25rem; color:#94a3b8; font-size:0.88rem; }
    .cert-badge {
      background:linear-gradient(135deg,#f0fdf4,#dcfce7); border:2px solid #86efac;
      border-radius:12px; padding:0.85rem 1.25rem; margin-bottom:1.25rem;
      font-weight:700; color:#15803d; font-size:0.9rem;
    }
    .fail-badge { background:linear-gradient(135deg,#fef2f2,#fecaca); border-color:#fca5a5; color:#dc2626; }
    .result-actions { display:flex; gap:0.75rem; justify-content:center; flex-wrap:wrap; margin-top:0.5rem; }
  `]
})
export class PasserAssessmentExamComponent implements OnInit, OnDestroy {
  exam: AssessmentExam | null = null;
  questions: QuestionDisplay[] = [];
  qi = 0;
  userAnswers: number[] = [];
  loading = true;
  submitted = false;
  submitting = false;
  timeRemaining = 0;
  alreadyPassed = false;
  previousScore = 0;
  result: { score: number; correctCount: number; passed: boolean } | null = null;
  private timerSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private svc: AssessmentExamService,
    private auth: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    if (!id) { this.loading = false; return; }
    this.loadExam(id);
  }

  ngOnDestroy() { this.timerSub?.unsubscribe(); }

  // ── Load exam + questions + answers ────────────────────────────────────────

  private loadExam(examId: number) {
    this.svc.getExam(examId).subscribe({
      next: (exam) => {
        this.exam = exam;
        this.timeRemaining = (exam.duration || 60) * 60;
        // Check if already passed before loading questions
        this.checkAlreadyPassed(examId);
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  private checkAlreadyPassed(examId: number) {
    const userId = this.auth.getCurrentUser()?.id;
    if (!userId) {
      this.loadQuestions(examId);
      return;
    }
    this.svc.getAttemptsByUser(userId).subscribe({
      next: (attempts) => {
        const passed = attempts.find(a => a.exam?.id === examId && a.passed);
        if (passed) {
          this.alreadyPassed = true;
          this.previousScore = passed.score;
          this.loading = false;
          this.cdr.detectChanges();
        } else {
          this.loadQuestions(examId);
        }
      },
      error: () => this.loadQuestions(examId)
    });
  }

  private loadQuestions(examId: number) {
    this.svc.getQuestions(examId).subscribe({
      next: (qs) => {
        if (!qs || qs.length === 0) {
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }

        // For each question, load its answers
        const requests = qs.map(q =>
          this.svc.getAnswers(q.id!).pipe(
            map((answers): QuestionDisplay | null => {
              if (!answers || answers.length === 0) return null;
              return {
                id: q.id!,
                text: q.content,
                type: q.type,
                options: answers.map(a => ({ id: a.id!, text: a.content })),
                correctAnswerId: answers.find(a => a.correct)?.id ?? null,
              };
            }),
            catchError(() => of(null))
          )
        );

        forkJoin(requests).subscribe({
          next: (results) => {
            this.questions = results.filter(r => r !== null) as QuestionDisplay[];
            this.userAnswers = new Array(this.questions.length).fill(-1);
            if (this.questions.length > 0 && this.timeRemaining > 0) {
              this.startTimer();
            }
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  // ── Timer ──────────────────────────────────────────────────────────────────

  private startTimer() {
    this.timerSub = interval(1000).subscribe(() => {
      if (this.timeRemaining > 0) {
        this.timeRemaining--;
        this.cdr.detectChanges();
      } else {
        this.submit();
      }
    });
  }

  formatTime(s: number): string {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  letter(i: number): string { return String.fromCharCode(65 + i); }

  typeLabel(t: AssessmentQuestionType): string {
    if (t === AssessmentQuestionType.MULTIPLE_CHOICE) return 'Choix multiple';
    if (t === AssessmentQuestionType.TRUE_FALSE) return 'Vrai / Faux';
    return 'Question ouverte';
  }

  selectAnswer(answerId: number) {
    this.userAnswers[this.qi] = answerId;
  }

  prev() { if (this.qi > 0) this.qi--; }
  next() { if (this.qi < this.questions.length - 1) this.qi++; }
  goTo(i: number) { this.qi = i; }

  // ── Submit exam ────────────────────────────────────────────────────────────

  submit() {
    if (this.submitted || this.submitting) return;
    this.submitting = true;
    this.timerSub?.unsubscribe();

    const user = this.auth.getCurrentUser();
    const payload: SubmitExamPayload = {
      examId: this.exam!.id!,
      userId: user?.id ?? 0,
      studentName: user?.username ?? 'Étudiant',
      answers: this.questions.map((q, i) => ({
        questionId: q.id,
        answerId: this.userAnswers[i] !== -1 ? this.userAnswers[i] : 0
      }))
    };

    this.svc.submitExam(payload).subscribe({
      next: (attempt: AssessmentAttempt) => {
        // Count correct locally for display
        let correctCount = 0;
        this.questions.forEach((q, i) => {
          if (q.correctAnswerId !== null && this.userAnswers[i] === q.correctAnswerId) {
            correctCount++;
          }
        });

        this.result = {
          score: attempt.score,
          correctCount,
          passed: attempt.passed ?? false,
        };
        this.submitted = true;
        this.submitting = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.submitting = false;
        this.cdr.detectChanges();
        alert('Erreur lors de la soumission de l\'examen.');
      }
    });
  }
}
