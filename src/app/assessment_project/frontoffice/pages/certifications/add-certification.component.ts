import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Certification, Level } from '../../../backoffice/models/certification.models';
import { CertificationService } from '../../../backoffice/services/certification.service';

@Component({
  selector: 'app-add-certification',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="add-certification-page">
      <div class="form-header">
        <button class="back-btn" (click)="goBack()">← Retour aux certifications</button>
        <h1>Ajouter une Certification</h1>
        <p>Créez une nouvelle certification pour votre plateforme</p>
      </div>

      <div class="form-container">
        <form [formGroup]="certificationForm" (ngSubmit)="onSubmit()" class="certification-form">
          <!-- Title -->
          <div class="form-group">
            <label for="title">Titre de la certification *</label>
            <input 
              id="title"
              type="text" 
              formControlName="title" 
              placeholder="ex: Certification Anglais B2"
              class="form-input"
              [class.error]="titleControl?.invalid && titleControl?.touched"
            >
            <div class="error-message" *ngIf="titleControl?.invalid && titleControl?.touched">
              <span *ngIf="titleControl?.errors?.['required']">Le titre est obligatoire</span>
              <span *ngIf="titleControl?.errors?.['minlength']">Minimum 3 caractères</span>
            </div>
          </div>

          <!-- Level -->
          <div class="form-group">
            <label for="level">Niveau *</label>
            <select 
              id="level"
              formControlName="level" 
              class="form-select"
              [class.error]="levelControl?.invalid && levelControl?.touched"
            >
              <option value="">Sélectionner un niveau</option>
              <option *ngFor="let level of levels" [value]="level">{{ getLevelLabel(level) }}</option>
            </select>
            <div class="error-message" *ngIf="levelControl?.invalid && levelControl?.touched">
              <span>Le niveau est obligatoire</span>
            </div>
          </div>

          <!-- Description -->
          <div class="form-group">
            <label for="description">Description *</label>
            <textarea 
              id="description"
              formControlName="description" 
              placeholder="Décrivez la certification, les prérequis, les objectifs..."
              rows="4"
              class="form-textarea"
              [class.error]="descriptionControl?.invalid && descriptionControl?.touched"
            ></textarea>
            <div class="error-message" *ngIf="descriptionControl?.invalid && descriptionControl?.touched">
              <span *ngIf="descriptionControl?.errors?.['required']">La description est obligatoire</span>
              <span *ngIf="descriptionControl?.errors?.['minlength']">Minimum 10 caractères</span>
            </div>
          </div>

          <!-- Passing Score -->
          <div class="form-group">
            <label for="passingScore">Score de réussite (%) *</label>
            <input 
              id="passingScore"
              type="number" 
              formControlName="passingScore" 
              min="0"
              max="100"
              placeholder="70"
              class="form-input"
              [class.error]="passingScoreControl?.invalid && passingScoreControl?.touched"
            >
            <div class="error-message" *ngIf="passingScoreControl?.invalid && passingScoreControl?.touched">
              <span *ngIf="passingScoreControl?.errors?.['required']">Le score est obligatoire</span>
              <span *ngIf="passingScoreControl?.errors?.['min']">Minimum 0%</span>
              <span *ngIf="passingScoreControl?.errors?.['max']">Maximum 100%</span>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button type="button" class="btn-cancel" (click)="goBack()">
              Annuler
            </button>
            <button type="submit" class="btn-submit" [disabled]="certificationForm.invalid || loading">
              <span *ngIf="!loading">Créer la certification</span>
              <span *ngIf="loading">Création en cours...</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Success Message -->
      <div class="success-message" *ngIf="successMessage">
        <div class="success-icon">✅</div>
        <div class="success-text">{{ successMessage }}</div>
      </div>

      <!-- Error Message -->
      <div class="error-message-global" *ngIf="errorMessage">
        <div class="error-icon">❌</div>
        <div class="error-text">{{ errorMessage }}</div>
      </div>
    </div>
  `,
  styles: [`
    .add-certification-page {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      min-height: 100vh;
    }

    .form-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .back-btn {
      position: absolute;
      top: 2rem;
      left: 2rem;
      padding: 0.5rem 1rem;
      background: #f8fafc;
      color: #64748b;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .back-btn:hover {
      background: #e2e8f0;
      color: #475569;
    }

    .form-header h1 {
      font-size: 2rem;
      font-weight: 800;
      color: #1e293b;
      margin: 0 0 0.5rem;
    }

    .form-header p {
      color: #64748b;
      margin: 0;
      font-size: 1rem;
    }

    .form-container {
      background: white;
      border-radius: 16px;
      padding: 2.5rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      border: 1px solid #f1f5f9;
    }

    .certification-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group label {
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.9rem;
    }

    .form-input, .form-select, .form-textarea {
      padding: 0.75rem 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.2s ease;
      background: #ffffff;
    }

    .form-input:focus, .form-select:focus, .form-textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-input.error, .form-select.error, .form-textarea.error {
      border-color: #ef4444;
      background: #fef2f2;
    }

    .form-textarea {
      resize: vertical;
      min-height: 100px;
    }

    .error-message {
      color: #ef4444;
      font-size: 0.85rem;
      margin-top: 0.25rem;
      font-weight: 500;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }

    .btn-cancel, .btn-submit {
      padding: 0.75rem 2rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      flex: 1;
    }

    .btn-cancel {
      background: #f8fafc;
      color: #64748b;
      border: 1px solid #e2e8f0;
    }

    .btn-cancel:hover {
      background: #e2e8f0;
      color: #475569;
    }

    .btn-submit {
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      color: white;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .btn-submit:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
    }

    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .success-message, .error-message-global {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      margin-top: 1rem;
    }

    .success-message {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
    }

    .error-message-global {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
    }

    .success-icon, .error-icon {
      font-size: 1.5rem;
    }

    .success-text, .error-text {
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .add-certification-page {
        padding: 1rem;
      }

      .form-container {
        padding: 1.5rem;
      }

      .form-actions {
        flex-direction: column;
      }

      .back-btn {
        position: static;
        margin-bottom: 1rem;
        width: 100%;
      }
    }
  `]
})
export class AddCertificationComponent implements OnInit {
  certificationForm: FormGroup;
  loading = false;
  successMessage = '';
  errorMessage = '';
  levels = Object.values(Level);

  constructor(
    private fb: FormBuilder,
    private certificationService: CertificationService,
    private router: Router
  ) {
    this.certificationForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      level: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]],
      passingScore: [70, [Validators.required, Validators.min(0), Validators.max(100)]]
    });
  }

  ngOnInit(): void {
    // Le formulaire est déjà initialisé dans le constructeur
  }

  get titleControl() {
    return this.certificationForm.get('title');
  }

  get levelControl() {
    return this.certificationForm.get('level');
  }

  get descriptionControl() {
    return this.certificationForm.get('description');
  }

  get passingScoreControl() {
    return this.certificationForm.get('passingScore');
  }

  getLevelLabel(level: Level): string {
    const labels = {
      [Level.A1]: 'A1 - Débutant',
      [Level.A2]: 'A2 - Élémentaire',
      [Level.B1]: 'B1 - Intermédiaire',
      [Level.B2]: 'B2 - Intermédiaire avancé',
      [Level.C1]: 'C1 - Avancé',
      [Level.C2]: 'C2 - Maîtrise'
    };
    return labels[level] || level;
  }

  onSubmit(): void {
    if (this.certificationForm.invalid) {
      this.markFormAsTouched();
      return;
    }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const certificationData: Certification = {
      ...this.certificationForm.value,
      id: 0 // Sera généré par le backend
    };

    this.certificationService.create(certificationData).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = '✅ Certification créée avec succès!';

        // Rediriger après 2 secondes
        setTimeout(() => {
          this.router.navigate(['/certifications']);
        }, 2000);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = '❌ Erreur lors de la création de la certification. Veuillez réessayer.';
        console.error('Error creating certification:', error);
      }
    });
  }

  private markFormAsTouched(): void {
    Object.keys(this.certificationForm.controls).forEach(key => {
      const control = this.certificationForm.get(key);
      control?.markAsTouched();
    });
  }

  goBack(): void {
    this.router.navigate(['/certifications']);
  }
}
