import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { SalleService } from '../../../core/services/salle.service';
import { Salle } from '../../../models';

declare var bootstrap: any;

@Component({
  selector: 'app-salles-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './salles-list.component.html',
  styleUrl: './salles-list.component.css',
})
export class SallesListComponent implements OnInit {
  salles: Salle[] = [];
  loading = true;
  error: string | null = null;
  searchTerm: string = '';
  sortColumn: string = 'nom';
  sortDirection: 'asc' | 'desc' = 'asc';
  salleForm!: FormGroup;
  isEditMode = false;
  editingId: number | null = null;
  selectedSalleForMateriels: Salle | null = null;
  private modalInstance: any;
  private materielsModalInstance: any;

  constructor(
    private salleService: SalleService,
    private fb: FormBuilder
  ) {
    this.salleForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(/^[a-zA-ZÀ-ÿ0-9\s\-_]+$/)]],
      capacite: [null, [Validators.required, Validators.min(1), Validators.max(1000)]],
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.salleService.getAll().subscribe({
      next: (data) => {
        this.salles = Array.isArray(data) ? data : [];
        this.loading = false;
      },
      error: (err) => {
        const msg = err?.error?.message ?? err?.error ?? err?.message ?? err?.status;
        this.error = msg ? `Chargement: ${typeof msg === 'string' ? msg : String(msg)}` : 'Service salles-materiels indisponible via le gateway (port 8089).';
        this.loading = false;
      },
    });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.editingId = null;
    this.salleForm.reset();
    const modalElement = document.getElementById('salleModal');
    if (modalElement) {
      this.modalInstance = new bootstrap.Modal(modalElement);
      this.modalInstance.show();
    }
  }

  openEditModal(salle: Salle): void {
    this.isEditMode = true;
    this.editingId = salle.id!;
    this.salleForm.patchValue({ nom: salle.nom, capacite: salle.capacite });
    const modalElement = document.getElementById('salleModal');
    if (modalElement) {
      this.modalInstance = new bootstrap.Modal(modalElement);
      this.modalInstance.show();
    }
  }

  openMaterielsModal(salle: Salle): void {
    this.selectedSalleForMateriels = salle;
    const modalElement = document.getElementById('materielsModal');
    if (modalElement) {
      this.materielsModalInstance = new bootstrap.Modal(modalElement);
      this.materielsModalInstance.show();
    }
  }

  saveSalle(): void {
    this.salleForm.markAllAsTouched();
    if (this.salleForm.invalid) return;
    const value = this.salleForm.getRawValue();
    const payload = {
      nom: String(value.nom ?? '').trim(),
      capacite: Math.max(1, Number(value.capacite) || 0),
    };
    const req = this.isEditMode && this.editingId
      ? this.salleService.update(this.editingId, { id: this.editingId, ...payload })
      : this.salleService.create(payload);

    req.subscribe({
      next: () => {
        if (this.modalInstance) {
          this.modalInstance.hide();
        }
        this.load();
      },
      error: (err) => {
        const msg = err?.error?.message ?? err?.error ?? err?.message ?? err?.statusText;
        this.error = msg ? `Erreur: ${typeof msg === 'string' ? msg : JSON.stringify(msg)}` : 'Error while saving';
      },
    });
  }

  delete(id: number): void {
    if (!confirm('Delete this room?')) return;
    this.salleService.delete(id).subscribe({
      next: () => this.load(),
      error: (err) => {
        const msg = err?.error?.message ?? err?.error ?? err?.message ?? err?.statusText;
        this.error = msg ? `Erreur: ${typeof msg === 'string' ? msg : JSON.stringify(msg)}` : 'Error while deleting';
      },
    });
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  get filteredSalles(): Salle[] {
    let result = this.salles;

    // Filter
    if (this.searchTerm) {
      const lowerTerm = this.searchTerm.toLowerCase();
      result = result.filter(s => s.nom.toLowerCase().includes(lowerTerm));
    }

    // Sort
    result = [...result].sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      switch (this.sortColumn) {
        case 'nom':
          valA = a.nom.toLowerCase();
          valB = b.nom.toLowerCase();
          break;
        case 'capacite':
          valA = a.capacite || 0;
          valB = b.capacite || 0;
          break;
        case 'materiels':
          valA = a.materiels?.length || 0;
          valB = b.materiels?.length || 0;
          break;
      }

      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }
}
