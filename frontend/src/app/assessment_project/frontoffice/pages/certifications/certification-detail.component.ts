import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CertificationService } from '../../../backoffice/services/certification.service';
import { Certification } from '../../../backoffice/models/certification.models';

@Component({
  selector: 'app-certification-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="certification-detail">
      <div class="detail-header">
        <button class="back-btn" (click)="goBack()">← Retour</button>
        <div class="detail-breadcrumb">
          <span>Accueil</span>
          <span class="separator">/</span>
          <span>Certifications</span>
          <span class="separator">/</span>
          <span class="current">{{ certification?.title }}</span>
        </div>
      </div>

      <div class="detail-content" *ngIf="!loading && certification">
        <div class="cert-main">
          <div class="cert-header-card">
            <div class="cert-level-badge" [style.background]="getLevelColor(certification.level)">
              {{ certification.level }}
            </div>
            <h1 class="cert-title">{{ certification.title }}</h1>
            <p class="cert-description">{{ certification.description }}</p>
            
            <div class="cert-meta">
              <div class="meta-item">
                <span class="meta-label">Score requis:</span>
                <span class="meta-value">{{ certification.passingScore }}%</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Durée estimée:</span>
                <span class="meta-value">2-3 heures</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Niveau:</span>
                <span class="meta-value">{{ getLevelDescription(certification.level) }}</span>
              </div>
            </div>

            <div class="cert-actions">
              <button class="btn-primary" (click)="startCertification()">
                Commencer la certification
              </button>
              <button class="btn-secondary">
                Télécharger le programme
              </button>
            </div>
          </div>

          <div class="cert-stats-grid">
            <div class="stat-card">
              <span class="stat-number">{{ completedCount }}</span>
              <span class="stat-label">Candidats réussis</span>
            </div>
            <div class="stat-card">
              <span class="stat-number">{{ successRate }}%</span>
              <span class="stat-label">Taux de réussite</span>
            </div>
            <div class="stat-card">
              <span class="stat-number">{{ averageScore }}%</span>
              <span class="stat-label">Score moyen</span>
            </div>
            <div class="stat-card">
              <span class="stat-number">{{ duration }}h</span>
              <span class="stat-label">Durée moyenne</span>
            </div>
          </div>
        </div>

        <div class="cert-sidebar">
          <div class="sidebar-card">
            <h3>Contenu de la certification</h3>
            <ul class="content-list">
              <li>Module 1: Introduction et concepts de base</li>
              <li>Module 2: Pratique et applications</li>
              <li>Module 3: Cas pratiques et scénarios</li>
              <li>Module 4: Évaluation finale</li>
            </ul>
          </div>

          <div class="sidebar-card">
            <h3>Prérequis</h3>
            <ul class="prerequisites-list">
              <li>Connaissances de base en informatique</li>
              <li>Maîtrise des outils bureautiques</li>
              <li>Motivation et engagement</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="loading">
        <div class="loading-spinner"></div>
        <p>Chargement de la certification...</p>
      </div>

      <!-- Error State -->
      <div class="error-state" *ngIf="!loading && !certification">
        <div class="error-icon">❌</div>
        <h3>Certification non trouvée</h3>
        <p>La certification que vous recherchez n'existe pas ou a été supprimée.</p>
        <button class="btn-primary" (click)="goBack()">Retour aux certifications</button>
      </div>
    </div>
  `,
  styles: [`
    .certification-detail {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .detail-header {
      margin-bottom: 2rem;
    }

    .back-btn {
      background: none;
      border: none;
      color: #3b82f6;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      margin-bottom: 1rem;
      transition: color 0.2s;
    }

    .back-btn:hover {
      color: #2563eb;
    }

    .detail-breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #64748b;
      font-size: 0.9rem;
    }

    .separator {
      color: #cbd5e1;
    }

    .current {
      color: #1e293b;
      font-weight: 600;
    }

    .detail-content {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 2rem;
    }

    .cert-main {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .cert-header-card {
      background: #fff;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      border: 1px solid #f1f5f9;
    }

    .cert-level-badge {
      display: inline-block;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 1rem;
    }

    .cert-title {
      font-size: 2rem;
      font-weight: 800;
      color: #1e293b;
      margin: 0 0 1rem;
    }

    .cert-description {
      color: #64748b;
      font-size: 1.1rem;
      line-height: 1.7;
      margin: 0 0 2rem;
    }

    .cert-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: #f8fafc;
      border-radius: 12px;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .meta-label {
      font-size: 0.85rem;
      color: #64748b;
      font-weight: 500;
    }

    .meta-value {
      font-size: 1rem;
      color: #1e293b;
      font-weight: 700;
    }

    .cert-actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .btn-primary {
      padding: 0.85rem 2rem;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      color: #fff;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.2s;
    }

    .btn-primary:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    .btn-secondary {
      padding: 0.85rem 2rem;
      background: #fff;
      color: #3b82f6;
      border: 1.5px solid #3b82f6;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-secondary:hover {
      background: #eff6ff;
    }

    .cert-stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      background: #fff;
      padding: 1.5rem;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      border: 1px solid #f1f5f9;
    }

    .stat-number {
      display: block;
      font-size: 1.8rem;
      font-weight: 800;
      color: #3b82f6;
      margin-bottom: 0.5rem;
    }

    .stat-label {
      font-size: 0.8rem;
      color: #64748b;
      font-weight: 500;
    }

    .cert-sidebar {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .sidebar-card {
      background: #fff;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      border: 1px solid #f1f5f9;
    }

    .sidebar-card h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 1rem;
    }

    .content-list, .prerequisites-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .content-list li, .prerequisites-list li {
      padding: 0.5rem 0;
      color: #64748b;
      font-size: 0.9rem;
      position: relative;
      padding-left: 1.5rem;
    }

    .content-list li::before, .prerequisites-list li::before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: 700;
    }

    .loading-state, .error-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #64748b;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f1f5f9;
      border-top: 3px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .error-state h3 {
      font-size: 1.5rem;
      color: #1e293b;
      margin: 0 0 1rem;
    }

    @media (max-width: 768px) {
      .certification-detail {
        padding: 1rem;
      }

      .detail-content {
        grid-template-columns: 1fr;
      }

      .cert-title {
        font-size: 1.5rem;
      }

      .cert-meta {
        grid-template-columns: 1fr;
      }

      .cert-actions {
        flex-direction: column;
      }

      .cert-stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class CertificationDetailComponent implements OnInit {
  certification: Certification | null = null;
  loading = true;

  // Mock data for demonstration
  completedCount = 156;
  successRate = 78;
  averageScore = 82;
  duration = 2.5;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private certificationService: CertificationService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCertification(+id);
    } else {
      this.loading = false;
    }
  }

  loadCertification(id: number): void {
    this.certificationService.getById(id).subscribe({
      next: (cert) => {
        this.certification = cert;
        this.loading = false;
      },
      error: () => {
        this.certification = null;
        this.loading = false;
      }
    });
  }

  getLevelColor(level: string): string {
    const colors = {
      'A1': '#0ea5e9',
      'A2': '#10b981',
      'B1': '#f59e0b',
      'B2': '#f97316',
      'C1': '#8b5cf6',
      'C2': '#ec4899'
    };
    return colors[level as keyof typeof colors] || '#64748b';
  }

  getLevelDescription(level: string): string {
    const descriptions = {
      'A1': 'Débutant',
      'A2': 'Élémentaire',
      'B1': 'Intermédiaire',
      'B2': 'Intermédiaire avancé',
      'C1': 'Avancé',
      'C2': 'Maîtrise'
    };
    return descriptions[level as keyof typeof descriptions] || level;
  }

  startCertification(): void {
    if (this.certification) {
      this.router.navigate(['/certifications', this.certification.id, 'examen']);
    }
  }

  goBack(): void {
    this.router.navigate(['/certifications']);
  }
}
