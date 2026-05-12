import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
    selector: 'app-quiz-join',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="join-container">

      <div class="join-card">
        <div class="logo">🎮 Quiz Live</div>
        <p class="subtitle">Rejoins une session en direct !</p>

        <!-- Étape 1 : Prénom -->
        <div class="step" *ngIf="step === 1">
          <label class="field-label">Ton prénom</label>
          <input
            type="text"
            [(ngModel)]="playerName"
            placeholder="Ex : Kenza, Youssef..."
            class="field-input"
            (keyup.enter)="goStep2()"
            maxlength="20" />
          <button class="btn-primary" (click)="goStep2()" [disabled]="!playerName.trim()">
            Continuer →
          </button>
        </div>

        <!-- Étape 2 : PIN -->
        <div class="step" *ngIf="step === 2">
          <div class="player-badge">👤 {{ playerName }}</div>
          <label class="field-label">Code PIN de la session</label>
          <input
            type="text"
            [(ngModel)]="pin"
            placeholder="123456"
            class="field-input pin-input"
            (keyup.enter)="join()"
            maxlength="10" />

          <div class="error-msg" *ngIf="errorMsg">⚠ {{ errorMsg }}</div>

          <button class="btn-primary" (click)="join()" [disabled]="!pin.trim() || loading">
            <span *ngIf="!loading">Rejoindre 🚀</span>
            <span *ngIf="loading">Recherche en cours...</span>
          </button>

          <button class="btn-back" (click)="step = 1">← Changer de prénom</button>
        </div>
      </div>

      <div class="footer-hint">
        Demande le PIN à l'animateur pour rejoindre sa session.
      </div>
    </div>
  `,
    styles: [`
    .join-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #F7EDE2 0%, rgba(45,87,87,0.05) 100%);
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 2rem;
      font-family: 'Open Sans', 'Montserrat', sans-serif;
    }
    .join-card {
      background: white; padding: 3rem; border-radius: 25px;
      width: 100%; max-width: 420px;
      box-shadow: 0 15px 40px rgba(45,87,87,0.15);
      border: 2px solid rgba(45,87,87,0.1); text-align: center;
    }
    .logo { font-size: 2rem; font-weight: 900; color: #2D5757; margin-bottom: 0.5rem; }
    .subtitle { color: #2D5757; opacity: 0.6; font-size: 1rem; margin-bottom: 2rem; }
    .step { display: flex; flex-direction: column; gap: 1rem; }
    .field-label { font-weight: 700; color: #2D5757; font-size: 0.9rem; text-align: left; }
    .field-input {
      width: 100%; padding: 1.1rem;
      border: 2px solid rgba(45,87,87,0.2); border-radius: 15px;
      font-size: 1.2rem; font-weight: 700; text-align: center;
      color: #2D5757; background: rgba(247,237,226,0.3);
      transition: all 0.2s; box-sizing: border-box;
    }
    .field-input:focus {
      outline: none; border-color: #2D5757;
      box-shadow: 0 4px 15px rgba(45,87,87,0.15);
    }
    .pin-input { font-size: 2.2rem; letter-spacing: 8px; }
    .player-badge {
      background: rgba(45,87,87,0.08); border: 2px solid rgba(45,87,87,0.15);
      color: #2D5757; padding: 0.6rem 1.5rem; border-radius: 20px;
      font-weight: 700; display: inline-block;
    }
    .btn-primary {
      width: 100%; background: linear-gradient(135deg, #2D5757, #1a3a3a);
      color: #F7EDE2; border: none; padding: 1.1rem;
      font-size: 1.1rem; font-weight: 800; border-radius: 15px;
      cursor: pointer; transition: all 0.2s;
      box-shadow: 0 6px 20px rgba(45,87,87,0.3);
    }
    .btn-primary:hover:not(:disabled) { transform: translateY(-2px); }
    .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
    .btn-back {
      background: none; border: none; color: #2D5757; opacity: 0.6;
      cursor: pointer; font-size: 0.9rem; font-weight: 600; padding: 0.5rem;
    }
    .btn-back:hover { opacity: 1; }
    .error-msg {
      background: rgba(220,38,38,0.1); border: 2px solid rgba(220,38,38,0.3);
      color: #dc2626; padding: 0.75rem 1rem; border-radius: 12px;
      font-weight: 700; font-size: 0.9rem;
    }
    .footer-hint { margin-top: 2rem; color: #2D5757; opacity: 0.6; font-size: 0.9rem; font-weight: 600; }
  `]
})
export class QuizJoinComponent implements OnInit {
    step = 1;
    playerName = '';
    pin = '';
    loading = false;
    errorMsg = '';

    constructor(
        private router: Router,
        private http: HttpClient,
        private auth: AuthService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        // Pre-fill username from logged-in user and skip to step 2
        const user = this.auth.getUser();
        if (user) {
            // Priority: username > full name > email prefix
            const fullName = (user.firstName || user.lastName) ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
            this.playerName = user.username || fullName || (user.email ? user.email.split('@')[0] : '');
            
            if (this.playerName) {
                this.step = 2;
            }
        }
    }

    goStep2(): void {
        if (this.playerName.trim()) {
            this.step = 2;
            this.errorMsg = '';
        }
    }

    join(): void {
        if (!this.pin.trim() || this.loading) return;
        this.loading = true;
        this.errorMsg = '';
        this.cdr.detectChanges();

        this.http.get<any>(`/quiz-api/game-sessions/pin/${this.pin.trim()}`).subscribe({
            next: (session) => {
                if (!session?.id) {
                    this.loading = false;
                    this.errorMsg = 'Session introuvable. Vérifie le PIN et réessaie.';
                    this.cdr.detectChanges();
                    return;
                }
                const user = this.auth.getUser();
                sessionStorage.setItem('quiz_username', this.playerName.trim());
                sessionStorage.setItem('quiz_user_id', String(user?.id ?? ''));
                sessionStorage.setItem('quiz_session_id', String(session.id));
                this.router.navigate(['/assessment/frontoffice/quiz/play', session.id], { queryParams: { mode: 'live' } });
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.loading = false;
                this.errorMsg = 'Session introuvable. Vérifie le PIN et réessaie.';
                this.cdr.detectChanges();
            }
        });
    }
}
