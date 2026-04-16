import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ClasseService } from '../../../core/services/classe.service';
import { Classe } from '../../../models';

declare var bootstrap: any;

@Component({
  selector: 'app-classes-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: './classes-list.component.html',
  styleUrl: './classes-list.component.css',
})
export class ClassesListComponent implements OnInit {
  classes: Classe[] = [];
  loading = true;
  error: string | null = null;
  searchTerm: string = '';
  sortColumn: string = 'nom';
  sortDirection: 'asc' | 'desc' = 'asc';
  classeForm!: FormGroup;
  isEditMode = false;
  editingId: number | null = null;
  private modalInstance: any;

  constructor(
    private classeService: ClasseService,
    private fb: FormBuilder
  ) {
    this.classeForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(/^[a-zA-ZÀ-ÿ0-9\s\-_]+$/)]],
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.classeService.getAll().subscribe({
      next: (data) => {
        this.classes = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Unable to load classes. Please ensure the API Gateway (port 8089) and classe-seance service are running.';
        this.loading = false;
      },
    });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.editingId = null;
    this.classeForm.reset();
    const modalElement = document.getElementById('classeModal');
    if (modalElement) {
      this.modalInstance = new bootstrap.Modal(modalElement);
      this.modalInstance.show();
    }
  }

  openEditModal(classe: Classe): void {
    this.isEditMode = true;
    this.editingId = classe.id!;
    this.classeForm.patchValue({ nom: classe.nom });
    const modalElement = document.getElementById('classeModal');
    if (modalElement) {
      this.modalInstance = new bootstrap.Modal(modalElement);
      this.modalInstance.show();
    }
  }

  saveClasse(): void {
    this.classeForm.markAllAsTouched();
    if (this.classeForm.invalid) return;
    const value = this.classeForm.getRawValue();
    const req = this.isEditMode && this.editingId
      ? this.classeService.update(this.editingId, { id: this.editingId, ...value })
      : this.classeService.create(value);

    req.subscribe({
      next: () => {
        if (this.modalInstance) {
          this.modalInstance.hide();
        }
        this.load();
      },
      error: () => {
        this.error = 'Error while saving';
      },
    });
  }

  delete(id: number): void {
    if (!confirm('Delete this class?')) return;
    this.classeService.delete(id).subscribe({
      next: () => this.load(),
      error: () => (this.error = 'Error while deleting'),
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

  get filteredClasses(): Classe[] {
    let result = this.classes;

    // Filter
    if (this.searchTerm) {
      const lowerTerm = this.searchTerm.toLowerCase();
      result = result.filter(c => c.nom.toLowerCase().includes(lowerTerm));
    }

    // Sort
    result = [...result].sort((a, b) => {
      let valA = a.nom.toLowerCase();
      let valB = b.nom.toLowerCase();

      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }
}
