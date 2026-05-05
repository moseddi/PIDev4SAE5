import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { JobOffer, Level } from '../../../../models/application.models';
import { ApplicationService } from '../../../../services/application.service';

@Component({
  selector: 'app-job-offer-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <!-- Toast Notification -->
      @if (toast) {
        <div class="toast" [class.toast-success]="toast.type === 'success'" [class.toast-error]="toast.type === 'error'">
          <span class="toast-icon">{{ toast.type === 'success' ? '✅' : '❌' }}</span>
          {{ toast.message }}
        </div>
      }

      <div class="page-header">
        <div>
          <h2 class="page-title">{{ isEdit ? "✏️ Modifier l'Offre" : "🆕 Créer une Offre" }}</h2>
          <p class="page-sub">{{ isEdit ? 'Mettez à jour les détails de cette opportunité.' : 'Remplissez les informations pour publier une nouvelle offre.' }}</p>
        </div>
        <button class="btn-back" [routerLink]="['/backoffice/job-offers']">← Retour à la liste</button>
      </div>

      @if (pageLoading) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Chargement de l'offre...</p>
        </div>
      } @else {
        <div class="form-container">
          <form #offerForm="ngForm" (ngSubmit)="save()" class="glass-form">

            <!-- ── 1. General Info ─────────────────────────────── -->
            <div class="section-title">📝 Informations Générales</div>

            <div class="form-group" [class.has-error]="titleField.touched && titleField.invalid">
              <label for="title">
                <span class="label-icon">🏷️</span>
                Titre <span class="required">*</span>
              </label>
              <input
                type="text" id="title" name="title"
                #titleField="ngModel"
                [(ngModel)]="offer.title"
                required minlength="3" maxlength="120"
                placeholder="Ex: Développeur Full-Stack..."
                class="form-input">
              @if (titleField.touched && titleField.errors?.['required']) {
                <span class="error-msg">Le titre est requis.</span>
              }
            </div>

            <div class="form-group" [class.has-error]="descField.touched && descField.invalid">
              <label for="description">
                <span class="label-icon">📄</span>
                Description <span class="required">*</span>
              </label>
              <textarea
                id="description" name="description"
                #descField="ngModel"
                [(ngModel)]="offer.description"
                required minlength="10"
                placeholder="Décrivez le poste, les responsabilités..."
                rows="5"
                class="form-input">
              </textarea>
            </div>

            <!-- ── 2. Level & Company ──────────────────────────── -->
            <div class="form-row">
              <div class="form-group">
                <label for="requiredLevel">
                  <span class="label-icon">🎓</span>
                  Niveau Requis
                </label>
                <select id="requiredLevel" name="requiredLevel" [(ngModel)]="offer.requiredLevel" class="form-input">
                  <option [ngValue]="undefined">— Choisir un niveau —</option>
                  @for (lvl of levels; track lvl) {
                    <option [value]="lvl">{{ getLevelLabel(lvl) }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label for="companyName">
                  <span class="label-icon">🏢</span>
                  Entreprise
                </label>
                <input
                  type="text" id="companyName" name="companyName"
                  [(ngModel)]="offer.companyName"
                  placeholder="Ex: TechCorp"
                  class="form-input">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="location">
                  <span class="label-icon">📍</span>
                  Localisation
                </label>
                <input
                  type="text" id="location" name="location"
                  [(ngModel)]="offer.location"
                  placeholder="Ex: Tunis, Remote..."
                  class="form-input">
              </div>

              <div class="form-group">
                <label for="salary">
                  <span class="label-icon">💰</span>
                  Salaire (optionnel)
                </label>
                <input
                  type="number" id="salary" name="salary"
                  [(ngModel)]="offer.salary"
                  placeholder="Ex: 2500"
                  class="form-input">
              </div>
            </div>

            <div class="section-title">📡 Publication & Visibilité</div>

            <div class="form-row">
              <div class="form-group">
                <label><span class="label-icon">👁️</span> Visibilité</label>
                <div class="toggle-card" [class.toggle-active]="offer.active" (click)="offer.active = !offer.active">
                  <div class="toggle-track">
                    <div class="toggle-thumb"></div>
                  </div>
                  <div class="toggle-info">
                    <span class="toggle-title">{{ offer.active ? '🟢 Offre Active' : '⚫ Offre Inactive' }}</span>
                    <span class="toggle-sub">{{ offer.active ? 'Visible aux candidats' : 'Masquée' }}</span>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label for="expirationDate">
                  <span class="label-icon">⏳</span>
                  Date d'expiration
                </label>
                <input
                  type="date" id="expirationDate" name="expirationDate"
                  [(ngModel)]="offer.expirationDate"
                  class="form-input">
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn-cancel" [routerLink]="['/backoffice/job-offers']">Annuler</button>
              <button type="submit" [disabled]="!offerForm.form.valid || loading" class="btn-save">
                @if (loading) {
                  <span class="btn-spinner"></span> Enregistrement...
                } @else {
                  💾 {{ isEdit ? 'Modifier' : 'Créer' }} l'offre
                }
              </button>
            </div>

          </form>
        </div>
      }
    </div>
    `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    * { box-sizing: border-box; }
    .page { padding: 2rem; max-width: 860px; margin: 0 auto; font-family: 'Inter', system-ui, sans-serif; }

    .toast { position: fixed; top: 1.5rem; right: 1.5rem; z-index: 9999; display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.5rem; border-radius: 14px; font-weight: 600; font-size: 0.9rem; box-shadow: 0 20px 40px rgba(0,0,0,0.15); animation: slideIn 0.3s ease; }
    .toast-success { background: linear-gradient(135deg, #10b981, #059669); color: white; }
    .toast-error   { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; }
    @keyframes slideIn { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; gap: 1rem; flex-wrap: wrap; }
    .page-title  { font-size: 1.8rem; font-weight: 800; color: #1e293b; margin: 0 0 0.3rem; }
    .page-sub    { color: #64748b; font-size: 0.95rem; margin: 0; }
    .btn-back { background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.6rem 1.25rem; border-radius: 10px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; color: #475569; }
    .btn-back:hover { background: white; transform: translateX(-3px); border-color: #cbd5e1; }

    .glass-form { background: white; border: 1px solid #e2e8f0; padding: 2.5rem; border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.06); display: flex; flex-direction: column; gap: 1.4rem; }
    .section-title { font-size: 0.95rem; font-weight: 800; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.07em; border-bottom: 2px solid #eff6ff; padding-bottom: 0.5rem; margin-top: 0.5rem; }

    .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
    .form-group label { font-size: 0.85rem; font-weight: 700; color: #334155; display: flex; align-items: center; gap: 0.4rem; }
    .form-input { padding: 0.85rem 1rem; border-radius: 10px; border: 1.5px solid #e2e8f0; background: #f8fafc; font-size: 0.95rem; transition: all 0.2s; width: 100%; }
    .form-input:focus { outline: none; border-color: #3b82f6; background: white; box-shadow: 0 0 0 4px rgba(59,130,246,0.1); }
    textarea.form-input { resize: vertical; min-height: 120px; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
    @media (max-width: 640px) { .form-row { grid-template-columns: 1fr; } }

    .toggle-card { display: flex; align-items: center; gap: 1rem; padding: 0.85rem 1.15rem; border: 1.5px solid #e2e8f0; border-radius: 12px; cursor: pointer; transition: all 0.25s; background: #f8fafc; user-select: none; }
    .toggle-card.toggle-active { border-color: #86efac; background: #f0fdf4; }
    .toggle-track { width: 44px; height: 24px; border-radius: 12px; background: #e2e8f0; position: relative; transition: background 0.3s; flex-shrink: 0; }
    .toggle-active .toggle-track { background: #10b981; }
    .toggle-thumb { width: 18px; height: 18px; border-radius: 50%; background: white; position: absolute; top: 3px; left: 3px; transition: left 0.3s; }
    .toggle-active .toggle-thumb { left: 23px; }
    .toggle-info { display: flex; flex-direction: column; gap: 0.1rem; }
    .toggle-title { font-size: 0.9rem; font-weight: 700; color: #1e293b; }
    .toggle-sub   { font-size: 0.78rem; color: #64748b; }

    .form-actions { display: flex; gap: 1rem; justify-content: flex-end; padding-top: 1.25rem; border-top: 1px solid #f1f5f9; }
    .btn-cancel { background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.85rem 1.5rem; border-radius: 10px; font-weight: 600; cursor: pointer; }
    .btn-save { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border: none; padding: 0.85rem 2.5rem; border-radius: 10px; font-weight: 700; cursor: pointer; transition: all 0.25s; box-shadow: 0 4px 12px rgba(59,130,246,0.3); display: flex; align-items: center; gap: 0.5rem; }
    .btn-save:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(59,130,246,0.4); }
    .btn-save:disabled { background: #94a3b8; cursor: not-allowed; }

    .loading { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 5rem; }
    .spinner { width: 36px; height: 36px; border: 3px solid #f1f5f9; border-top-color: #3b82f6; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class JobOfferFormComponent implements OnInit {
  isEdit      = false;
  loading     = false;
  pageLoading = false;
  toast: { message: string; type: 'success' | 'error' } | null = null;

  offer: JobOffer = {
    title:           '',
    description:     '',
    requiredLevel:   undefined,
    companyName:     '',
    location:        '',
    salary:          undefined,
    active:          true,
  };

  levels: Level[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];

  constructor(
    private svc: ApplicationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  getLevelLabel(level: Level): string {
    const map: Record<Level, string> = {
      BEGINNER:     'Beginner (A1–A2)',
      INTERMEDIATE: 'Intermediate (B1–B2)',
      ADVANCED:     'Advanced (C1)',
      EXPERT:       'Expert (C2)',
    };
    return map[level] ?? level;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit     = true;
      this.pageLoading = true;
      this.svc.getJobById(+id).subscribe({
        next: (data: JobOffer) => {
          this.offer       = { ...data };
          this.pageLoading = false;
        },
        error: () => {
          this.showToast("Impossible de charger l'offre.", 'error');
          setTimeout(() => this.router.navigate(['/backoffice/job-offers']), 2000);
        }
      });
    }
  }

  save(): void {
    this.loading = true;
    const action = this.isEdit && this.offer.id
      ? this.svc.updateJob(this.offer.id, this.offer)
      : this.svc.createJob(this.offer);

    action.subscribe({
      next: () => {
        this.loading = false;
        this.showToast(
          this.isEdit ? 'Offre mise à jour !' : 'Offre créée avec succès !',
          'success'
        );
        setTimeout(() => this.router.navigate(['/backoffice/job-offers']), 1500);
      },
      error: () => {
        this.loading = false;
        this.showToast('Une erreur est survenue.', 'error');
      }
    });
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast = { message, type };
    setTimeout(() => this.toast = null, 4000);
  }
}
