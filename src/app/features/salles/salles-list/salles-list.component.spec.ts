import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { SallesListComponent } from './salles-list.component';
import { SalleService } from '../../../core/services/salle.service';
import { Salle } from '../../../models';

const mockSalles: Salle[] = [
  { id: 1, nom: 'Salle A', capacite: 20, materiels: [] },
  { id: 2, nom: 'Salle B', capacite: 30, materiels: [] },
  { id: 3, nom: 'Salle C', capacite: 10, materiels: [] },
];

describe('SallesListComponent', () => {
  let component: SallesListComponent;
  let fixture: ComponentFixture<SallesListComponent>;
  let salleServiceSpy: jasmine.SpyObj<SalleService>;

  beforeEach(async () => {
    salleServiceSpy = jasmine.createSpyObj('SalleService', ['getAll', 'create', 'update', 'delete']);
    salleServiceSpy.getAll.and.returnValue(of(mockSalles));

    await TestBed.configureTestingModule({
      imports: [SallesListComponent, ReactiveFormsModule, FormsModule],
      providers: [{ provide: SalleService, useValue: salleServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(SallesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load salles on init', () => {
    expect(component.salles.length).toBe(3);
    expect(component.loading).toBeFalse();
  });

  it('should set error on load failure', () => {
    salleServiceSpy.getAll.and.returnValue(throwError(() => ({ status: 500 })));
    component.load();
    expect(component.error).toBeTruthy();
    expect(component.loading).toBeFalse();
  });

  describe('filteredSalles', () => {
    it('should return all salles when no search term', () => {
      expect(component.filteredSalles.length).toBe(3);
    });

    it('should filter by search term', () => {
      component.searchTerm = 'Salle A';
      expect(component.filteredSalles.length).toBe(1);
    });

    it('should sort by capacite', () => {
      component.sortColumn = 'capacite';
      component.sortDirection = 'asc';
      const sorted = component.filteredSalles;
      expect(sorted[0].capacite).toBe(10);
    });

    it('should sort by materiels count', () => {
      component.sortColumn = 'materiels';
      component.sortDirection = 'asc';
      expect(component.filteredSalles.length).toBe(3);
    });
  });

  describe('sortBy', () => {
    it('should toggle direction on same column', () => {
      component.sortBy('nom');
      expect(component.sortDirection).toBe('desc');
    });

    it('should reset direction on new column', () => {
      component.sortBy('capacite');
      expect(component.sortColumn).toBe('capacite');
      expect(component.sortDirection).toBe('asc');
    });
  });

  describe('saveSalle', () => {
    it('should not save when form is invalid', () => {
      component.salleForm.reset();
      component.saveSalle();
      expect(salleServiceSpy.create).not.toHaveBeenCalled();
    });

    it('should call create when not in edit mode', () => {
      salleServiceSpy.create.and.returnValue(of({ id: 4, nom: 'New', capacite: 15, materiels: [] }));
      component.isEditMode = false;
      component.salleForm.setValue({ nom: 'New Salle', capacite: 15 });
      component.saveSalle();
      expect(salleServiceSpy.create).toHaveBeenCalled();
    });

    it('should call update when in edit mode', () => {
      salleServiceSpy.update.and.returnValue(of({ id: 1, nom: 'Updated', capacite: 25, materiels: [] }));
      component.isEditMode = true;
      component.editingId = 1;
      component.salleForm.setValue({ nom: 'Updated Salle', capacite: 25 });
      component.saveSalle();
      expect(salleServiceSpy.update).toHaveBeenCalledWith(1, jasmine.any(Object));
    });

    it('should set error on save failure', () => {
      salleServiceSpy.create.and.returnValue(throwError(() => ({ error: { message: 'fail' } })));
      component.isEditMode = false;
      component.salleForm.setValue({ nom: 'New Salle', capacite: 15 });
      component.saveSalle();
      expect(component.error).toBeTruthy();
    });
  });

  describe('delete', () => {
    it('should call delete and reload on confirm', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      salleServiceSpy.delete.and.returnValue(of(undefined));
      component.delete(1);
      expect(salleServiceSpy.delete).toHaveBeenCalledWith(1);
    });

    it('should not delete when cancelled', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.delete(1);
      expect(salleServiceSpy.delete).not.toHaveBeenCalled();
    });

    it('should set error on delete failure', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      salleServiceSpy.delete.and.returnValue(throwError(() => ({ error: { message: 'fail' } })));
      component.delete(1);
      expect(component.error).toBeTruthy();
    });
  });
});
