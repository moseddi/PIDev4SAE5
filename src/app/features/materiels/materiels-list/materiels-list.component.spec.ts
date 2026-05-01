import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { MaterielsListComponent } from './materiels-list.component';
import { MaterielService } from '../../../core/services/materiel.service';
import { SalleService } from '../../../core/services/salle.service';
import { Materiel } from '../../../models';

const mockMateriels: Materiel[] = [
  { id: 1, nom: 'Projecteur', status: 'AVAILABLE', quantiteTotale: 5, quantiteAssociee: 2, seuilMaintenance: 100 },
  { id: 2, nom: 'Tableau', status: 'IN_USE', quantiteTotale: 3, quantiteAssociee: 3, seuilMaintenance: 50 },
  { id: 3, nom: 'Ordinateur', status: 'MAINTENANCE', quantiteTotale: 10, quantiteAssociee: 0, seuilMaintenance: 200 },
];

describe('MaterielsListComponent', () => {
  let component: MaterielsListComponent;
  let fixture: ComponentFixture<MaterielsListComponent>;
  let materielServiceSpy: jasmine.SpyObj<MaterielService>;
  let salleServiceSpy: jasmine.SpyObj<SalleService>;

  beforeEach(async () => {
    materielServiceSpy = jasmine.createSpyObj('MaterielService', ['getAll', 'create', 'update', 'delete']);
    salleServiceSpy = jasmine.createSpyObj('SalleService', ['getAll']);
    materielServiceSpy.getAll.and.returnValue(of(mockMateriels));
    salleServiceSpy.getAll.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [MaterielsListComponent, ReactiveFormsModule, FormsModule],
      providers: [
        { provide: MaterielService, useValue: materielServiceSpy },
        { provide: SalleService, useValue: salleServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MaterielsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load materiels on init', () => {
    expect(component.materiels.length).toBe(3);
    expect(component.loading).toBeFalse();
  });

  it('should set error on load failure', () => {
    materielServiceSpy.getAll.and.returnValue(throwError(() => new Error('fail')));
    component.load();
    expect(component.error).toBeTruthy();
    expect(component.loading).toBeFalse();
  });

  describe('filteredMateriels', () => {
    it('should return all when no search term', () => {
      expect(component.filteredMateriels.length).toBe(3);
    });

    it('should filter by nom', () => {
      component.searchTerm = 'Projecteur';
      expect(component.filteredMateriels.length).toBe(1);
    });

    it('should filter by status', () => {
      component.searchTerm = 'AVAILABLE';
      expect(component.filteredMateriels.length).toBe(1);
    });

    it('should sort by status', () => {
      component.sortColumn = 'status';
      component.sortDirection = 'asc';
      expect(component.filteredMateriels.length).toBe(3);
    });
  });

  describe('sortBy', () => {
    it('should toggle direction on same column', () => {
      component.sortBy('nom');
      expect(component.sortDirection).toBe('desc');
    });

    it('should reset on new column', () => {
      component.sortBy('status');
      expect(component.sortColumn).toBe('status');
      expect(component.sortDirection).toBe('asc');
    });
  });

  describe('quantiteRestante', () => {
    it('should return quantiteRestante from API if present', () => {
      const m: Materiel = { id: 1, nom: 'Test', status: 'AVAILABLE', quantiteRestante: 7, quantiteTotale: 10, quantiteAssociee: 3 };
      expect(component.quantiteRestante(m)).toBe(7);
    });

    it('should compute total - assigned when quantiteRestante is null', () => {
      const m: Materiel = { id: 1, nom: 'Test', status: 'AVAILABLE', quantiteTotale: 10, quantiteAssociee: 3 };
      expect(component.quantiteRestante(m)).toBe(7);
    });

    it('should return 0 when assigned > total', () => {
      const m: Materiel = { id: 1, nom: 'Test', status: 'AVAILABLE', quantiteTotale: 2, quantiteAssociee: 5 };
      expect(component.quantiteRestante(m)).toBe(0);
    });
  });

  describe('quantiteRestanteModal', () => {
    it('should compute from form values', () => {
      component.materielForm.patchValue({ quantiteTotale: 10, quantiteAssociee: 3 });
      expect(component.quantiteRestanteModal()).toBe(7);
    });
  });

  describe('saveMateriel', () => {
    it('should not save when form is invalid', () => {
      component.materielForm.reset();
      component.saveMateriel();
      expect(materielServiceSpy.create).not.toHaveBeenCalled();
    });

    it('should set error when assigned > total', () => {
      component.isEditMode = false;
      component.materielForm.setValue({
        nom: 'Test', status: 'AVAILABLE',
        quantiteTotale: 2, quantiteAssociee: 5,
        seuilMaintenance: 100, salleId: null
      });
      component.saveMateriel();
      expect(component.error).toBeTruthy();
    });

    it('should call create when not in edit mode', () => {
      materielServiceSpy.create.and.returnValue(of({ materiel: mockMateriels[0], warnings: [] }));
      component.isEditMode = false;
      component.materielForm.setValue({
        nom: 'New', status: 'AVAILABLE',
        quantiteTotale: 5, quantiteAssociee: 1,
        seuilMaintenance: 100, salleId: null
      });
      component.saveMateriel();
      expect(materielServiceSpy.create).toHaveBeenCalled();
    });

    it('should call update when in edit mode', () => {
      materielServiceSpy.update.and.returnValue(of({ materiel: mockMateriels[0], warnings: [] }));
      component.isEditMode = true;
      component.editingId = 1;
      component.materielForm.setValue({
        nom: 'Updated', status: 'AVAILABLE',
        quantiteTotale: 5, quantiteAssociee: 1,
        seuilMaintenance: 100, salleId: null
      });
      component.saveMateriel();
      expect(materielServiceSpy.update).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should skip when id is null', () => {
      component.delete(null);
      expect(materielServiceSpy.delete).not.toHaveBeenCalled();
    });

    it('should call delete on confirm', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      materielServiceSpy.delete.and.returnValue(of({ deleted: true }));
      component.delete(1);
      expect(materielServiceSpy.delete).toHaveBeenCalledWith(1);
    });

    it('should not delete when cancelled', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.delete(1);
      expect(materielServiceSpy.delete).not.toHaveBeenCalled();
    });

    it('should set error on delete failure', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      materielServiceSpy.delete.and.returnValue(throwError(() => ({ error: { message: 'fail' } })));
      component.delete(1);
      expect(component.error).toBeTruthy();
    });
  });
});
