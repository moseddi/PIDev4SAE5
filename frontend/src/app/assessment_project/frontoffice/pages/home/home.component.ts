import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CertificationSummaryCardComponent } from '../../components/certification-summary-card.component';
import { CertificationCardComponent } from '../../components/certification-card.component';
import { CertificationService } from '../../../backoffice/services/certification.service';
import { Certification } from '../../../backoffice/models/certification.models';

/** Certification avec compteurs précalculés (évite ExpressionChangedAfterItHasBeenCheckedError) */
interface FeaturedCertification extends Certification {
  completedCount: number;
  pendingCount: number;
  inProgressCount: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, CertificationSummaryCardComponent, CertificationCardComponent],
  template: `
    <div class="home">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content">
          <span class="hero-badge">🚀 Plateforme de certification</span>
          <h1 class="hero-title">
            Obtenez vos <span class="highlight">certifications</span><br/>
            en toute confiance
          </h1>
          <p class="hero-description">
            Préparez-vous, passez vos examens et obtenez des certifications reconnues
            dans votre domaine d'expertise.
          </p>
          <div class="hero-actions">
            <button class="btn-primary">Commencer gratuitement</button>
            <button class="btn-secondary">Voir les certifications</button>
          </div>
        </div>
        <div class="hero-visual">
          <div class="visual-card card-1">
            <span>🎓</span>
            <p>Certifications</p>
          </div>
          <div class="visual-card card-2">
            <span>📝</span>
            <p>Examens</p>
          </div>
          <div class="visual-card card-3">
            <span>🏆</span>
            <p>Réussites</p>
          </div>
        </div>
      </section>

      <!-- Summary Cards Section -->
      <section class="summary-section">
        <div class="summary-header">
          <h2 class="summary-title">Tableau de bord</h2>
          <p class="summary-subtitle">Suivez votre progression et découvrez nos opportunités</p>
        </div>
        
        <div class="summary-grid" *ngIf="!loading">
          <!-- Certification Card -->
          <app-certification-summary-card
            [totalCertifications]="stats.totalCertifications"
            [completedCount]="completedCertifications"
            [pendingCount]="pendingCertifications"
            [inProgressCount]="inProgressCertifications"
          ></app-certification-summary-card>

          <!-- Career Card -->
          <div class="summary-card career-card">
            <div class="card-header">
              <div class="card-icon">
                <span>💼</span>
              </div>
              <div class="card-number-circle">
                <span class="number">{{ careerOpportunities }}</span>
              </div>
            </div>
            
            <div class="card-body">
              <h3 class="card-title">Carrière</h3>
              <p class="card-description">
                Explorez les opportunités professionnelles et développez votre carrière
              </p>
              
              <div class="card-stats">
                <div class="stat-item">
                  <span class="stat-value">{{ availableJobs }}</span>
                  <span class="stat-label">Disponibles</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ appliedJobs }}</span>
                  <span class="stat-label">Candidatures</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ interviewsCount }}</span>
                  <span class="stat-label">Entretiens</span>
                </div>
              </div>
            </div>
            
            <div class="card-footer">
              <a href="#" class="card-btn">
                Voir plus
              </a>
            </div>
          </div>

          <!-- Notification Card -->
          <div class="summary-card notification-card">
            <div class="card-header">
              <div class="card-icon">
                <span>🔔</span>
              </div>
              <div class="card-number-circle">
                <span class="number">{{ unreadNotifications }}</span>
              </div>
            </div>
            
            <div class="card-body">
              <h3 class="card-title">Notification</h3>
              <p class="card-description">
                Restez informé des dernières actualités et mises à jour importantes
              </p>
              
              <div class="card-stats">
                <div class="stat-item">
                  <span class="stat-value">{{ unreadNotifications }}</span>
                  <span class="stat-label">Non lus</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ todayNotifications }}</span>
                  <span class="stat-label">Aujourd'hui</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ weekNotifications }}</span>
                  <span class="stat-label">Cette semaine</span>
                </div>
              </div>
            </div>
            
            <div class="card-footer">
              <a href="#" class="card-btn">
                Voir plus
              </a>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div class="summary-grid" *ngIf="loading">
          <div class="skeleton-card" *ngFor="let i of [1,2,3]"></div>
        </div>
      </section>

      <!-- Featured Certifications Section -->
      <section class="featured-certifications">
        <div class="featured-header">
          <h2 class="featured-title">Certifications Populaires</h2>
          <p class="featured-subtitle">Découvrez nos certifications les plus recherchées</p>
          <button class="view-all-btn" (click)="viewAllCertifications()">
            Voir toutes les certifications →
          </button>
        </div>
        
        <div class="certifications-grid" *ngIf="!loading">
          <app-certification-card
            *ngFor="let cert of featuredCertifications"
            [certification]="cert"
            [completedCount]="cert.completedCount"
            [pendingCount]="cert.pendingCount"
            [inProgressCount]="cert.inProgressCount"
          ></app-certification-card>
        </div>

        <!-- Loading State -->
        <div class="certifications-grid" *ngIf="loading">
          <div class="skeleton-cert-card" *ngFor="let i of [1,2,3,4]"></div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .home { 
      overflow-x: hidden; 
      position: relative;
      z-index: 1;
    }
    
    /* Hero Section */
    .hero {
      min-height: calc(100vh - 70px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4rem 2rem;
      max-width: 1400px;
      margin: 0 auto;
      gap: 3rem;
      position: relative;
    }
    
    .hero::before {
      content: '';
      position: absolute;
      top: -10%;
      right: -5%;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(45, 87, 87, 0.1) 0%, transparent 70%);
      border-radius: 50%;
      animation: float 6s ease-in-out infinite;
    }
    
    .hero-content { 
      flex: 1; 
      max-width: 600px; 
      z-index: 2;
      position: relative;
    }
    
    .hero-badge {
      display: inline-block;
      background: linear-gradient(135deg, rgba(45, 87, 87, 0.1), rgba(45, 87, 87, 0.05));
      color: #2D5757;
      padding: 0.6rem 1.5rem;
      border-radius: 25px;
      font-size: 0.9rem;
      font-weight: 700;
      margin-bottom: 2rem;
      border: 2px solid rgba(45, 87, 87, 0.2);
      box-shadow: 0 4px 12px rgba(45, 87, 87, 0.1);
      animation: slideInLeft 0.8s ease-out;
    }
    
    .hero-title {
      font-size: 3.5rem;
      font-weight: 900;
      color: #2D5757;
      line-height: 1.1;
      margin: 0 0 1.5rem;
      animation: slideInLeft 1s ease-out;
    }
    
    .highlight {
      background: linear-gradient(135deg, #2D5757, #1a3a3a);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      position: relative;
      display: inline-block;
    }
    
    .highlight::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(135deg, #2D5757, #1a3a3a);
      border-radius: 2px;
    }
    
    .hero-description {
      color: #2D5757;
      font-size: 1.2rem;
      line-height: 1.6;
      margin: 0 0 2.5rem;
      opacity: 0.8;
      animation: slideInLeft 1.2s ease-out;
    }
    
    .hero-actions { 
      display: flex; 
      gap: 1.5rem; 
      flex-wrap: wrap; 
      animation: slideInLeft 1.4s ease-out;
    }
    
    .btn-primary {
      padding: 1rem 2.5rem;
      background: linear-gradient(135deg, #2D5757, #1a3a3a);
      color: #F7EDE2;
      border: none;
      border-radius: 15px;
      font-size: 1.1rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 6px 20px rgba(45, 87, 87, 0.3);
      position: relative;
      overflow: hidden;
    }
    
    .btn-primary::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(247, 237, 226, 0.2), transparent);
      transition: left 0.3s ease;
    }
    
    .btn-primary:hover::before {
      left: 100%;
    }
    
    .btn-primary:hover { 
      transform: translateY(-3px);
      box-shadow: 0 12px 30px rgba(45, 87, 87, 0.4);
    }
    
    .btn-secondary {
      padding: 1rem 2.5rem;
      background: rgba(247, 237, 226, 0.8);
      color: #2D5757;
      border: 2px solid #2D5757;
      border-radius: 15px;
      font-size: 1.1rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(45, 87, 87, 0.15);
    }
    
    .btn-secondary:hover { 
      background: #2D5757;
      color: #F7EDE2;
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(45, 87, 87, 0.3);
    }
    
    /* Visual */
    .hero-visual {
      flex: 1;
      position: relative;
      height: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
    }
    
    .visual-card {
      position: absolute;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      box-shadow: 0 12px 40px rgba(45, 87, 87, 0.15);
      font-weight: 700;
      color: #2D5757;
      border: 2px solid rgba(45, 87, 87, 0.1);
      transition: all 0.3s ease;
    }
    
    .visual-card:hover {
      transform: translateY(-5px) scale(1.05);
      box-shadow: 0 20px 50px rgba(45, 87, 87, 0.25);
    }
    
    .visual-card span { 
      font-size: 3rem; 
      filter: drop-shadow(0 4px 8px rgba(45, 87, 87, 0.2));
    }
    
    .visual-card p {
      margin: 0;
      font-size: 1rem;
      font-weight: 800;
      color: #2D5757;
    }
    
    .card-1 { 
      top: 5%; 
      left: 10%; 
      animation: float 4s ease-in-out infinite; 
      background: linear-gradient(135deg, rgba(247, 237, 226, 0.9), rgba(247, 237, 226, 0.7));
    }
    
    .card-2 { 
      top: 30%; 
      left: 45%; 
      animation: float 4s ease-in-out infinite 1s; 
      background: linear-gradient(135deg, rgba(45, 87, 87, 0.1), rgba(45, 87, 87, 0.05));
    }
    
    .card-3 { 
      top: 60%; 
      left: 20%; 
      animation: float 4s ease-in-out infinite 2s; 
      background: linear-gradient(135deg, rgba(247, 237, 226, 0.8), rgba(247, 237, 226, 0.6));
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      25% { transform: translateY(-15px) rotate(1deg); }
      50% { transform: translateY(-8px) rotate(-1deg); }
      75% { transform: translateY(-20px) rotate(2deg); }
    }
    
    @keyframes slideInLeft {
      from {
        opacity: 0;
        transform: translateX(-50px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    /* Summary Section */
    .summary-section {
      padding: 5rem 2rem;
      max-width: 1400px;
      margin: 0 auto;
      position: relative;
    }
    
    .summary-section::before {
      content: '';
      position: absolute;
      top: -50px;
      left: 50%;
      transform: translateX(-50%);
      width: 100px;
      height: 4px;
      background: linear-gradient(135deg, #2D5757, #1a3a3a);
      border-radius: 2px;
    }

    .summary-header {
      text-align: center;
      margin-bottom: 4rem;
    }

    .summary-title {
      font-size: 3rem;
      font-weight: 900;
      color: #2D5757;
      margin: 0 0 1.5rem;
      background: linear-gradient(135deg, #2D5757, #1a3a3a);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .summary-subtitle {
      color: #2D5757;
      font-size: 1.2rem;
      margin: 0;
      opacity: 0.8;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 2.5rem;
    }

    /* Featured Certifications Section */
    .featured-certifications {
      padding: 5rem 2rem;
      max-width: 1400px;
      margin: 0 auto;
      background: linear-gradient(135deg, rgba(247, 237, 226, 0.5), rgba(247, 237, 226, 0.2));
      border-radius: 25px;
      margin-top: 4rem;
      border: 2px solid rgba(45, 87, 87, 0.1);
      position: relative;
      overflow: hidden;
    }
    
    .featured-certifications::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #2D5757, #1a3a3a, #2D5757);
    }

    .featured-header {
      text-align: center;
      margin-bottom: 4rem;
    }

    .featured-title {
      font-size: 3rem;
      font-weight: 900;
      color: #2D5757;
      margin: 0 0 1.5rem;
      background: linear-gradient(135deg, #2D5757, #1a3a3a);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .featured-subtitle {
      color: #2D5757;
      font-size: 1.2rem;
      margin: 0 0 2.5rem;
      opacity: 0.8;
    }

    .view-all-btn {
      padding: 1rem 2.5rem;
      background: linear-gradient(135deg, #2D5757, #1a3a3a);
      color: #F7EDE2;
      border: none;
      border-radius: 15px;
      font-size: 1.1rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 6px 20px rgba(45, 87, 87, 0.3);
    }

    .view-all-btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 30px rgba(45, 87, 87, 0.4);
      background: linear-gradient(135deg, #1a3a3a, #2D5757);
    }

    .certifications-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2.5rem;
    }

    .skeleton-cert-card {
      height: 320px;
      border-radius: 20px;
      background: linear-gradient(90deg, rgba(247, 237, 226, 0.3) 25%, rgba(247, 237, 226, 0.1) 50%, rgba(247, 237, 226, 0.3) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border: 2px solid rgba(45, 87, 87, 0.1);
    }

    /* Career Card Styles */
    .career-card {
      background: linear-gradient(135deg, #2D5757 0%, #1a3a3a 100%);
      box-shadow: 0 12px 40px rgba(45, 87, 87, 0.3);
      border: 2px solid rgba(45, 87, 87, 0.2);
      transform: translateY(0);
      transition: all 0.3s ease;
    }
    
    .career-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 50px rgba(45, 87, 87, 0.4);
    }

    /* Notification Card Styles */
    .notification-card {
      background: linear-gradient(135deg, rgba(247, 237, 226, 0.9) 0%, rgba(247, 237, 226, 0.7) 100%);
      border: 2px solid rgba(45, 87, 87, 0.2);
      box-shadow: 0 12px 40px rgba(45, 87, 87, 0.15);
      color: #2D5757;
      transform: translateY(0);
      transition: all 0.3s ease;
    }
    
    .notification-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 50px rgba(45, 87, 87, 0.25);
    }

    /* Skeleton Loading */
    .skeleton-card {
      height: 320px;
      border-radius: 20px;
      background: linear-gradient(90deg, rgba(247, 237, 226, 0.3) 25%, rgba(247, 237, 226, 0.1) 50%, rgba(247, 237, 226, 0.3) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border: 2px solid rgba(45, 87, 87, 0.1);
    }

    @keyframes shimmer {
      0% { background-position: 200% }
      100% { background-position: -200% }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .hero {
        flex-direction: column;
        padding: 2rem 1rem;
        text-align: center;
        min-height: auto;
      }

      .hero-title {
        font-size: 2.5rem;
      }

      .hero-visual {
        height: 300px;
        margin-top: 2rem;
      }

      .summary-section {
        padding: 3rem 1rem;
      }

      .summary-title {
        font-size: 2.2rem;
      }

      .summary-grid {
        grid-template-columns: 1fr;
        gap: 2rem;
      }

      .featured-certifications {
        padding: 3rem 1rem;
        margin-top: 3rem;
      }

      .featured-title {
        font-size: 2.2rem;
      }

      .certifications-grid {
        grid-template-columns: 1fr;
        gap: 2rem;
      }

      .view-all-btn {
        width: 100%;
        margin-top: 1.5rem;
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  loading = true;
  stats = {
    totalCertifications: 0,
    totalExams: 0,
    totalQuestions: 0,
    totalResults: 0,
    passRate: 0
  };

  // Certification stats
  completedCertifications = 0;
  pendingCertifications = 0;
  inProgressCertifications = 0;

  // Featured certifications (compteurs précalculés pour éviter NG0100)
  featuredCertifications: FeaturedCertification[] = [];

  // Career stats
  careerOpportunities = 0;
  availableJobs = 0;
  appliedJobs = 0;
  interviewsCount = 0;

  // Notification stats
  unreadNotifications = 0;
  todayNotifications = 0;
  weekNotifications = 0;

  constructor(
    private certificationService: CertificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.certificationService.getAll().subscribe({
      next: (certs) => {
        this.stats.totalCertifications = certs.length;
        const totalExams = certs.reduce((acc, c) => acc + (c.exams?.length ?? 0), 0);
        this.stats.totalExams = totalExams;

        // Featured certifications avec compteurs fixés une seule fois (évite NG0100)
        this.featuredCertifications = certs.slice(0, 4).map(c => ({
          ...c,
          completedCount: Math.floor(Math.random() * 15) + 5,
          pendingCount: Math.floor(Math.random() * 8) + 2,
          inProgressCount: Math.floor(Math.random() * 6) + 1
        }));

        // Generate mock stats
        this.completedCertifications = Math.floor(Math.random() * 20) + 5;
        this.pendingCertifications = Math.floor(Math.random() * 10) + 2;
        this.inProgressCertifications = Math.floor(Math.random() * 8) + 1;
        this.careerOpportunities = Math.floor(Math.random() * 15) + 5;
        this.availableJobs = Math.floor(Math.random() * 10) + 3;
        this.appliedJobs = Math.floor(Math.random() * 8) + 1;
        this.interviewsCount = Math.floor(Math.random() * 5) + 1;
        this.unreadNotifications = Math.floor(Math.random() * 12) + 3;
        this.todayNotifications = Math.floor(Math.random() * 5) + 1;
        this.weekNotifications = Math.floor(Math.random() * 10) + 2;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  viewAllCertifications(): void {
    this.router.navigate(['/certifications']);
  }
}
