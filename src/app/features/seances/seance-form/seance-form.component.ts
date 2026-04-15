import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SeanceService } from '../../../core/services/seance.service';
import { TypeSeance, SalleDTO, SeanceSaveResponse } from '../../../models';

@Component({
  selector: 'app-seance-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './seance-form.component.html',
  styleUrl: './seance-form.component.css',
})
export class SeanceFormComponent implements OnInit {
  form!: FormGroup;
  id: number | null = null;
  loading = false;
  error: string | null = null;
  warnings: string[] = [];
  types: TypeSeance[] = ['PRESENTIEL', 'EN_LIGNE'];

  salles: SalleDTO[] = [];
  sallesLoading = false;
  sallesError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private seanceService: SeanceService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      dateDebut: ['', Validators.required],
      dateFin:   ['', Validators.required],
      type:      ['PRESENTIEL', Validators.required],
      jour:      ['', Validators.maxLength(50)],
      salleId:   [null, Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadSalles();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.id = +idParam;
      this.seanceService.getById(this.id).subscribe({
        next: (s) => {
          this.form.patchValue({
            dateDebut: this.toDatetimeLocal(s.dateDebut),
            dateFin:   this.toDatetimeLocal(s.dateFin),
            type:      s.type,
            jour:      s.jour ?? '',
            salleId:   s.salleId ?? null,
          });
        },
        error: () => (this.error = 'Séance introuvable'),
      });
    }
  }

  loadSalles(): void {
    this.sallesLoading = true;
    this.sallesError = null;
    this.seanceService.getSalles().subscribe({
      next: (data: SalleDTO[]) => {
        this.salles = data;
        this.sallesLoading = false;
      },
      error: () => {
        this.sallesError = 'Impossible de charger les salles. Vérifiez que le service salles-materiels est démarré.';
        this.sallesLoading = false;
      },
    });
  }

  private toDatetimeLocal(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = null;
    this.warnings = [];
    const v = this.form.getRawValue();
    const body = {
      dateDebut: v.dateDebut ? new Date(v.dateDebut).toISOString().slice(0, 19) : '',
      dateFin:   v.dateFin   ? new Date(v.dateFin).toISOString().slice(0, 19)   : '',
      type:      v.type,
      jour:      v.jour    || undefined,
      salleId:   v.salleId,
    };
    const req = this.id
      ? this.seanceService.update(this.id, { id: this.id, ...body })
      : this.seanceService.create(body);

    req.subscribe({
      next: (response: SeanceSaveResponse) => {
        this.warnings = response?.warnings ?? [];
        this.router.navigate(['/seances'], {
          state: { seanceWarnings: this.warnings },
        });
      },
      error: (err) => {
        const msg = err?.error?.message ?? (typeof err.error === 'string' ? err.error : null) ?? err?.message;
        this.error = msg || 'Erreur lors de l\'enregistrement';
        this.loading = false;
      },
    });
  }
}