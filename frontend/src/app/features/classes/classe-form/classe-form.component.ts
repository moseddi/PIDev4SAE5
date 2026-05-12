import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClasseService } from '../../../core/services/classe.service';

@Component({
  selector: 'app-classe-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './classe-form.component.html',
  styleUrl: './classe-form.component.css',
})
export class ClasseFormComponent implements OnInit {
  form!: FormGroup;
  id: number | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private classeService: ClasseService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      nom: ['', [Validators.required, Validators.maxLength(100)]],
    });
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.id = +idParam;
      this.classeService.getById(this.id).subscribe({
        next: (c) => this.form.patchValue({ nom: c.nom }),
        error: () => (this.error = 'Classe introuvable'),
      });
    }
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = null;
    const value = this.form.getRawValue();
    const req = this.id
      ? this.classeService.update(this.id, { id: this.id, ...value })
      : this.classeService.create(value);
    req.subscribe({
      next: () => this.router.navigate(['/classes']),
      error: () => {
        this.error = 'Erreur lors de l\'enregistrement';
        this.loading = false;
      },
    });
  }
}
