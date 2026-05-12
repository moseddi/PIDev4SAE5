import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SalleService } from '../../../core/services/salle.service';

@Component({
  selector: 'app-salle-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './salle-form.component.html',
  styleUrl: './salle-form.component.css',
})
export class SalleFormComponent implements OnInit {
  form!: FormGroup;
  id: number | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private salleService: SalleService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      nom: ['', [Validators.required]],
      capacite: [0, [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.id = +idParam;
      this.salleService.getById(this.id).subscribe({
        next: (s) => this.form.patchValue({ nom: s.nom, capacite: s.capacite }),
        error: () => (this.error = 'Salle introuvable'),
      });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = null;
    const value = this.form.getRawValue();
    const req = this.id
      ? this.salleService.update(this.id, { id: this.id, ...value, materiels: [] })
      : this.salleService.create(value);
    req.subscribe({
      next: () => this.router.navigate(['/salles']),
      error: () => {
        this.error = 'Erreur lors de l\'enregistrement';
        this.loading = false;
      },
    });
  }
}
