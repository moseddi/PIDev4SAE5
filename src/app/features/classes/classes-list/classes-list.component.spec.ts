import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { ClassesListComponent } from './classes-list.component';
import { ClasseService } from '../../../core/services/classe.service';
import { Classe } from '../../../models';

const mockClasses: Classe[] = [
  { id: 1, nom: 'Classe A' },
  { id: 2, nom: 'Classe B' },
  { id: 3, nom: 'Classe C' },
];

describe('ClassesListComponent', () => {
  let component: ClassesListComponent;
  let fixture: ComponentFixture<ClassesListComponent>;
  let classeServiceSpy: jasmine.SpyObj<ClasseService>;

  beforeEach(async () => {
    classeServiceSpy = jasmine.createSpyObj('ClasseService', ['getAll', 'create', 'update', 'delete']);
    classeServiceSpy.getAll.and.returnValue(of(mockClasses));

    await TestBed.configureTestingModule({
      imports: [ClassesListComponent, ReactiveFormsModule, FormsModule, RouterTestingModule],
      providers: [{ provide: ClasseService, useValue: classeServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ClassesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load classes on init', () => {
    expect(component.classes.length).toBe(3);
    expect(component.loading).toBeFalse();
  });

  it('should set error on load failure', () => {
    classeServiceSpy.getAll.and.returnValue(throwError(() => new Error('fail')));
    component.load();
    expect(component.error).toBeTruthy();
    expect(component.loading).toBeFalse();
  });

  describe('filteredClasses', () => {
    it('should return all classes when no search term', () => {
      expect(component.filteredClasses.length).toBe(3);
    });

    it('should filter by search term', () => {
      component.searchTerm = 'Classe A';
      expect(component.filteredClasses.length).toBe(1);
      expect(component.filteredClasses[0].nom).toBe('Classe A');
    });

    it('should sort asc by default', () => {
      expect(component.filteredClasses[0].nom).toBe('Classe A');
    });

    it('should sort desc when direction is desc', () => {
      component.sortDirection = 'desc';
      expect(component.filteredClasses[0].nom).toBe('Classe C');
    });
  });

  describe('sortBy', () => {
    it('should toggle direction when same column', () => {
      component.sortBy('nom');
      expect(component.sortDirection).toBe('desc');
      component.sortBy('nom');
      expect(component.sortDirection).toBe('asc');
    });

    it('should reset direction when new column', () => {
      component.sortDirection = 'desc';
      component.sortBy('autre');
      expect(component.sortColumn).toBe('autre');
      expect(component.sortDirection).toBe('asc');
    });
  });

  describe('saveClasse', () => {
    it('should not save when form is invalid', () => {
      component.classeForm.reset();
      component.saveClasse();
      expect(classeServiceSpy.create).not.toHaveBeenCalled();
    });

    it('should call create when form is valid and not edit mode', () => {
      classeServiceSpy.create.and.returnValue(of({ id: 4, nom: 'New' }));
      component.isEditMode = false;
      component.classeForm.setValue({ nom: 'New Classe' });
      component.saveClasse();
      expect(classeServiceSpy.create).toHaveBeenCalled();
    });

    it('should call update when in edit mode', () => {
      classeServiceSpy.update.and.returnValue(of({ id: 1, nom: 'Updated' }));
      component.isEditMode = true;
      component.editingId = 1;
      component.classeForm.setValue({ nom: 'Updated Classe' });
      component.saveClasse();
      expect(classeServiceSpy.update).toHaveBeenCalledWith(1, jasmine.any(Object));
    });

    it('should set error on save failure', () => {
      classeServiceSpy.create.and.returnValue(throwError(() => new Error('fail')));
      component.isEditMode = false;
      component.classeForm.setValue({ nom: 'New Classe' });
      component.saveClasse();
      expect(component.error).toBe('Error while saving');
    });
  });

  describe('delete', () => {
    it('should call delete service and reload', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      classeServiceSpy.delete.and.returnValue(of(undefined));
      component.delete(1);
      expect(classeServiceSpy.delete).toHaveBeenCalledWith(1);
    });

    it('should not delete when confirm is cancelled', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.delete(1);
      expect(classeServiceSpy.delete).not.toHaveBeenCalled();
    });

    it('should set error on delete failure', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      classeServiceSpy.delete.and.returnValue(throwError(() => new Error('fail')));
      component.delete(1);
      expect(component.error).toBe('Error while deleting');
    });
  });
});
