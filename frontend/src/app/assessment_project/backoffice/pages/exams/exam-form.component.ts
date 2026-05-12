import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Certification, CertificationExam } from '../../models/certification.models';
import { ExamService } from '../../services/exam.service';
import { CertificationService } from '../../services/certification.service';

@Component({
    selector: 'app-exam-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    template: `
    <div class="form-page">
      <div class="breadcrumb">
        <a routerLink="../../..">Dashboard</a> <span>/</span>
        <a routerLink="../..">Examens</a> <span>/</span>
        <span>{{ isEdit ? 'Modifier' : 'Nouvel examen' }}</span>
      </div>

      <div class="form-card">
        <div class="form-header">
          <div class="form-icon">📝</div>
          <div>
            <h2 class="form-title">{{ isEdit ? 'Modifier l\'examen' : 'Nouvel examen' }}</h2>
            <p class="form-sub">Configurez les détails de l'examen (titre, certification, durée)</p>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="form-body">
          <div class="field">
            <label for="title">Titre de l'examen *</label>
            <input
              id="title"
              type="text"
              class="input"
              formControlName="title"
              placeholder="Ex. : Examen A1 - Session 2025"
            />
            <span class="error" *ngIf="f['title'].touched && f['title'].invalid">
              Le titre de l'examen est requis
            </span>
          </div>

          <div class="field">
            <label for="certificationId">Certification *</label>
            <select id="certificationId" formControlName="certificationId" class="input select">
              <option value="">— Sélectionnez une certification —</option>
              <option *ngFor="let c of certifications" [value]="c.id">
                {{ c.title }} — niveau {{ c.level }}
              </option>
            </select>
            <span class="error" *ngIf="f['certificationId'].touched && f['certificationId'].invalid">
              Sélectionnez une certification
            </span>
          </div>

          <div class="field">
            <label for="duration">Durée (minutes) *</label>
            <input
              id="duration"
              type="number"
              min="1"
              class="input"
              formControlName="duration"
              placeholder="Durée de l'examen en minutes"
            />
            <span class="error" *ngIf="f['duration'].touched && f['duration'].invalid">
              Saisissez une durée valide (en minutes)
            </span>
          </div>

          <div class="api-error" *ngIf="apiError">{{ apiError }}</div>

          <div class="form-actions">
            <a routerLink=".." class="btn-cancel">Annuler</a>
            <button type="submit" class="btn-submit" [disabled]="submitting">
              <span class="spinner-sm" *ngIf="submitting"></span>
              {{ submitting ? 'Enregistrement…' : (isEdit ? '✅ Mettre à jour' : '✅ Créer') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
    styles: [`
    .form-page { max-width:680px; }
    .breadcrumb { display:flex; gap:0.5rem; align-items:center; margin-bottom:1.5rem; font-size:0.85rem; color:#64748b; }
    .breadcrumb a { color:#f59e0b; text-decoration:none; }
    .form-card { background:#fff; border-radius:20px; box-shadow:0 2px 16px rgba(0,0,0,0.07); overflow:hidden; border:1px solid #f1f5f9; }
    .form-header { display:flex; align-items:center; gap:1.25rem; padding:1.75rem 2rem; border-bottom:1px solid #f1f5f9; background:linear-gradient(135deg,#fffbeb,#fef9c3); }
    .form-icon { font-size:2.5rem; }
    .form-title { margin:0 0 0.2rem; font-size:1.25rem; font-weight:800; color:#0f172a; }
    .form-sub { margin:0; color:#64748b; font-size:0.85rem; }
    .form-body { padding:2rem; display:flex; flex-direction:column; gap:1.5rem; }
    .field { display:flex; flex-direction:column; gap:0.5rem; }
    .field label { font-weight:600; font-size:0.88rem; color:#374151; }
    .input { padding:0.75rem 1rem; border:1.5px solid #e2e8f0; border-radius:10px; font-size:0.95rem; color:#0f172a; transition:border 0.2s; outline:none; width:100%; box-sizing:border-box; font-family:inherit; }
    .input:focus { border-color:#f59e0b; box-shadow:0 0 0 3px rgba(245,158,11,0.15); }
    .select { appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 0.75rem center; background-size:1rem; padding-right:2.5rem; }
    .textarea { resize:vertical; min-height:110px; }
    .error { color:#dc2626; font-size:0.8rem; }
    .type-selector { display:flex; flex-wrap:wrap; gap:0.75rem; }
    .type-btn { display:flex; align-items:center; gap:0.5rem; padding:0.65rem 1.1rem; border-radius:10px; background:#f1f5f9; color:#64748b; border:2px solid transparent; font-weight:600; font-size:0.88rem; cursor:pointer; transition:all 0.2s; }
    .type-btn:hover { background:#e2e8f0; }
    .type-btn.selected { background:#fefce8; color:#a16207; border-color:#fde68a; }
    .true-false-buttons { display:flex; gap:1rem; }
    .tf-btn { flex:1; padding:0.75rem; border-radius:10px; background:#f1f5f9; color:#64748b; border:2px solid transparent; font-weight:600; font-size:0.95rem; cursor:pointer; transition:all 0.2s; }
    .tf-btn.selected { background:#fefce8; color:#a16207; border-color:#fde68a; }
    .api-error { background:#fef2f2; border:1px solid #fecaca; color:#dc2626; padding:0.75rem 1rem; border-radius:10px; font-size:0.88rem; }
    .form-actions { display:flex; gap:0.75rem; justify-content:flex-end; padding-top:0.5rem; }
    .btn-cancel { padding:0.65rem 1.4rem; border-radius:10px; background:#f1f5f9; color:#64748b; text-decoration:none; font-weight:600; font-size:0.9rem; }
    .btn-submit { display:flex; align-items:center; gap:0.5rem; padding:0.65rem 1.6rem; border-radius:10px; background:linear-gradient(135deg,#f59e0b,#d97706); color:#fff; border:none; font-weight:700; font-size:0.9rem; cursor:pointer; transition:opacity 0.2s; }
    .btn-submit:disabled { opacity:0.6; cursor:not-allowed; }
    .spinner-sm { width:16px; height:16px; border:2px solid rgba(255,255,255,0.4); border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
  `]
})
export class ExamFormComponent implements OnInit {
    form!: FormGroup;
    isEdit = false;
    submitting = false;
    apiError = '';
    certifications: Certification[] = [];

    constructor(
        private fb: FormBuilder,
        private examSvc: ExamService,
        private certSvc: CertificationService,
        private router: Router,
        private route: ActivatedRoute,
    ) { }

    get f() { return this.form.controls; }

    ngOnInit(): void {
        this.form = this.fb.group({
            title: ['', Validators.required],
            duration: [60, [Validators.required, Validators.min(1)]],
            certificationId: ['', Validators.required],
        });
        
        this.certSvc.getAll().subscribe((d: Certification[]) => this.certifications = d);

        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEdit = true;
            this.examSvc.getById(+id).subscribe({
                next: (exam: CertificationExam) => {
                    const certId = exam.certificationId ?? exam.certification?.id ?? (exam as any).certification_id;
                    this.form.patchValue({
                        title: exam.title ?? (exam as any).title ?? '',
                        duration: exam.duration ?? 60,
                        certificationId: certId ?? '',
                    });
                },
                error: () => {
                    this.apiError = 'Examen introuvable.';
                }
            });
        }
    }

    submit(): void {
        if (this.form.invalid) { 
            this.form.markAllAsTouched(); 
            return; 
        }
        
        this.submitting = true;
        this.apiError = '';
        
        const formValue = this.form.value;
        const certId = Number(formValue.certificationId);
        const duration = Number(formValue.duration);
        const title = (formValue.title ?? '').trim();

        if (!certId || duration < 1) {
            this.form.markAllAsTouched();
            this.submitting = false;
            return;
        }

        const payload = {
            title,
            duration,
            certificationId: certId,
            certification_id: certId,
        };

        const id = this.route.snapshot.paramMap.get('id');
        const req = id
            ? this.examSvc.update(+id, payload)
            : this.examSvc.create(payload);

        req.subscribe({
            next: () => {
                this.router.navigate(['..'], { relativeTo: this.route });
            },
            error: (err) => {
                this.apiError = err?.message ?? err?.error?.message ?? err?.error?.error ?? 'Erreur lors de l\'enregistrement en base de données. Vérifiez que le backend est démarré (port 8089).';
                this.submitting = false;
            }
        });
    }
}