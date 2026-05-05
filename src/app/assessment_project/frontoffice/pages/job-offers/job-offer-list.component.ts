import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ApplicationService } from '../../../backoffice/services/application.service';
import { AuthService } from '../../../shared/services/auth.service';
import { JobOffer, Level, ApplicationStatus } from '../../../backoffice/models/application.models';
import { Router } from '@angular/router';

@Component({
  selector: 'app-job-offer-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">

      <!-- Toast -->
      @if (toast) {
        <div class="toast" [class.toast-success]="toast.type === 'success'" [class.toast-error]="toast.type === 'error'">
          <span class="toast-icon">{{ toast.type === 'success' ? '✅' : '❌' }}</span>
          {{ toast.message }}
        </div>
      }

      <!-- Hero -->
      <div class="hero-banner">
        <div class="hero-content">
          <span class="hero-tag">💼 Opportunités de carrière</span>
          <h1 class="hero-title">Trouvez l'offre qui <span class="accent">vous correspond</span></h1>
          <p class="hero-sub">{{ jobOffers.length }} offre{{ jobOffers.length > 1 ? 's' : '' }} disponible{{ jobOffers.length > 1 ? 's' : '' }}</p>
        </div>
        <div class="hero-deco">
          <div class="deco-card"><span>💼</span><p>Jobs</p></div>
          <div class="deco-card"><span>🚀</span><p>Carrière</p></div>
        </div>
      </div>

      <!-- Grid -->
      <div class="offers-grid">
        @for (job of jobOffers; track job.id) {
          <div class="offer-card">
            <div class="card-top">
              <div class="company-row">
                <div class="company-logo">{{ getInitials(job.title) }}</div>
                <div>
                  <div class="company-name">{{ job.title }}</div>
                  <div class="level-row">
                    <span class="level-chip" [ngClass]="getLevelClass(job.requiredLevel)">
                      {{ job.requiredLevel }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p class="job-desc">{{ job.description }}</p>

            <div class="card-footer">
              <span class="status-badge" [class.active]="job.active">
                {{ job.active ? '🟢 Active' : '🔴 Inactive' }}
              </span>
              <button
                class="btn-apply"
                [disabled]="hasApplied(job.id)"
                (click)="openApply(job)"
              >
                {{ hasApplied(job.id) ? '✓ Déjà postulé' : 'Postuler →' }}
              </button>
            </div>
          </div>
        }
      </div>

      @if (jobOffers.length === 0) {
        <div class="empty-state">
          <span class="empty-icon">📂</span>
          <h3>Aucune offre disponible</h3>
          <p>Revenez plus tard pour de nouvelles opportunités.</p>
        </div>
      }

      <!-- Apply Modal -->
      @if (showModal && selectedJob) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <button class="modal-close" (click)="closeModal()">✕</button>

            @if (submitted) {
              <div class="success-state">
                <div class="success-icon">🎉</div>
                <h3>Candidature envoyée !</h3>
                <p>Nous avons bien reçu votre candidature pour <strong>{{ selectedJob.title }}</strong>.</p>
                <button class="btn-back-modal" (click)="closeModal()">Fermer</button>
              </div>
            } @else {
              <div class="modal-header">
                <span class="modal-tag">📩 Postuler</span>
                <h2>{{ selectedJob.title }}</h2>
                <p class="modal-sub">Niveau requis : <strong>{{ selectedJob.requiredLevel }}</strong></p>
              </div>

              <form class="apply-form" #applyRef="ngForm" (ngSubmit)="submitApplication(applyRef)">

                <!-- Bio -->
                <div class="form-group" [class.has-error]="bioField.touched && bioField.invalid">
                  <label for="bio">
                    <span class="lbl-icon">📖</span>
                    Bio <span class="req">*</span>
                  </label>
                  <textarea
                    id="bio" name="bio"
                    #bioField="ngModel"
                    [(ngModel)]="applyForm.bio"
                    required minlength="20"
                    placeholder="Présentez-vous : votre parcours, votre passion..."
                    rows="4" class="form-input"></textarea>
                  @if (bioField.touched && bioField.errors?.['required']) {
                    <span class="error-msg">La bio est requise.</span>
                  }
                  @if (bioField.touched && bioField.errors?.['minlength']) {
                    <span class="error-msg">La bio doit comporter au moins 20 caractères.</span>
                  }
                </div>

                <!-- Spécialité -->
                <div class="form-group" [class.has-error]="specField.touched && specField.invalid">
                  <label for="specialty">
                    <span class="lbl-icon">🎯</span>
                    Spécialité <span class="req">*</span>
                  </label>
                  <input
                    type="text" id="specialty" name="specialty"
                    #specField="ngModel"
                    [(ngModel)]="applyForm.specialty"
                    required
                    placeholder="Ex: Développement Full-Stack, Data Science..."
                    class="form-input">
                  @if (specField.touched && specField.errors?.['required']) {
                    <span class="error-msg">La spécialité est requise.</span>
                  }
                </div>

                <!-- Expérience -->
                <div class="form-group" [class.has-error]="expField.touched && expField.invalid">
                  <label for="experience">
                    <span class="lbl-icon">⏳</span>
                    Expérience <span class="req">*</span>
                  </label>
                  <select
                    id="experience" name="experience"
                    #expField="ngModel"
                    [(ngModel)]="applyForm.experience"
                    required
                    class="form-input">
                    <option value="">— Sélectionnez votre expérience —</option>
                    <option value="Moins d'1 an">Moins d'1 an</option>
                    <option value="1-2 ans">1 – 2 ans</option>
                    <option value="3-5 ans">3 – 5 ans</option>
                    <option value="5-10 ans">5 – 10 ans</option>
                    <option value="Plus de 10 ans">Plus de 10 ans</option>
                  </select>
                  @if (expField.touched && expField.errors?.['required']) {
                    <span class="error-msg">L'expérience est requise.</span>
                  }
                </div>

                @if (errorMsg) {
                  <div class="error-banner">⚠️ {{ errorMsg }}</div>
                }

                <div class="modal-actions">
                  <button type="button" class="btn-cancel-modal" (click)="closeModal()">Annuler</button>
                  <button type="submit" class="btn-submit" [disabled]="submitting">
                    @if (submitting) { <span class="btn-spin"></span> Envoi... }
                    @else { 🚀 Envoyer ma candidature }
                  </button>
                </div>
              </form>
            }
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { box-sizing: border-box; }
    .page { font-family: 'Inter', system-ui, sans-serif; min-height: 100vh; }

    /* Toast */
    .toast { position: fixed; top: 1.5rem; right: 1.5rem; z-index: 10001; display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.5rem; border-radius: 14px; font-weight: 600; font-size: 0.9rem; box-shadow: 0 20px 40px rgba(0,0,0,0.15); animation: slideIn 0.3s ease; }
    .toast-success { background: linear-gradient(135deg, #10b981, #059669); color: white; }
    .toast-error { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; }
    .toast-icon { font-size: 1.1rem; }
    @keyframes slideIn { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

    /* Hero */
    .hero-banner {
      background: linear-gradient(135deg, #2D5757 0%, #1a3a3a 100%);
      padding: 4rem 2.5rem 3rem;
      display: flex; align-items: center; justify-content: space-between; gap: 2rem;
      position: relative; overflow: hidden;
    }
    .hero-banner::after {
      content: ''; position: absolute; right: -80px; top: -80px;
      width: 320px; height: 320px; border-radius: 50%;
      background: rgba(255,255,255,0.05);
    }
    .hero-tag { display: inline-block; background: rgba(255,255,255,0.15); color: #F7EDE2; padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.85rem; font-weight: 700; margin-bottom: 1rem; }
    .hero-title { font-size: 2.4rem; font-weight: 900; color: white; margin: 0 0 0.75rem; line-height: 1.2; }
    .accent { color: #a7d7a7; }
    .hero-sub { color: rgba(255,255,255,0.7); font-size: 1rem; margin: 0; }
    .hero-deco { display: flex; gap: 1rem; z-index: 1; }
    .deco-card { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 16px; padding: 1.25rem 1.5rem; color: white; text-align: center; border: 1px solid rgba(255,255,255,0.15); }
    .deco-card span { font-size: 2rem; display: block; margin-bottom: 0.3rem; }
    .deco-card p { margin: 0; font-weight: 700; font-size: 0.85rem; }

    /* Grid */
    .offers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 1.75rem; padding: 2.5rem; max-width: 1400px; margin: 0 auto; }

    /* Card */
    .offer-card {
      background: white; border-radius: 20px; padding: 1.75rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      display: flex; flex-direction: column; gap: 0.85rem;
      transition: all 0.3s ease;
    }
    .offer-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(45,87,87,0.12); border-color: #a7d7a7; }

    .card-top { display: flex; justify-content: space-between; align-items: flex-start; }
    .company-row { display: flex; align-items: flex-start; gap: 0.75rem; }
    .company-logo { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #2D5757, #1a3a3a); color: white; font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .company-name { font-weight: 700; color: #1e293b; font-size: 0.95rem; margin-bottom: 0.3rem; }
    .level-row { margin-top: 0.25rem; }

    .level-chip { padding: 0.25rem 0.65rem; border-radius: 8px; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.04em; }
    .badge-A1,.badge-A2 { background: #dcfce7; color: #166534; }
    .badge-B1 { background: #fef9c3; color: #854d0e; }
    .badge-B2 { background: #ffedd5; color: #9a3412; }
    .badge-C1,.badge-C2 { background: #fee2e2; color: #991b1b; }
    .badge-default { background: #f1f5f9; color: #475569; }

    .job-desc { color: #475569; font-size: 0.9rem; line-height: 1.6; margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; flex: 1; }

    .card-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 0.75rem; border-top: 1px solid #f1f5f9; margin-top: auto; }
    .status-badge { font-size: 0.75rem; font-weight: 600; color: #64748b; }
    .status-badge.active { color: #16a34a; }

    .btn-apply { background: linear-gradient(135deg, #2D5757, #1a3a3a); color: white; border: none; padding: 0.65rem 1.5rem; border-radius: 10px; font-weight: 700; font-size: 0.88rem; cursor: pointer; transition: all 0.2s; }
    .btn-apply:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(45,87,87,0.4); }
    .btn-apply:disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; box-shadow: none; transform: none; }

    /* Empty state */
    .empty-state { text-align: center; padding: 5rem 2rem; }
    .empty-icon { font-size: 3.5rem; display: block; margin-bottom: 1rem; opacity: 0.3; }
    .empty-state h3 { font-size: 1.3rem; font-weight: 700; color: #1e293b; margin: 0 0 0.5rem; }
    .empty-state p { color: #64748b; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); z-index: 11000; display: flex; align-items: center; justify-content: center; padding: 1.5rem; animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .modal { background: #ffffff; border-radius: 24px; width: 100%; max-width: 560px; padding: 2.25rem; position: relative; box-shadow: 0 40px 100px rgba(0,0,0,0.3); animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); max-height: 90vh; overflow-y: auto; z-index: 11001; }
    @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .modal-close { position: absolute; top: 1.25rem; right: 1.25rem; background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 0.9rem; color: #64748b; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .modal-close:hover { background: #fee2e2; color: #ef4444; }

    .modal-tag { display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 0.3rem 0.75rem; border-radius: 8px; font-size: 0.78rem; font-weight: 700; margin-bottom: 0.5rem; }
    .modal-header h2 { font-size: 1.4rem; font-weight: 800; color: #1e293b; margin: 0.25rem 0 0.25rem; }
    .modal-sub { color: #64748b; font-size: 0.88rem; margin: 0 0 1.5rem; }

    .apply-form { display: flex; flex-direction: column; gap: 1.1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
    .form-group label { font-size: 0.85rem; font-weight: 700; color: #334155; display: flex; align-items: center; gap: 0.4rem; }
    .lbl-icon { font-size: 1rem; }
    .req { color: #ef4444; }
    .form-input { padding: 0.85rem 1rem; border-radius: 10px; border: 1.5px solid #e2e8f0; background: #f8fafc; font-size: 0.95rem; color: #1e293b; font-family: inherit; width: 100%; transition: all 0.2s; }
    .form-input:focus { outline: none; border-color: #2D5757; background: white; box-shadow: 0 0 0 4px rgba(45,87,87,0.1); }
    textarea.form-input { resize: vertical; min-height: 110px; }
    .has-error .form-input { border-color: #fca5a5; background: #fff5f5; }
    .error-msg { font-size: 0.78rem; color: #ef4444; font-weight: 600; }
    .error-banner { background: #fff5f5; border: 1px solid #fecaca; border-radius: 10px; padding: 0.75rem 1rem; font-size: 0.85rem; color: #b91c1c; font-weight: 600; }

    .modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; padding-top: 0.5rem; }
    .btn-cancel-modal { background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.75rem 1.5rem; border-radius: 10px; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.2s; }
    .btn-cancel-modal:hover { background: #f1f5f9; }
    .btn-submit { background: linear-gradient(135deg, #2D5757, #1a3a3a); color: white; border: none; padding: 0.75rem 1.75rem; border-radius: 10px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.25s; box-shadow: 0 4px 12px rgba(45,87,87,0.3); }
    .btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(45,87,87,0.4); }
    .btn-submit:disabled { background: #94a3b8; box-shadow: none; cursor: not-allowed; }
    .btn-spin { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .success-state { text-align: center; padding: 2rem 1rem; }
    .success-icon { font-size: 3.5rem; display: block; margin-bottom: 1rem; }
    .success-state h3 { font-size: 1.4rem; font-weight: 800; color: #1e293b; margin: 0 0 0.5rem; }
    .success-state p { color: #64748b; margin: 0 0 1.5rem; }
    .btn-back-modal { background: linear-gradient(135deg, #2D5757, #1a3a3a); color: white; border: none; padding: 0.75rem 2rem; border-radius: 10px; font-weight: 700; cursor: pointer; }

    @media (max-width: 640px) {
      .hero-banner { flex-direction: column; padding: 2rem 1.5rem; }
      .hero-title { font-size: 1.9rem; }
      .hero-deco { display: none; }
      .offers-grid { grid-template-columns: 1fr; padding: 1.5rem; }
    }
  `]
})
export class JobOfferListComponent implements OnInit {
  jobOffers: JobOffer[] = [];
  appliedJobIds: number[] = [];

  // Modal state
  showModal = false;
  selectedJob: JobOffer | null = null;
  submitted = false;
  submitting = false;
  errorMsg = '';

  toast: { message: string; type: 'success' | 'error' } | null = null;

  applyForm: { bio: string; specialty: string; experience: string } = {
    bio: '', specialty: '', experience: ''
  };

  constructor(
    private appSvc: ApplicationService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadJobs();
    this.loadUserApplications();
  }

  loadJobs(): void {
    this.appSvc.getAllJobs().subscribe(jobs => {
      this.jobOffers = jobs.filter(j => j.active);
    });
  }

  loadUserApplications(): void {
    const user = this.auth.getCurrentUser();
    if (!user) return;
    this.appSvc.getAll().subscribe(apps => {
      this.appliedJobIds = apps
        .filter((a: any) => a.userId === user.id)
        .map((a: any) => a.jobOffer?.id ?? a.jobOfferId);
    });
  }

  hasApplied(jobId: number): boolean {
    return this.appliedJobIds.includes(jobId);
  }

  getInitials(title: string): string {
    if (!title) return 'J';
    return title.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  }

  getLevelClass(level: Level): string {
    return 'badge-' + level;
  }

  openApply(job: JobOffer): void {
    const user = this.auth.getCurrentUser();
    if (!user) {
      this.router.navigate(['/assessment/login']);
      return;
    }
    this.selectedJob = job;
    this.submitted = false;
    this.submitting = false;
    this.errorMsg = '';
    this.applyForm = { bio: '', specialty: '', experience: '' };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedJob = null;
  }

  submitApplication(form: NgForm): void {
    if (!form.valid || !this.selectedJob) return;
    this.submitting = true;
    this.errorMsg = '';

    const user = this.auth.getCurrentUser();

    // Build payload with jobOfferId for the backend
    const payload: any = {
      userId: user?.id,
      bio: this.applyForm.bio,
      specialty: this.applyForm.specialty,
      experience: this.applyForm.experience,
      jobOfferId: this.selectedJob.id
    };

    this.appSvc.submitApplication(payload).subscribe({
      next: (app: any) => {
        this.submitting = false;
        this.submitted = true;
        if (this.selectedJob?.id !== undefined) {
          this.appliedJobIds.push(this.selectedJob.id);
        }
        this.showToast('Candidature envoyée avec succès !', 'success');
      },
      error: (err: any) => {
        this.submitting = false;
        if (err?.status === 409) {
          this.errorMsg = err.error?.message || 'Vous avez déjà postulé à cette offre.';
        } else {
          this.errorMsg = 'Erreur lors de l\'envoi. Veuillez réessayer.';
        }
        this.showToast(this.errorMsg, 'error');
      }
    });
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast = { message, type };
    setTimeout(() => this.toast = null, 4000);
  }
}
