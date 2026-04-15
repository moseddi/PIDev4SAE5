import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterielService } from '../../../core/services/materiel.service';
import { SalleService } from '../../../core/services/salle.service';
import { Materiel, Salle } from '../../../models';

@Component({
  selector: 'app-materiel-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './materiel-form.component.html',
  styleUrl: './materiel-form.component.css',
})
export class MaterielFormComponent implements OnInit {
  form!: FormGroup;
  id: number | null = null;
  salles: Salle[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private materielService: MaterielService,
    private salleService: SalleService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      nom: ['', Validators.required],
      status: ['', Validators.required],
      quantiteTotale: [1, [Validators.required, Validators.min(1)]],
      quantiteAssociee: [0, [Validators.required, Validators.min(0)]],
      seuilMaintenance: [100, [Validators.required, Validators.min(0.01)]],
      salleId: [null as number | null],
    });
  }

  ngOnInit(): void {
    this.salleService.getAll().subscribe((data) => (this.salles = data));
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.id = +idParam;
      this.materielService.getById(this.id).subscribe({
        next: (m) =>
          this.form.patchValue({
            nom: m.nom,
            status: m.status,
            quantiteTotale: m.quantiteTotale ?? 1,
            quantiteAssociee: m.quantiteAssociee ?? 0,
            seuilMaintenance: m.seuilMaintenance ?? 100,
            salleId: m.salle?.id ?? null,
          }),
        error: () => (this.error = 'Matériel introuvable'),
      });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = null;
    const v = this.form.getRawValue();
    const nom = String(v.nom ?? '').trim();
    const status = (v.status ?? 'AVAILABLE') as string;
    const quantiteTotale = Number(v.quantiteTotale ?? 1);
    const quantiteAssociee = Number(v.quantiteAssociee ?? 0);
    const seuilMaintenance = Number(v.seuilMaintenance ?? 100);
    const salleIdRaw = v.salleId ?? null;
    const salleId = salleIdRaw === null || salleIdRaw === undefined ? null : Number(salleIdRaw);

    if (quantiteAssociee > quantiteTotale) {
      this.error = 'Assigned quantity cannot be greater than available quantity.';
      this.loading = false;
      return;
    }

    const req = this.id != null
      ? this.materielService.update(this.id, nom, status, quantiteTotale, quantiteAssociee, seuilMaintenance, salleId === null ? 0 : salleId)
      : this.materielService.create(nom, status, quantiteTotale, quantiteAssociee, seuilMaintenance, salleId);
    req.subscribe({
      next: () => {
        this.router.navigate(['/materiels']);
      },
      error: (err) => {
        this.error = err?.error?.message ?? 'Erreur lors de l\'enregistrement';
        this.loading = false;
      },
    });
  }

  /** Remaining = total - assigned (read-only hint in UI) */
  quantiteRestanteDisplay(): number {
    const v = this.form?.getRawValue();
    if (!v) return 0;
    const total = Number(v.quantiteTotale ?? 0);
    const assigned = Number(v.quantiteAssociee ?? 0);
    return Math.max(0, total - assigned);
  }
}
