import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Certification, Level } from '../../models/certification.models';
import { CertificationService } from '../../services/certification.service';

@Component({
  selector: 'app-certification-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="form-page">

      <!-- Breadcrumb -->
      <div class="breadcrumb">
        <a routerLink="../..">Dashboard</a>
        <span>/</span>
        <a routerLink="..">Certifications</a>
        <span>/</span>
        <span>{{ isEdit ? 'Edit' : 'New Certification' }}</span>
      </div>

      <div class="form-card">
        <div class="form-header">
          <div class="form-icon">🎓</div>
          <div>
            <h2 class="form-title">{{ isEdit ? 'Edit Certification' : 'New Certification' }}</h2>
            <p class="form-sub">Fill in all required fields</p>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="form-body">

          <!-- Titre -->
          <div class="field">
            <label for="title">Title *</label>
            <input id="title" name="title" formControlName="title" type="text"
                   placeholder="e.g.: B2 English Certification" class="input" />
            <span class="error" *ngIf="f['title'].touched && f['title'].invalid">Title is required</span>
          </div>

          <!-- Niveau -->
          <div class="field">
            <label for="level">CEFR Level *</label>
            <div class="level-selector">
              <button type="button" class="level-btn"
                *ngFor="let lvl of levels"
                [class.selected]="f['level'].value === lvl"
                [class]="'lvl-' + lvl"
                (click)="form.patchValue({ level: lvl })">
                {{ lvl }}
              </button>
            </div>
            <input type="hidden" id="level" name="level" formControlName="level" />
            <span class="error" *ngIf="f['level'].touched && f['level'].invalid">Select a level</span>
          </div>

          <!-- Description -->
          <div class="field">
            <label for="description">Description *</label>
            <textarea id="description" name="description" formControlName="description" class="input textarea"
                      placeholder="Describe the content and objectives of this certification…" rows="4"></textarea>
            <span class="error" *ngIf="f['description'].touched && f['description'].invalid">Description is required</span>
          </div>

          <!-- Score de passage -->
          <div class="field">
            <label for="passingScore">Passing Score (%) *</label>
            <div class="score-input-wrap">
              <input id="passingScore" name="passingScore" formControlName="passingScore" type="number"
                     min="0" max="100" step="1" class="input score-input" />
              <div class="score-preview">
                <div class="score-track">
                  <div class="score-thumb" [style.width.%]="f['passingScore'].value || 0"></div>
                </div>
                <span class="score-pct">{{ f['passingScore'].value || 0 }}%</span>
              </div>
            </div>
            <span class="error" *ngIf="f['passingScore'].touched && f['passingScore'].invalid">Enter a score between 0 and 100</span>
          </div>

          <!-- API error -->
          <div class="api-error" *ngIf="apiError">{{ apiError }}</div>

          <!-- Actions -->
          <div class="form-actions">
            <a routerLink=".." class="btn-cancel">Cancel</a>
            <button type="submit" class="btn-submit" [disabled]="submitting">
              <span class="spinner-sm" *ngIf="submitting"></span>
              {{ submitting ? 'Saving…' : (isEdit ? '✅ Update' : '✅ Create') }}
            </button>
          </div>

        </form>
      </div>
    </div>
  `,
  styles: [`
    .form-page { 
      max-width: 1000px; 
      padding: 2rem; 
      margin: 0 auto;
    }
    .breadcrumb { 
      display:flex; 
      gap:0.5rem; 
      align-items:center; 
      margin-bottom:2rem; 
      font-size:0.85rem; 
      color:#2D5757; 
      background: #fff;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      border: 1px solid rgba(45, 87, 87, 0.1);
    }
    .breadcrumb a { 
      color:#2D5757; 
      text-decoration:none; 
      font-weight: 500;
    }
    .breadcrumb a:hover {
      text-decoration: underline;
    }
    .form-card { 
      background:#fff; 
      border-radius:24px; 
      box-shadow:0 20px 60px rgba(45, 87, 87, 0.08); 
      overflow:hidden; 
      border:1px solid rgba(45, 87, 87, 0.1); 
    }
    .form-header { 
      display:flex; 
      align-items:center; 
      gap:1.5rem; 
      padding:2.5rem 3rem; 
      border-bottom:1px solid rgba(45, 87, 87, 0.1); 
      background:linear-gradient(135deg,rgba(45, 87, 87, 0.05),rgba(45, 87, 87, 0.02)); 
    }
    .form-icon { 
      font-size:3rem; 
      color: #2D5757;
    }
    .form-title { 
      margin:0; 
      font-size:1.75rem; 
      font-weight:900; 
      color:#2D5757; 
    }
    .form-sub { 
      margin:0; 
      color:#2D5757; 
      font-size:1rem; 
      opacity: 0.8;
    }
    .form-body { 
      padding:3rem; 
      display:flex; 
      flex-direction:column; 
      gap:2rem; 
    }
    .field { 
      display:flex; 
      flex-direction:column; 
      gap:0.75rem; 
    }
    .field label { 
      font-weight:700; 
      font-size:0.95rem; 
      color:#2D5757; 
    }
    .input {
      padding:1rem 1.25rem; 
      border:2px solid rgba(45, 87, 87, 0.15); 
      border-radius:14px;
      font-size:1rem; 
      color:#2D5757; 
      transition:all 0.3s ease; 
      outline:none; 
      width:100%;
      box-sizing:border-box; 
      font-family:inherit;
      background: rgba(247, 237, 226, 0.3);
    }
    .input:focus { 
      border-color:#2D5757; 
      box-shadow:0 0 0 4px rgba(45, 87, 87, 0.15);
      background: #fff;
    }
    .textarea { 
      resize:vertical; 
      min-height:120px; 
    }

    .level-selector { 
      display:flex; 
      flex-wrap:wrap; 
      gap:0.75rem; 
    }
    .level-btn {
      padding:0.75rem 1.5rem; 
      border-radius:12px; 
      font-weight:700; 
      font-size:0.95rem;
      border:2px solid rgba(45, 87, 87, 0.2); 
      cursor:pointer; 
      transition:all 0.3s ease; 
      background:#fff; 
      color:#2D5757;
    }
    .level-btn:hover { 
      background:rgba(45, 87, 87, 0.1); 
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(45, 87, 87, 0.1);
    }
    .level-btn.selected { 
      border-color:#2D5757; 
      background:#2D5757; 
      color:#F7EDE2; 
      transform:scale(1.05);
      box-shadow: 0 6px 16px rgba(45, 87, 87, 0.2);
    }

    .score-input-wrap { 
      display:flex; 
      flex-direction:column; 
      gap:1rem; 
    }
    .score-input { 
      max-width:200px; 
    }
    .score-preview { 
      display:flex; 
      align-items:center; 
      gap:1.5rem; 
    }
    .score-track { 
      flex:1; 
      height:10px; 
      background:rgba(45, 87, 87, 0.1); 
      border-radius:99px; 
      max-width:400px; 
      overflow: hidden;
    }
    .score-thumb { 
      height:100%; 
      background:linear-gradient(90deg,#2D5757,#1a3a3a); 
      border-radius:99px; 
      transition:width 0.3s ease;
    }
    .score-pct { 
      font-weight:800; 
      color:#2D5757; 
      font-size:1.1rem; 
      min-width:50px;
    }

    .api-error { 
      background:rgba(220, 38, 38, 0.1); 
      border:1px solid rgba(220, 38, 38, 0.2); 
      color:#dc2626; 
      padding:1rem 1.5rem; 
      border-radius:12px; 
      font-size:0.88rem; 
      font-weight: 600;
    }

    .form-actions { 
      display:flex; 
      gap:1rem; 
      justify-content:flex-end; 
      padding-top:2rem; 
      border-top: 1px solid rgba(45, 87, 87, 0.1);
    }
    .btn-cancel { 
      padding:0.75rem 2rem; 
      border-radius:12px; 
      background: rgba(45, 87, 87, 0.1); 
      color:#2D5757; 
      text-decoration:none; 
      font-weight:700; 
      font-size: 1rem;
      border: 2px solid rgba(45, 87, 87, 0.2);
      transition: all 0.3s ease;
    }
    .btn-cancel:hover {
      background: rgba(45, 87, 87, 0.2);
      transform: translateY(-2px);
    }
    .btn-submit {
      display:flex; 
      align-items:center; 
      gap:0.75rem;
      padding:0.75rem 2.5rem; 
      border-radius:12px;
      background:linear-gradient(135deg,#2D5757,#1a3a3a); 
      color:#F7EDE2;
      border:none; 
      font-weight:800; 
      font-size:1rem; 
      cursor:pointer; 
      transition:all 0.3s ease;
      box-shadow: 0 6px 20px rgba(45, 87, 87, 0.3);
    }
    .btn-submit:hover { 
      transform: translateY(-3px); 
      box-shadow: 0 12px 30px rgba(45, 87, 87, 0.4);
      background:linear-gradient(135deg,#1a3a3a,#2D5757);
    }
    .btn-submit:disabled { 
      opacity:0.6; 
      cursor:not-allowed; 
      transform: none !important;
    }
    .spinner-sm { 
      width:18px; 
      height:18px; 
      border:2px solid rgba(247, 237, 226, 0.4); 
      border-top-color:#F7EDE2; 
      border-radius:50%; 
      animation:spin 0.7s linear infinite; 
    }
    @keyframes spin { to { transform:rotate(360deg); } }
  `]
})
export class CertificationFormComponent implements OnInit {
  form!: FormGroup;
  isEdit = false;
  submitting = false;
  apiError = '';
  levels = Object.values(Level);

  constructor(
    private fb: FormBuilder,
    private svc: CertificationService,
    private router: Router,
    private route: ActivatedRoute,
  ) { }

  get f() { return this.form.controls; }

  ngOnInit(): void {
    this.form = this.fb.group({
      title: ['', Validators.required],
      level: ['', Validators.required],
      description: ['', Validators.required],
      passingScore: [70, [Validators.required, Validators.min(0), Validators.max(100)]],
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.svc.getById(+id).subscribe(cert => this.form.patchValue(cert));
    }
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting = true;
    this.apiError = '';

    const rawValue = this.form.value;
    const payload: Certification = {
      title: rawValue.title,
      level: rawValue.level,
      description: rawValue.description,
      passingScore: Number(rawValue.passingScore)
    };

    const id = this.route.snapshot.paramMap.get('id');
    const req = id
      ? this.svc.update(+id, payload)
      : this.svc.create(payload);

    req.subscribe({
      next: () => this.router.navigate(['..'], { relativeTo: this.route }),
      error: (err) => {
        this.apiError = err?.error?.message || 'Error occurred while saving.';
        this.submitting = false;
      }
    });
  }
}
