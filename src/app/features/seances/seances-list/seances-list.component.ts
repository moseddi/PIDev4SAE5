import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { SeanceService } from '../../../core/services/seance.service';
import { ClasseService } from '../../../core/services/classe.service';
import { Seance, TypeSeance, Classe, SalleDTO, SeanceSaveResponse } from '../../../models';

declare var bootstrap: any;

@Component({
  selector: 'app-seances-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './seances-list.component.html',
  styleUrl: './seances-list.component.css',
})
export class SeancesListComponent implements OnInit {
  seances: Seance[] = [];
  classes: Classe[] = [];
  salles: SalleDTO[] = [];
  sallesLoading = false;
  sallesError: string | null = null;
  occupiedSalles: number[] = [];
  occupiedClasses: number[] = [];
  checkingAvailability = false;

  loading = true;
  error: string | null = null;
  modalError: string | null = null;
  modalWarnings: string[] = [];
  pageWarnings: string[] = [];
  searchTerm: string = '';
  sortColumn: string = 'dateDebut';
  sortDirection: 'asc' | 'desc' = 'asc';
  seanceForm!: FormGroup;
  isEditMode = false;
  editingId: number | null = null;
  types: TypeSeance[] = ['PRESENTIEL', 'EN_LIGNE'];
  private modalInstance: any;

  constructor(
    private seanceService: SeanceService,
    private classeService: ClasseService,
    private fb: FormBuilder
  ) {
    this.seanceForm = this.fb.group({
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required],
      type: ['PRESENTIEL', Validators.required],
      jour: ['', [Validators.maxLength(50), Validators.pattern(/^[a-zA-ZÀ-ÿ\s]*$/)]],
      classeId: [null as number | null],
      salleId: [null as number | null, Validators.required],
    });

