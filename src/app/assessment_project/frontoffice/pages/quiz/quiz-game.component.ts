import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { GameSession, Quiz, QuizQuestion, GameStatus, QuizAnswer } from '../../../backoffice/models/quiz.models';
import { GameSessionService } from '../../../backoffice/services/game-session.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-quiz-game',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="quiz-game" [class.game-over]="isGameOver">
      <!-- Header avec score et timer -->
      <div class="game-header">
        <div class="score-section">
          <div class="score-card">
            <span class="score-label">🏆 Score</span>
            <span class="score-value">{{ currentScore }}</span>
          </div>
          <div class="rank-card">
            <span class="rank-label">🥇 Classement</span>
            <span class="rank-value">#{{ currentRank }}</span>
          </div>
        </div>
        
        <div class="timer-section">
          <div class="timer-card" [class.warning]="timeLeft <= 5" [class.danger]="timeLeft <= 3">
            <div class="timer-icon">⏱️</div>
            <div class="timer-value">{{ timeLeft }}</div>
          </div>
        </div>
      </div>

      <!-- Question -->
      <div class="question-section" *ngIf="currentQuestion && !isGameOver">
        <div class="question-card">
          <div class="question-header">
            <span class="question-number">Question {{ currentQuestionIndex + 1 }}/{{ totalQuestions }}</span>
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="progressPercentage"></div>
            </div>
          </div>
          
          <div class="question-content">
            <h2 class="question-text">{{ currentQuestion.content }}</h2>
          </div>
        </div>
      </div>

      <!-- Réponses -->
      <div class="answers-section" *ngIf="currentQuestion && !isGameOver && !showResult">
        <div class="answers-grid">
          <button 
            *ngFor="let answer of currentAnswers; let i = index"
            (click)="selectAnswer(i)"
            class="answer-btn"
            [class.selected]="selectedAnswer === i"
            [disabled]="hasAnswered"
            [style.animation-delay.px]="i * 100"
          >
            <span class="answer-text">{{ answer.content }}</span>
          </button>
        </div>
      </div>

      <!-- Résultat de la question -->
      <div class="result-section" *ngIf="showResult && !isGameOver">
        <div class="result-card" [class.correct]="isCorrect" [class.incorrect]="!isCorrect">
          <div class="result-icon">
            {{ isCorrect ? '✅' : '❌' }}
          </div>
          <div class="result-text">
            <h3>{{ isCorrect ? 'Bonne réponse !' : 'Mauvaise réponse !' }}</h3>
            <p *ngIf="!isCorrect">La bonne réponse était: {{ correctAnswer }}</p>
            <p *ngIf="isCorrect">+{{ pointsEarned }} points</p>
          </div>
        </div>
        
        <!-- Classement temporaire -->
        <div class="temp-ranking">
          <h3>🏆 Classement temporaire</h3>
          <div class="ranking-list">
            <div class="ranking-item" *ngFor="let player of tempRanking; let i = index" [class.current-player]="player.isCurrentUser">
              <span class="rank-position">#{{ i + 1 }}</span>
              <span class="rank-name">{{ player.name }}</span>
              <span class="rank-score">{{ player.score }} pts</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Game Over -->
      <div class="game-over-section" *ngIf="isGameOver">
        <div class="game-over-card">
          <div class="game-over-icon">🏆</div>
          <h2 class="game-over-title">Quiz terminé !</h2>
          <div class="final-score">
            <span class="final-label">Score final</span>
            <span class="final-value">{{ currentScore }} points</span>
          </div>
          
          <!-- Classement final -->
          <div class="final-ranking">
            <h3>🏆 Classement final</h3>
            <div class="ranking-list">
              <div class="ranking-item" *ngFor="let player of finalRanking; let i = index" [class.current-player]="player.isCurrentUser" [class.winner]="i === 0">
                <span class="rank-position">
                  {{ i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '#' + (i + 1) }}
                </span>
                <span class="rank-name">{{ player.name }}</span>
                <span class="rank-score">{{ player.score }} pts</span>
              </div>
            </div>
          </div>
          
          <div class="game-over-actions">
            <button (click)="playAgain()" class="btn-play-again">
              🔄 Rejouer
            </button>
            <button (click)="goHome()" class="btn-go-home">
              🏠 Accueil
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .quiz-game {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem;
    }

    .game-over {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .game-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      gap: 1rem;
    }

    .score-section {
      display: flex;
      gap: 1rem;
    }

    .score-card, .rank-card {
      background: white;
      padding: 1rem 1.5rem;
      border-radius: 16px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .score-label, .rank-label {
      display: block;
      font-size: 0.9rem;
      color: #718096;
      margin-bottom: 0.25rem;
    }

    .score-value, .rank-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: #2d3748;
    }

    .timer-card {
      background: white;
      padding: 1rem 2rem;
      border-radius: 16px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.3s ease;
    }

    .timer-card.warning {
      background: #fef5e7;
      border: 2px solid #f39c12;
    }

    .timer-card.danger {
      background: #fed7d7;
      border: 2px solid #e53e3e;
      animation: pulse 1s infinite;
    }

    .timer-icon {
      font-size: 1.5rem;
    }

    .timer-value {
      font-size: 2rem;
      font-weight: 800;
      color: #2d3748;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    .question-section {
      margin-bottom: 2rem;
    }

    .question-card {
      background: white;
      border-radius: 20px;
      padding: 2rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }

    .question-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .question-number {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 12px;
      font-weight: 600;
    }

    .progress-bar {
      width: 200px;
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(135deg, #48bb78, #38a169);
      transition: width 0.3s ease;
    }

    .question-text {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1a202c;
      text-align: center;
      margin: 0;
      line-height: 1.4;
    }

    .answers-section {
      margin-bottom: 2rem;
    }

    .answers-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .answer-btn {
      background: white;
      border: 3px solid #e2e8f0;
      border-radius: 16px;
      padding: 1.5rem;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 1rem;
      animation: slideInUp 0.5s ease forwards;
      opacity: 0;
    }

    .answer-btn:hover:not(:disabled) {
      border-color: #667eea;
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.2);
    }

    .answer-btn.selected {
      border-color: #667eea;
      background: #f0f4ff;
    }

    .answer-btn:disabled {
      cursor: not-allowed;
      opacity: 0.7;
    }

    .answer-letter {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.2rem;
    }

    .answer-text {
      flex: 1;
      font-weight: 600;
      color: #2d3748;
      font-size: 1.1rem;
    }

    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .result-section {
      margin-bottom: 2rem;
    }

    .result-card {
      background: white;
      border-radius: 20px;
      padding: 2rem;
      text-align: center;
      margin-bottom: 2rem;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    }

    .result-card.correct {
      border: 3px solid #48bb78;
    }

    .result-card.incorrect {
      border: 3px solid #e53e3e;
    }

    .result-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .result-text h3 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #2d3748;
      margin: 0 0 0.5rem 0;
    }

    .result-text p {
      color: #718096;
      margin: 0;
    }

    .temp-ranking, .final-ranking {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .temp-ranking h3, .final-ranking h3 {
      font-size: 1.2rem;
      font-weight: 700;
      color: #1a202c;
      margin: 0 0 1rem 0;
      text-align: center;
    }

    .ranking-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .ranking-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      border-radius: 12px;
      background: #f7fafc;
    }

    .ranking-item.current-player {
      background: #e6fffa;
      border: 2px solid #38b2ac;
    }

    .ranking-item.winner {
      background: linear-gradient(135deg, #ffd700, #ffed4e);
      font-weight: 700;
    }

    .rank-position {
      font-weight: 700;
      color: #4a5568;
      min-width: 40px;
    }

    .rank-name {
      flex: 1;
      font-weight: 600;
      color: #2d3748;
    }

    .rank-score {
      font-weight: 700;
      color: #667eea;
    }

    .game-over-section {
      width: 100%;
      max-width: 600px;
    }

    .game-over-card {
      background: white;
      border-radius: 24px;
      padding: 3rem;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }

    .game-over-icon {
      font-size: 5rem;
      margin-bottom: 1rem;
    }

    .game-over-title {
      font-size: 2.5rem;
      font-weight: 800;
      color: #1a202c;
      margin: 0 0 2rem 0;
    }

    .final-score {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border-radius: 20px;
      padding: 2rem;
      margin-bottom: 2rem;
    }

    .final-label {
      display: block;
      font-size: 1.1rem;
      margin-bottom: 0.5rem;
      opacity: 0.9;
    }

    .final-value {
      font-size: 3rem;
      font-weight: 800;
    }

    .game-over-actions {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
    }

    .btn-play-again, .btn-go-home {
      flex: 1;
      border: none;
      padding: 1rem;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-play-again {
      background: linear-gradient(135deg, #48bb78, #38a169);
      color: white;
    }

    .btn-go-home {
      background: #e2e8f0;
      color: #4a5568;
    }

    .btn-play-again:hover, .btn-go-home:hover {
      transform: translateY(-2px);
    }

    @media (max-width: 768px) {
      .game-header {
        flex-direction: column;
        text-align: center;
      }
      
      .answers-grid {
        grid-template-columns: 1fr;
      }
      
      .game-over-actions {
        flex-direction: column;
      }
    }
  `]
})
export class QuizGameComponent implements OnInit, OnDestroy {
  session: GameSession | null = null;
  currentQuestion: QuizQuestion | null = null;
  currentQuestionIndex = 0;
  totalQuestions = 0;
  currentAnswers: QuizAnswer[] = [];

  // Timer
  timeLeft = 20;
  private timerSubscription: Subscription | null = null;

  // Game state
  selectedAnswer: number | null = null;
  hasAnswered = false;
  showResult = false;
  isCorrect = false;
  correctAnswer = '';
  pointsEarned = 0;

  // Score
  currentScore = 0;
  currentRank = 1;

  // Rankings
  tempRanking: PlayerScore[] = [];
  finalRanking: PlayerScore[] = [];

  // Game state
  isGameOver = false;
  progressPercentage = 0;

  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private sessionService: GameSessionService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const sessionId = this.route.snapshot.paramMap.get('id');
    if (sessionId) {
      this.loadSession(+sessionId);
    } else {
      this.router.navigate(['/assessment/frontoffice/quiz']);
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadSession(sessionId: number): void {
    const sessionSub = this.sessionService.getSessionById(sessionId).subscribe({
      next: (session) => {
        this.session = session;
        console.log('✅ Game session loaded:', session);

        if (session.quiz && session.quiz.questions) {
          this.totalQuestions = session.quiz.questions.length;
          this.loadQuestion();
        }
      },
      error: (err) => {
        console.error('❌ Error loading session:', err);
        this.router.navigate(['/assessment/frontoffice/quiz']);
      }
    });

    this.subscriptions.push(sessionSub);
  }

  private loadQuestion(): void {
    if (!this.session?.quiz?.questions || this.currentQuestionIndex >= this.totalQuestions) {
      this.endGame();
      return;
    }

    // Reset state
    this.selectedAnswer = null;
    this.hasAnswered = false;
    this.showResult = false;

    // Load current question
    this.currentQuestion = this.session.quiz.questions[this.currentQuestionIndex];
    this.currentAnswers = this.generateAnswers(this.currentQuestion);

    // Start timer
    this.timeLeft = this.currentQuestion.timeLimit || 20;
    this.startTimer();

    // Update progress
    this.progressPercentage = ((this.currentQuestionIndex + 1) / this.totalQuestions) * 100;

    console.log('📝 Question loaded:', this.currentQuestion);
  }

  private generateAnswers(question: QuizQuestion): QuizAnswer[] {
    if (!question.answers || question.answers.length === 0) {
      return [];
    }
    // Return answers mixed conditionally if needed, or directly front to back
    return [...question.answers];
  }

  private startTimer(): void {
    this.stopTimer();

    this.timerSubscription = interval(1000).subscribe(() => {
      this.timeLeft--;

      if (this.timeLeft <= 0) {
        this.timeUp();
      }
    });
  }

  private stopTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = null;
    }
  }

  selectAnswer(answerIndex: number): void {
    if (this.hasAnswered) return;

    this.selectedAnswer = answerIndex;
    this.hasAnswered = true;
    this.stopTimer();

    // Vérification de la réponse réelle
    const selected = this.currentAnswers[answerIndex];
    this.isCorrect = selected ? selected.isCorrect : false;

    const correctAns = this.currentAnswers.find(a => a.isCorrect);
    this.correctAnswer = correctAns ? correctAns.content : 'Inconnue';

    if (this.isCorrect) {
      // Points basés sur le temps restant
      this.pointsEarned = Math.max(100, this.timeLeft * 10);
      this.currentScore += this.pointsEarned;
    }

    // Afficher le résultat
    this.showResult = true;

    // Simuler le classement temporaire
    this.updateTempRanking();

    console.log('🎯 Answer selected:', answerIndex, 'Correct:', this.isCorrect);

    // Passer à la question suivante après 3 secondes
    setTimeout(() => {
      this.nextQuestion();
    }, 3000);
  }

  private timeUp(): void {
    this.hasAnswered = true;
    this.isCorrect = false;
    this.showResult = true;
    this.pointsEarned = 0;

    this.updateTempRanking();

    setTimeout(() => {
      this.nextQuestion();
    }, 3000);
  }

  private nextQuestion(): void {
    this.currentQuestionIndex++;

    if (this.currentQuestionIndex >= this.totalQuestions) {
      this.endGame();
    } else {
      this.loadQuestion();
    }
  }

  private updateTempRanking(): void {
    // Simuler un classement temporaire
    this.tempRanking = [
      { name: 'Vous', score: this.currentScore, isCurrentUser: true },
      { name: 'Player 2', score: Math.max(0, this.currentScore - 50), isCurrentUser: false },
      { name: 'Player 3', score: Math.max(0, this.currentScore - 100), isCurrentUser: false }
    ];

    // Trier par score
    this.tempRanking.sort((a, b) => b.score - a.score);

    // Trouver le rang du joueur
    this.currentRank = this.tempRanking.findIndex(p => p.isCurrentUser) + 1;
  }

  private endGame(): void {
    this.isGameOver = true;
    this.stopTimer();

    // Simuler le classement final
    this.finalRanking = [
      { name: 'Vous', score: this.currentScore, isCurrentUser: true },
      { name: 'Player 2', score: Math.max(0, this.currentScore - 30), isCurrentUser: false },
      { name: 'Player 3', score: Math.max(0, this.currentScore - 80), isCurrentUser: false }
    ];

    // Trier par score
    this.finalRanking.sort((a, b) => b.score - a.score);

    console.log('🏆 Game over! Final score:', this.currentScore);
  }

  getAnswerLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D
  }

  playAgain(): void {
    // Recharger la même session
    if (this.session) {
      this.currentQuestionIndex = 0;
      this.currentScore = 0;
      this.isGameOver = false;
      this.loadQuestion();
    }
  }

  goHome(): void {
    this.router.navigate(['/assessment/frontoffice/quiz']);
  }
}

interface PlayerScore {
  name: string;
  score: number;
  isCurrentUser: boolean;
}
