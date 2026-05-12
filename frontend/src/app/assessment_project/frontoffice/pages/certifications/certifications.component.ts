import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Certification, Level, CertificationResult, CertificationExam } from '../../../backoffice/models/certification.models';
import { CertificationService } from '../../../backoffice/services/certification.service';
import { ResultService } from '../../../backoffice/services/result.service';
import { ExamService } from '../../../backoffice/services/exam.service';
import { AuthService } from '../../../shared/services/auth.service';
import { forkJoin, of, catchError } from 'rxjs';

interface UserCertification extends Certification {
  isCompleted?: boolean;
  isInProgress?: boolean;
  progress?: number;
  score?: number;
}

@Component({
  selector: 'app-certifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="certifications-page">
      <div class="cert-header">
        <div class="header-content">
          <h1>🎓 Certifications</h1>
          <p>Explorez nos certifications et validez vos compétences linguistiques</p>
        </div>
        <div class="header-actions">
          <div class="search-container">
            <input [(ngModel)]="searchTerm" (ngModelChange)="filterCertifications()" placeholder="Rechercher..." class="search-input">
            <span class="search-icon">🔍</span>
          </div>
          <select [(ngModel)]="selectedLevel" (ngModelChange)="filterCertifications()" class="filter-select">
            <option value="">Tous les niveaux</option>
            <option *ngFor="let level of levelOptions" [value]="level">{{ getLevelDisplay(level) }}</option>
          </select>
        </div>
      </div>

      <div class="cert-stats">
        <div class="stat-card">
          <div class="stat-icon">📚</div>
          <div class="stat-content">
            <h3>{{ totalCertifications }}</h3>
            <p>Certifications</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <h3>{{ completedCertifications }}</h3>
            <p>Terminées</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏳</div>
          <div class="stat-content">
            <h3>{{ inProgressCertifications }}</h3>
            <p>En cours</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🏆</div>
          <div class="stat-content">
            <h3>{{ averageScore }}%</h3>
            <p>Score moyen</p>
          </div>
        </div>
      </div>

      <div class="diagnostic-section">
        <div class="diagnostic-toggle">
          <h3>🔍 Évaluation Diagnostic</h3>
          <p>Testez votre niveau actuel et découvrez la certification idéale</p>
          <button class="diagnostic-btn" (click)="startDiagnostic()">Commencer</button>
        </div>
      </div>

      <div class="loading-state" *ngIf="loading">
        <div class="loading-card" *ngFor="let i of [1,2,3,4,5,6]"></div>
      </div>

      <div class="cert-grid" *ngIf="!loading">
        <div *ngFor="let cert of filteredCertifications" class="cert-card" [class.completed]="cert.isCompleted" [class.in-progress]="cert.isInProgress" (click)="viewDetails(cert)">
          <div class="cert-header">
            <div class="cert-level">{{ getLevelDisplay(cert.level) }}</div>
            <div class="cert-status">
              <span *ngIf="cert.isCompleted" class="status-badge completed">✅ Terminée</span>
              <span *ngIf="cert.isInProgress" class="status-badge in-progress">⏳ En cours</span>
              <span *ngIf="!cert.isCompleted && !cert.isInProgress" class="status-badge available">🆕 Disponible</span>
            </div>
          </div>
          
          <div class="cert-content">
            <h3>{{ cert.title }}</h3>
            <p>{{ cert.description }}</p>
            
            <div class="cert-details">
              <div class="detail-item">
                <span class="detail-icon">⏱️</span>
                <span>{{ cert.duration || 60 }} minutes</span>
              </div>
              <div class="detail-item">
                <span class="detail-icon">📝</span>
                <span>{{ cert.questionCount || 20 }} questions</span>
              </div>
              <div class="detail-item">
                <span class="detail-icon">🎯</span>
                <span>{{ cert.passingScore }}% requis</span>
              </div>
            </div>
          </div>

          <div class="cert-footer">
            <div class="cert-progress" *ngIf="cert.isInProgress">
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="cert.progress || 0"></div>
              </div>
              <span class="progress-text">{{ cert.progress || 0 }}% complété</span>
            </div>
            
            <div class="cert-actions">
              <button *ngIf="!cert.isCompleted && !cert.isInProgress" class="action-btn primary" (click)="$event.stopPropagation(); startExam(cert)">Commencer</button>
              <button *ngIf="cert.isInProgress" class="action-btn secondary" (click)="$event.stopPropagation(); continueExam(cert)">Continuer</button>
              <button *ngIf="cert.isCompleted" class="action-btn secondary" (click)="$event.stopPropagation(); viewCertificate(cert)">Voir</button>
            </div>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="!loading && filteredCertifications.length === 0">
        <div class="empty-icon">🔍</div>
        <h3>Aucune certification trouvée</h3>
        <p>Essayez de modifier vos critères</p>
        <button class="action-btn primary" (click)="clearFilters()">Effacer</button>
      </div>
    </div>
  `,
  styles: [`
    .certifications-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #F7EDE2 0%, rgba(45, 87, 87, 0.05) 100%);
      padding: 2rem;
      position: relative;
    }
    
    .cert-page::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at 10% 20%, rgba(45, 87, 87, 0.05) 0%, transparent 50%);
      pointer-events: none;
      z-index: 0;
    }

    .cert-header {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 25px;
      padding: 2.5rem;
      margin-bottom: 3rem;
      box-shadow: 0 12px 40px rgba(45, 87, 87, 0.1);
      border: 2px solid rgba(45, 87, 87, 0.1);
      position: relative;
      z-index: 1;
    }
    
    .cert-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #2D5757, #1a3a3a, #2D5757);
      border-radius: 25px 25px 0 0;
    }

    .header-content {
      margin-bottom: 2rem;
      text-align: center;
    }

    .header-content h1 {
      margin: 0 0 0.75rem 0;
      color: #2D5757;
      font-size: 2.8rem;
      font-weight: 900;
      background: linear-gradient(135deg, #2D5757, #1a3a3a);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .header-content p {
      margin: 0;
      color: #2D5757;
      font-size: 1.2rem;
      opacity: 0.8;
      font-weight: 500;
    }

    .search-input {
      width: 100%;
      padding: 1rem 1.25rem 1rem 3.5rem;
      border: 2px solid rgba(45, 87, 87, 0.2);
      border-radius: 15px;
      font-size: 1rem;
      background: rgba(247, 237, 226, 0.5);
      color: #2D5757;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(45, 87, 87, 0.08);
    }

    .cert-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }

    .stat-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 2rem;
      display: flex;
      align-items: center;
      gap: 1.5rem;
      box-shadow: 0 8px 25px rgba(45, 87, 87, 0.1);
      border: 2px solid rgba(45, 87, 87, 0.1);
      transition: all 0.3s ease;
    }
    
    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 35px rgba(45, 87, 87, 0.2);
    }

    .diagnostic-section {
      background: linear-gradient(135deg, #2D5757, #1a3a3a);
      border-radius: 25px;
      padding: 3rem;
      margin-bottom: 3rem;
      text-align: center;
      box-shadow: 0 12px 40px rgba(45, 87, 87, 0.3);
    }

    .diagnostic-toggle h3 {
      margin: 0 0 1rem 0;
      color: #F7EDE2;
      font-size: 1.8rem;
      font-weight: 800;
    }

    .diagnostic-btn {
      padding: 1rem 2.5rem;
      background: rgba(247, 237, 226, 0.9);
      color: #2D5757;
      border: 2px solid #F7EDE2;
      border-radius: 15px;
      font-size: 1.1rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .cert-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 2.5rem;
    }

    .cert-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 2rem;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 8px 25px rgba(45, 87, 87, 0.1);
      border: 2px solid rgba(45, 87, 87, 0.1);
    }
    
    .cert-card:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow: 0 20px 40px rgba(45, 87, 87, 0.2);
    }

    .action-btn {
      padding: 0.8rem 1rem;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
      border: none;
    }
    
    .action-btn.primary {
      background: linear-gradient(135deg, #2D5757, #1a3a3a);
      color: #F7EDE2;
      box-shadow: 0 4px 12px rgba(45, 87, 87, 0.3);
    }
    
    .action-btn.secondary {
      background: rgba(45, 87, 87, 0.1);
      color: #2D5757;
      border: 2px solid rgba(45, 87, 87, 0.2);
    }
  `]
})
export class CertificationsComponent implements OnInit {
  loading = true;
  certifications: UserCertification[] = [];
  filteredCertifications: UserCertification[] = [];
  searchTerm = '';
  selectedLevel = '';
  levelOptions = Object.values(Level);

  totalCertifications = 0;
  completedCertifications = 0;
  inProgressCertifications = 0;
  averageScore = 0;

  constructor(
    private certificationService: CertificationService,
    private resultService: ResultService,
    private examService: ExamService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCertifications();
  }

  loadCertifications(): void {
    const userId = this.authService.getCurrentUser()?.id ?? 0;
    this.loading = true;

    forkJoin({
      certs: this.certificationService.getAll(),
      results: this.resultService.getByUser(userId).pipe(catchError(() => of([]))),
      exams: this.examService.getAll().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ certs, results, exams }: { certs: Certification[], results: CertificationResult[], exams: CertificationExam[] }) => {
        this.certifications = certs.map((cert: Certification) => {
          // Utilisation de == pour éviter les problèmes de type string/number
          const userResults = results.filter((r: CertificationResult) =>
            r.certificationId == cert.id ||
            (r as any).certification_id == cert.id ||
            r.certification?.id == cert.id);

          const isCompleted = userResults.some(r => r.passed);
          const bestResult = userResults.length > 0
            ? userResults.reduce((prev: CertificationResult, current: CertificationResult) => (prev.score > current.score) ? prev : current)
            : null;

          const certExam = exams.find((e: CertificationExam) =>
            e.certificationId == cert.id ||
            (e as any).certification_id == cert.id ||
            e.certification?.id == cert.id);

          return {
            ...cert,
            isCompleted: isCompleted,
            isInProgress: !isCompleted && userResults.length > 0,
            progress: isCompleted ? 100 : (userResults.length > 0 ? 50 : 0),
            score: bestResult ? bestResult.score : 0,
            duration: certExam ? certExam.duration : (cert.duration || 60),
            questionCount: cert.questionCount || 20
          };
        });

        this.filteredCertifications = [...this.certifications];
        this.calculateStatistics();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading certifications:', err);
        this.loading = false;
      }
    });
  }

  // Les données sont maintenant réelles, donc on n'a plus besoin du mock aléatoire

  calculateStatistics(): void {
    this.totalCertifications = this.certifications.length;
    this.completedCertifications = this.certifications.filter(c => c.isCompleted).length;
    this.inProgressCertifications = this.certifications.filter(c => c.isInProgress).length;

    const completedScores = this.certifications
      .filter(c => c.isCompleted && c.score)
      .map(c => c.score!);

    this.averageScore = completedScores.length > 0
      ? Math.round(completedScores.reduce((a, b) => a + b, 0) / completedScores.length)
      : 0;
  }

  filterCertifications(): void {
    this.filteredCertifications = this.certifications.filter(cert => {
      const matchesSearch = cert.title.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesLevel = !this.selectedLevel || cert.level === this.selectedLevel;
      return matchesSearch && matchesLevel;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedLevel = '';
    this.filteredCertifications = [...this.certifications];
  }

  getLevelDisplay(level: Level): string {
    switch (level) {
      case Level.A1: return 'Débutant (A1)';
      case Level.A2: return 'Élémentaire (A2)';
      case Level.B1: return 'Intermédiaire (B1)';
      case Level.B2: return 'Avancé (B2)';
      case Level.C1: return 'Expert (C1)';
      case Level.C2: return 'Maîtrise (C2)';
      default: return level;
    }
  }

  viewDetails(cert: UserCertification): void {
    this.router.navigate(['/certifications', cert.id]);
  }

  startExam(cert: UserCertification): void {
    this.router.navigate(['/certifications', cert.id, 'examen']);
  }

  continueExam(cert: UserCertification): void {
    this.router.navigate(['/certifications', cert.id, 'examen']);
  }

  viewCertificate(cert: UserCertification): void {
    console.log('Viewing certificate for:', cert.title);
  }

  startDiagnostic(): void {
    console.log('Starting diagnostic test');
  }
}
