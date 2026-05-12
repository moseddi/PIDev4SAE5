import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { MaterielService } from '../../../core/services/materiel.service';
import { SalleService } from '../../../core/services/salle.service';
import { Materiel, Salle } from '../../../models';

declare var bootstrap: any;

@Component({
  selector: 'app-materiels-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './materiels-list.component.html',
  styleUrl: './materiels-list.component.css',
})
export class MaterielsListComponent implements OnInit {
  materiels: Materiel[] = [];
  salles: Salle[] = [];
  loading = true;
  error: string | null = null;
  successMessage: string | null = null;
  searchTerm = '';
  sortColumn = 'nom';
  sortDirection: 'asc' | 'desc' = 'asc';
  materielForm!: FormGroup;
  isEditMode = false;
  editingId: number | null = null;
  deletingId: number | null = null;
  private modalInstance: any;

  constructor(
    private materielService: MaterielService,
    private salleService: SalleService,
    private fb: FormBuilder
  ) {
    this.materielForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      status: [null as string | null, [Validators.required]],
      quantiteTotale: [1, [Validators.required, Validators.min(1)]],
      quantiteAssociee: [0, [Validators.required, Validators.min(0)]],
      seuilMaintenance: [100, [Validators.required, Validators.min(0.01)]],
      salleId: [null as number | null],
    });
  }

  ngOnInit(): void {
    this.load();
    this.salleService.getAll().subscribe({ next: (data) => (this.salles = data) });
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.materielService.getAll().subscribe({
      next: (data) => {
        this.materiels = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Cannot load equipment. Please ensure the API Gateway (port 8089) and salles-materiels service are running.';
        this.loading = false;
      },
    });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.editingId = null;
    this.materielForm.reset({ nom: '', status: null, quantiteTotale: 1, quantiteAssociee: 0, seuilMaintenance: 100, salleId: null });
    this.showModal();
  }

  openEditModal(m: Materiel): void {
    this.isEditMode = true;
    this.editingId = m.id ?? null;
    this.materielForm.patchValue({
      nom: m.nom,
      status: m.status ?? 'AVAILABLE',
      quantiteTotale: m.quantiteTotale ?? 1,
      quantiteAssociee: m.quantiteAssociee ?? 0,
      seuilMaintenance: m.seuilMaintenance ?? 100,
      salleId: m.salle?.id ?? null,
    });
    this.showModal();
  }

  private showModal(): void {
    const el = document.getElementById('materielModal');
    if (el) {
      this.modalInstance = new bootstrap.Modal(el);
      this.modalInstance.show();
    }
  }

  saveMateriel(): void {
    this.materielForm.markAllAsTouched();
    if (this.materielForm.invalid) return;
    const v = this.materielForm.getRawValue();
    const nom = String(v.nom ?? '').trim();
    const status = (v.status ?? 'AVAILABLE') as string;
    const quantiteTotale = Number(v.quantiteTotale ?? 1);
    const quantiteAssociee = Number(v.quantiteAssociee ?? 0);
    const seuilMaintenance = Number(v.seuilMaintenance ?? 100);
    const salleId = v.salleId != null ? Number(v.salleId) : null;
    const salleParam = salleId != null && salleId > 0 ? salleId : (this.isEditMode ? 0 : undefined);
    if (quantiteAssociee > quantiteTotale) {
      this.error = 'Assigned quantity cannot be greater than available quantity.';
      return;
    }

    if (this.isEditMode && this.editingId != null) {
      this.materielService.update(this.editingId, nom, status, quantiteTotale, quantiteAssociee, seuilMaintenance, salleParam).subscribe({
        next: () => {
          this.modalInstance?.hide();
          this.load();
        },
        error: (err) => (this.error = err?.error?.message ?? 'Update failed'),
      });
    } else {
      this.materielService.create(nom, status, quantiteTotale, quantiteAssociee, seuilMaintenance, salleId ?? undefined).subscribe({
        next: () => {
          this.modalInstance?.hide();
          this.load();
        },
        error: (err) => (this.error = err?.error?.message ?? 'Create failed'),
      });
    }
  }

  delete(id: number | undefined | null): void {
    if (id == null || typeof id !== 'number') return;
    if (!confirm('Delete this equipment?')) return;
    this.error = null;
    this.successMessage = null;
    this.deletingId = id;
    const idNum = Number(id);
    this.materielService.delete(idNum).subscribe({
      next: () => {
        this.deletingId = null;
        this.successMessage = 'Equipment deleted.';
        // Retirer de la liste tout de suite (comparaison en number pour éviter string !== number)
        this.materiels = this.materiels.filter((m) => Number(m.id) !== idNum);
        setTimeout(() => (this.successMessage = null), 3000);
      },
      error: (err) => {
        this.deletingId = null;
        this.error = err?.error?.message ?? err?.message ?? 'Delete failed';
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

  get filteredMateriels(): Materiel[] {
    let list = [...this.materiels];
    if (this.searchTerm.trim()) {
      const t = this.searchTerm.toLowerCase();
      list = list.filter(
        (m) =>
          (m.nom ?? '').toLowerCase().includes(t) ||
          (m.status ?? '').toLowerCase().includes(t) ||
          (m.salle?.nom ?? '').toLowerCase().includes(t)
      );
    }
    list.sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';
      if (this.sortColumn === 'nom') {
        aVal = (a.nom ?? '').toLowerCase();
        bVal = (b.nom ?? '').toLowerCase();
      } else if (this.sortColumn === 'status') {
        aVal = (a.status ?? '').toLowerCase();
        bVal = (b.status ?? '').toLowerCase();
      } else {
        aVal = (a.salle?.nom ?? '').toLowerCase();
        bVal = (b.salle?.nom ?? '').toLowerCase();
      }
      if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }

  /** Remaining in modal (total - assigned) */
  quantiteRestanteModal(): number {
    const v = this.materielForm?.getRawValue();
    if (!v) return 0;
    const total = Number(v.quantiteTotale ?? 0);
    const assigned = Number(v.quantiteAssociee ?? 0);
    return Math.max(0, total - assigned);
  }

  /** total - assigned; uses API field if present, else computed */
  quantiteRestante(m: Materiel): number {
    if (m.quantiteRestante != null && !Number.isNaN(m.quantiteRestante)) {
      return m.quantiteRestante;
    }
    const total = m.quantiteTotale ?? 0;
    const assigned = m.quantiteAssociee ?? 0;
    return Math.max(0, total - assigned);
  }
}