    this.seanceForm.get('dateDebut')?.valueChanges.subscribe(() => this.validateDateRange());
    this.seanceForm.get('dateFin')?.valueChanges.subscribe(() => this.validateDateRange());
  }

  validateDateRange(): void {
    const dateDebutControl = this.seanceForm.get('dateDebut');
    const dateFinControl = this.seanceForm.get('dateFin');
    const dateDebut = dateDebutControl?.value;
    const dateFin = dateFinControl?.value;

    if (dateDebut && dateFin) {
      const debut = new Date(dateDebut);
      const fin = new Date(dateFin);
      if (fin <= debut) {
        const currentErrors = dateFinControl?.errors || {};
        dateFinControl?.setErrors({ ...currentErrors, dateRange: true });
        this.occupiedSalles = [];
        this.occupiedClasses = [];
      } else {
        const currentErrors = dateFinControl?.errors;
        if (currentErrors && currentErrors['dateRange']) {
          const { dateRange, ...otherErrors } = currentErrors;
          dateFinControl?.setErrors(Object.keys(otherErrors).length === 0 ? null : otherErrors);
        }

        // Fetch occupied rooms and classes if dates are valid
        this.checkAvailability(dateDebut + ':00', dateFin + ':00');
      }
    } else {
      this.occupiedSalles = [];
      this.occupiedClasses = [];
    }
  }

  checkAvailability(debut: string, fin: string): void {
    this.checkingAvailability = true;
    const excludeId = this.isEditMode ? this.editingId : null;

    this.seanceService.getOccupiedSalles(debut, fin, excludeId).subscribe({
      next: (occupiedIds) => {
        this.occupiedSalles = occupiedIds;
        this.checkClassesAvailability(debut, fin, excludeId);
      },
      error: (err) => {
        console.error('Error fetching occupied rooms', err);
        this.checkClassesAvailability(debut, fin, excludeId);
      }
    });
  }

  checkClassesAvailability(debut: string, fin: string, excludeId: number | null): void {
    this.seanceService.getOccupiedClasses(debut, fin, excludeId).subscribe({
      next: (occupiedIds) => {
        this.occupiedClasses = occupiedIds;
        this.checkingAvailability = false;
      },
      error: (err) => {
        console.error('Error fetching occupied classes', err);
        this.checkingAvailability = false;
      }
    });
  }

  isRoomOccupied(salleId: number): boolean {
    return this.occupiedSalles.includes(salleId);
  }

  isClassOccupied(classeId: number): boolean {
    return this.occupiedClasses.includes(classeId);
  }

  ngOnInit(): void {
    const navState = history.state as { seanceWarnings?: string[] };
    if (Array.isArray(navState?.seanceWarnings) && navState.seanceWarnings.length > 0) {
      this.pageWarnings = [...navState.seanceWarnings];
    }
    this.load();
    this.loadSalles();
    this.classeService.getAll().subscribe((data) => (this.classes = data));
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.seanceService.getAll().subscribe({
      next: (data) => {
        this.seances = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Unable to load sessions. Please ensure the API Gateway (port 8089) and classe-seance service are running.';
        this.loading = false;
      },
    });
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
        this.sallesError = 'Unable to load rooms. Please ensure the API Gateway (port 8089) and salles-materiels service are running.';
        this.sallesLoading = false;
      },
    });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.editingId = null;
    this.modalError = null;
    this.modalWarnings = [];
    this.seanceForm.reset({ type: 'PRESENTIEL' });
    const modalElement = document.getElementById('seanceModal');
    if (modalElement) {
      this.modalInstance = new bootstrap.Modal(modalElement);
      this.modalInstance.show();
    }
  }

  openEditModal(seance: Seance): void {
    this.isEditMode = true;
    this.editingId = seance.id!;
    this.modalError = null;
    this.modalWarnings = [];
    this.seanceForm.patchValue({
      dateDebut: this.toDatetimeLocal(seance.dateDebut),
      dateFin: this.toDatetimeLocal(seance.dateFin),
      type: seance.type,
      jour: seance.jour ?? '',
      classeId: seance.classe?.id ?? null,
      salleId: seance.salleId ?? null,
    });
    const modalElement = document.getElementById('seanceModal');
    if (modalElement) {
      this.modalInstance = new bootstrap.Modal(modalElement);
      this.modalInstance.show();
    }
  }

  private toDatetimeLocal(iso: string): string {
    if (!iso) return '';
    // Expected incoming format from backend: "YYYY-MM-DDTHH:mm:ss"
    return iso.slice(0, 16);
  }

  saveSeance(): void {
    this.seanceForm.markAllAsTouched();
    if (this.seanceForm.invalid) return;
    this.modalError = null;
    this.modalWarnings = [];

    const v = this.seanceForm.getRawValue();
    const body: Seance = {
      dateDebut: v.dateDebut ? v.dateDebut + ':00' : '',
      dateFin: v.dateFin ? v.dateFin + ':00' : '',
      type: v.type,
      jour: v.jour || undefined,
      salleId: v.salleId,
    };
    const classeId: number | null = v.classeId ?? null;

    const req = this.isEditMode && this.editingId
      ? this.seanceService.update(this.editingId, body, classeId)
      : this.seanceService.create(body, classeId);

    req.subscribe({
      next: (response: SeanceSaveResponse) => {
        this.modalWarnings = response?.warnings ?? [];
        this.pageWarnings = [...this.modalWarnings];
        if (this.modalInstance) this.modalInstance.hide();
        this.load();
      },
      error: (err) => {
        if (err.error instanceof ErrorEvent) {
          this.modalError = 'Network error: ' + err.error.message;
        } else if (err?.error?.message) {
          this.modalError = err.error.message;
        } else if (typeof err.error === 'string') {
          this.modalError = err.error;
        } else if (err.error?.text) {
          this.modalError = err.error.text;
        } else if (err.message) {
          this.modalError = 'Error: ' + err.message;
          if (typeof err.error === 'object' && !err.error.text && err.status === 400) {
            console.error('Backend returned 400 with object:', err.error);
          }
        } else {
          this.modalError = 'Error while saving';
        }
      },
    });
  }

  delete(id: number): void {
    if (!confirm('Delete this session?')) return;
    this.seanceService.delete(id).subscribe({
      next: () => this.load(),
      error: () => (this.error = 'Error while deleting'),
    });
  }

  formatDate(d: string): string {
    if (!d) return '';
    // Split "YYYY-MM-DDTHH:mm:ss" and manually format
    const parts = d.split('T');
    if (parts.length < 2) return d;
    const dateParts = parts[0].split('-');
    const timeParts = parts[1].split(':');
    return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]} ${timeParts[0]}:${timeParts[1]}`;
  }

  getSalleName(salleId: number | null | undefined): string {
    if (!salleId) return '-';
    const salle = this.salles.find(s => s.id === salleId);
    return salle ? salle.nom : '-';
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  get filteredSeances(): Seance[] {
    let result = this.seances;

    // 1. Filter
    if (this.searchTerm) {
      const lowerTerm = this.searchTerm.toLowerCase();
      result = result.filter(s => {
        const typeMatch = s.type?.toLowerCase().includes(lowerTerm) || false;
        const jourMatch = s.jour?.toLowerCase().includes(lowerTerm) || false;
        const classeMatch = s.classe?.nom?.toLowerCase().includes(lowerTerm) || false;
        const salleMatch = this.getSalleName(s.salleId).toLowerCase().includes(lowerTerm);
        return typeMatch || jourMatch || classeMatch || salleMatch;
      });
    }

    // 2. Sort
    result = [...result].sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      switch (this.sortColumn) {
        case 'dateDebut':
          valA = a.dateDebut ? new Date(a.dateDebut).getTime() : 0;
          valB = b.dateDebut ? new Date(b.dateDebut).getTime() : 0;
          break;
        case 'dateFin':
          valA = a.dateFin ? new Date(a.dateFin).getTime() : 0;
          valB = b.dateFin ? new Date(b.dateFin).getTime() : 0;
          break;
        case 'type':
          valA = a.type || '';
          valB = b.type || '';
          break;
        case 'jour':
          valA = a.jour || '';
          valB = b.jour || '';
          break;
        case 'classe':
          valA = a.classe?.nom || '';
          valB = b.classe?.nom || '';
          break;
        case 'salle':
          valA = this.getSalleName(a.salleId);
          valB = this.getSalleName(b.salleId);
          break;
      }

      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }
}