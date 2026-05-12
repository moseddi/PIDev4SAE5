import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-certification-summary-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="summary-card certification-card">
      <div class="card-header">
        <div class="card-icon">
          <span>🎓</span>
        </div>
        <div class="card-number-circle">
          <span class="number">{{ totalCertifications }}</span>
        </div>
      </div>
      
      <div class="card-body">
        <h3 class="card-title">Certification</h3>
        <p class="card-description">
          Obtenez des certifications reconnues et validez vos compétences
        </p>
        
        <div class="card-stats">
          <div class="stat-item">
            <span class="stat-value">{{ completedCount }}</span>
            <span class="stat-label">Complétés</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ pendingCount }}</span>
            <span class="stat-label">En Attente</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ inProgressCount }}</span>
            <span class="stat-label">En Cours</span>
          </div>
        </div>
      </div>
      
      <div class="card-footer">
        <a routerLink="/certifications" class="card-btn">
          Voir plus
        </a>
      </div>
    </div>
  `,
  styles: [`
    .summary-card {
      background: linear-gradient(135deg, #2D5757, #1a3a3a);
      border-radius: 25px;
      padding: 2rem;
      color: #F7EDE2;
      position: relative;
      overflow: hidden;
      min-height: 320px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 15px 40px rgba(45, 87, 87, 0.25);
      transition: all 0.3s ease;
      border: 2px solid rgba(247, 237, 226, 0.1);
    }

    .certification-card {
      background: linear-gradient(135deg, #2D5757, #1a3a3a);
      box-shadow: 0 15px 40px rgba(45, 87, 87, 0.25);
    }

    .summary-card::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(247, 237, 226, 0.1) 0%, transparent 70%);
      animation: float 6s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      50% { transform: translate(-20px, -20px) rotate(180deg); }
    }

    .summary-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 60px rgba(45, 87, 87, 0.35);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      position: relative;
      z-index: 1;
    }

    .card-icon {
      width: 60px;
      height: 60px;
      background: rgba(247, 237, 226, 0.2);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      transition: all 0.3s ease;
    }

    .summary-card:hover .card-icon {
      transform: scale(1.1) rotate(5deg);
      background: rgba(247, 237, 226, 0.25);
    }

    .card-number-circle {
      width: 50px;
      height: 50px;
      background: rgba(247, 237, 226, 0.25);
      backdrop-filter: blur(10px);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 1.3rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }

    .summary-card:hover .card-number-circle {
      transform: scale(1.1);
      background: rgba(247, 237, 226, 0.3);
    }

    .card-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      position: relative;
      z-index: 1;
    }

    .card-title {
      font-size: 1.6rem;
      font-weight: 900;
      margin: 0 0 1rem 0;
      background: linear-gradient(135deg, #F7EDE2, rgba(247, 237, 226, 0.8));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .card-description {
      font-size: 1rem;
      opacity: 0.9;
      line-height: 1.5;
      margin: 0 0 2rem 0;
      font-weight: 600;
    }

    .card-stats {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-item {
      flex: 1;
      text-align: center;
      padding: 1rem;
      background: rgba(247, 237, 226, 0.15);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      border: 2px solid rgba(247, 237, 226, 0.2);
      transition: all 0.3s ease;
    }

    .stat-item:hover {
      background: rgba(247, 237, 226, 0.25);
      transform: translateY(-3px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
    }

    .stat-value {
      display: block;
      font-size: 1.8rem;
      font-weight: 900;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #F7EDE2, rgba(247, 237, 226, 0.8));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .stat-label {
      font-size: 0.8rem;
      opacity: 0.8;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .card-footer {
      margin-top: auto;
      position: relative;
      z-index: 1;
    }

    .card-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 1rem 2rem;
      background: rgba(247, 237, 226, 0.2);
      backdrop-filter: blur(10px);
      color: #F7EDE2;
      text-decoration: none;
      border-radius: 15px;
      font-weight: 700;
      font-size: 1rem;
      border: 2px solid rgba(247, 237, 226, 0.3);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .card-btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(247, 237, 226, 0.2), transparent);
      transition: left 0.5s ease;
    }

    .card-btn:hover {
      background: rgba(247, 237, 226, 0.3);
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      border-color: rgba(247, 237, 226, 0.4);
    }

    .card-btn:hover::before {
      left: 100%;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .summary-card {
        padding: 1.5rem;
        min-height: 280px;
      }

      .card-header {
        margin-bottom: 1rem;
      }

      .card-icon {
        width: 50px;
        height: 50px;
        font-size: 1.5rem;
      }

      .card-number-circle {
        width: 40px;
        height: 40px;
        font-size: 1.1rem;
      }

      .card-title {
        font-size: 1.4rem;
      }

      .card-description {
        font-size: 0.9rem;
        margin-bottom: 1.5rem;
      }

      .card-stats {
        gap: 0.75rem;
        margin-bottom: 1rem;
      }

      .stat-item {
        padding: 0.75rem;
      }

      .stat-value {
        font-size: 1.5rem;
      }

      .stat-label {
        font-size: 0.7rem;
      }

      .card-btn {
        padding: 0.875rem 1.5rem;
        font-size: 0.9rem;
      }
    }
  `]
})
export class CertificationSummaryCardComponent {
  @Input() totalCertifications = 0;
  @Input() completedCount = 0;
  @Input() pendingCount = 0;
  @Input() inProgressCount = 0;
}
