import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Certification, Level } from '../../backoffice/models/certification.models';

@Component({
  selector: 'app-certification-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="cert-card" [class]="'cert-card-' + certification.level.toLowerCase()">
      <div class="cert-header">
        <div class="cert-icon" [style.background]="getLevelColor(certification.level) + '22'">
          <span class="cert-emoji">{{ getLevelEmoji(certification.level) }}</span>
        </div>
        <div class="cert-level">
          <span class="level-badge" [style.background]="getLevelColor(certification.level)">
            {{ certification.level }}
          </span>
        </div>
      </div>
      
      <div class="cert-body">
        <h3 class="cert-title">{{ certification.title }}</h3>
        <p class="cert-description">{{ certification.description }}</p>
        
        <div class="cert-stats">
          <div class="stat-item">
            <span class="stat-number">{{ completedCount }}</span>
            <span class="stat-label">Complétés</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ pendingCount }}</span>
            <span class="stat-label">En Attente</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ inProgressCount }}</span>
            <span class="stat-label">En Cours</span>
          </div>
        </div>
        
        <div class="cert-footer">
          <div class="cert-score">
            <span class="score-label">Score requis:</span>
            <span class="score-value">{{ certification.passingScore }}%</span>
          </div>
          <div class="cert-actions">
            <a [routerLink]="['/certifications', certification.id]" class="cert-btn secondary">
              Voir détails
            </a>
            <button (click)="startExam()" class="cert-btn primary">
              Commencer
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cert-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 25px;
      padding: 2rem;
      box-shadow: 0 15px 40px rgba(45, 87, 87, 0.15);
      border: 2px solid rgba(45, 87, 87, 0.1);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      min-height: 320px;
      display: flex;
      flex-direction: column;
    }

    .cert-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: linear-gradient(135deg, #2D5757, #1a3a3a);
      border-radius: 25px 25px 0 0;
    }

    .cert-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 60px rgba(45, 87, 87, 0.2);
    }

    .cert-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .cert-icon {
      width: 60px;
      height: 60px;
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      position: relative;
      z-index: 1;
      transition: all 0.3s ease;
    }

    .cert-card:hover .cert-icon {
      transform: scale(1.1);
    }

    .cert-emoji {
      font-size: 2rem;
      filter: drop-shadow(0 2px 4px rgba(45, 87, 87, 0.2));
    }

    .cert-level {
      display: flex;
      align-items: center;
    }

    .level-badge {
      padding: 0.5rem 1.2rem;
      border-radius: 20px;
      color: white;
      font-weight: 700;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 12px rgba(45, 87, 87, 0.3);
    }

    .cert-body {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .cert-title {
      font-size: 1.4rem;
      font-weight: 800;
      color: #2D5757;
      margin: 0 0 1rem 0;
      line-height: 1.3;
    }

    .cert-description {
      color: #2D5757;
      opacity: 0.8;
      font-size: 0.95rem;
      line-height: 1.5;
      margin: 0 0 1.5rem 0;
      flex: 1;
    }

    .cert-stats {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      background: rgba(247, 237, 226, 0.3);
      padding: 1rem;
      border-radius: 15px;
      border: 2px solid rgba(45, 87, 87, 0.1);
    }

    .stat-item {
      flex: 1;
      text-align: center;
      padding: 0.5rem;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.6);
      transition: all 0.3s ease;
    }

    .stat-item:hover {
      background: rgba(255, 255, 255, 0.9);
      transform: translateY(-2px);
    }

    .stat-number {
      display: block;
      font-size: 1.5rem;
      font-weight: 900;
      color: #2D5757;
      margin-bottom: 0.25rem;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #2D5757;
      opacity: 0.7;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .cert-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      border-top: 2px solid rgba(247, 237, 226, 0.5);
    }

    .cert-score {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .score-label {
      font-size: 0.8rem;
      color: #2D5757;
      opacity: 0.7;
      font-weight: 600;
    }

    .score-value {
      font-size: 1.2rem;
      font-weight: 800;
      color: #2D5757;
    }

    .cert-actions {
      display: flex;
      gap: 0.75rem;
    }

    .cert-btn {
      padding: 0.75rem 1.5rem;
      border-radius: 15px;
      font-weight: 700;
      font-size: 0.9rem;
      text-decoration: none;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .cert-btn.primary {
      background: linear-gradient(135deg, #2D5757, #1a3a3a);
      color: #F7EDE2;
      box-shadow: 0 6px 20px rgba(45, 87, 87, 0.3);
    }

    .cert-btn.primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(45, 87, 87, 0.4);
    }

    .cert-btn.secondary {
      background: rgba(45, 87, 87, 0.1);
      color: #2D5757;
      border: 2px solid rgba(45, 87, 87, 0.2);
    }

    .cert-btn.secondary:hover {
      background: rgba(45, 87, 87, 0.2);
      transform: translateY(-2px);
    }

    /* Level-specific styles - adjusted to actual levels */
    .cert-card-a1::before, .cert-card-a2::before { background: linear-gradient(135deg, #26890c, #1a5c08); }
    .cert-card-b1::before, .cert-card-b2::before { background: linear-gradient(135deg, #1368ce, #0d4a8c); }
    .cert-card-c1::before, .cert-card-c2::before { background: linear-gradient(135deg, #dc2626, #b91c1c); }

    /* Responsive Design */
    @media (max-width: 768px) {
      .cert-card {
        padding: 1.5rem;
        min-height: 280px;
      }

      .cert-header {
        margin-bottom: 1rem;
      }

      .cert-icon {
        width: 50px;
        height: 50px;
        font-size: 1.5rem;
      }

      .cert-emoji {
        font-size: 1.5rem;
      }

      .cert-title {
        font-size: 1.2rem;
      }

      .cert-stats {
        gap: 0.5rem;
        padding: 0.75rem;
      }

      .stat-number {
        font-size: 1.2rem;
      }

      .cert-footer {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .cert-actions {
        justify-content: stretch;
      }

      .cert-btn {
        width: 100%;
        padding: 0.75rem 1rem;
      }
    }
  `]
})
export class CertificationCardComponent {
  @Input() certification!: Certification;
  @Input() completedCount = 0;
  @Input() pendingCount = 0;
  @Input() inProgressCount = 0;

  constructor(private router: Router) { }

  getLevelColor(level: Level): string {
    switch (level) {
      case Level.A1:
      case Level.A2:
        return '#26890c';
      case Level.B1:
      case Level.B2:
        return '#1368ce';
      case Level.C1:
      case Level.C2:
        return '#dc2626';
      default:
        return '#2D5757';
    }
  }

  getLevelEmoji(level: Level): string {
    switch (level) {
      case Level.A1:
      case Level.A2:
        return '🌱';
      case Level.B1:
      case Level.B2:
        return '🌳';
      case Level.C1:
      case Level.C2:
        return '🌲';
      default:
        return '📑';
    }
  }

  startExam(): void {
    if (this.certification.id) {
      this.router.navigate(['/certifications', this.certification.id, 'examen']);
    }
  }
}
