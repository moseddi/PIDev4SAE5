import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { SeancesListComponent } from './seances-list.component';
import { SeanceService } from '../../../core/services/seance.service';
import { ClasseService } from '../../../core/services/classe.service';
import { Seance } from '../../../models';

const mockSeances: Seance[] = [
  { id: 1, dateDebut: '2026-05-01T09:00:00', dateFin: '2026-05-01T11:00:00', type: 'PRESENTIEL', salleId: 1 },
  { id: 2, dateDebut: '2026-05-02T14:00:00', dateFin: '2026-05-02T16:00:00', type: 'EN_LIGNE', salleId: 2 },
];

describe('SeancesListComponent', () => {
  let component: SeancesListComponent;
  let fixture: ComponentFixture<SeancesListComponent>;
  let seanceServiceSpy: jasmine.SpyObj<SeanceService>;
  let classeServiceSpy: jasmine.SpyObj<ClasseService>;

  beforeEach(async () => {
    seanceServiceSpy = jasmine.createSpyObj('SeanceService', [
      'getAll', 'create', 'update', 'delete', 'getSalles', 'getOccupiedSalles', 'getOccupiedClasses'
    ]);
    classeServiceSpy = jasmine.createSpyObj('ClasseService', ['getAll']);
    seanceServiceSpy.getAll.and.returnValue(of(mockSeances));
    seanceServiceSpy.getSalles.and.returnValue(of([{ id: 1, nom: 'Salle A', capacite: 20 }, { id: 2, nom: 'Salle B', capacite: 30 }]));
    classeServiceSpy.getAll.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [SeancesListComponent, ReactiveFormsModule, FormsModule],
      providers: [
        { provide: SeanceService, useValue: seanceServiceSpy },
        { provide: ClasseService, useValue: classeServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SeancesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load seances on init', () => {
    expect(component.seances.length).toBe(2);
    expect(component.loading).toBeFalse();
  });

  it('should set error on load failure', () => {
    seanceServiceSpy.getAll.and.returnValue(throwError(() => new Error('fail')));
    component.load();
    expect(component.error).toBeTruthy();
    expect(component.loading).toBeFalse();
  });

  it('should set sallesError on loadSalles failure', () => {
    seanceServiceSpy.getSalles.and.returnValue(throwError(() => new Error('fail')));
    component.loadSalles();
    expect(component.sallesError).toBeTruthy();
    expect(component.sallesLoading).toBeFalse();
  });

  describe('getSalleName', () => {
    it('should return salle name by id', () => {
      expect(component.getSalleName(1)).toBe('Salle A');
    });

    it('should return - when id is null', () => {
      expect(component.getSalleName(null)).toBe('-');
    });

    it('should return - when salle not found', () => {
      expect(component.getSalleName(99)).toBe('-');
    });
  });

  describe('formatDate', () => {
    it('should format ISO date string', () => {
      const result = component.formatDate('2026-05-01T09:00:00');
      expect(result).toBe('01/05/2026 09:00');
    });

    it('should return empty string for empty input', () => {
      expect(component.formatDate('')).toBe('');
    });
  });

  describe('sortBy', () => {
    it('should toggle direction on same column', () => {
      component.sortBy('dateDebut');
      expect(component.sortDirection).toBe('desc');
    });

    it('should reset on new column', () => {
      component.sortBy('type');
      expect(component.sortColumn).toBe('type');
      expect(component.sortDirection).toBe('asc');
    });
  });

  describe('filteredSeances', () => {
    it('should return all when no search term', () => {
      expect(component.filteredSeances.length).toBe(2);
    });

    it('should filter by type', () => {
      component.searchTerm = 'EN_LIGNE';
      expect(component.filteredSeances.length).toBe(1);
    });

    it('should sort by dateFin', () => {
      component.sortColumn = 'dateFin';
      expect(component.filteredSeances.length).toBe(2);
    });

    it('should sort by type', () => {
      component.sortColumn = 'type';
      expect(component.filteredSeances.length).toBe(2);
    });

    it('should sort by jour', () => {
      component.sortColumn = 'jour';
      expect(component.filteredSeances.length).toBe(2);
    });

    it('should sort by classe', () => {
      component.sortColumn = 'classe';
      expect(component.filteredSeances.length).toBe(2);
    });

    it('should sort by salle', () => {
      component.sortColumn = 'salle';
      expect(component.filteredSeances.length).toBe(2);
    });
  });

  describe('isRoomOccupied / isClassOccupied', () => {
    it('should return true when room is occupied', () => {
      component.occupiedSalles = [1, 2];
      expect(component.isRoomOccupied(1)).toBeTrue();
    });

    it('should return false when room is not occupied', () => {
      component.occupiedSalles = [];
      expect(component.isRoomOccupied(1)).toBeFalse();
    });

    it('should return true when class is occupied', () => {
      component.occupiedClasses = [3];
      expect(component.isClassOccupied(3)).toBeTrue();
    });
  });

  describe('delete', () => {
    it('should call delete on confirm', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      seanceServiceSpy.delete.and.returnValue(of(undefined));
      component.delete(1);
      expect(seanceServiceSpy.delete).toHaveBeenCalledWith(1);
    });

    it('should not delete when cancelled', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.delete(1);
      expect(seanceServiceSpy.delete).not.toHaveBeenCalled();
    });

    it('should set error on delete failure', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      seanceServiceSpy.delete.and.returnValue(throwError(() => new Error('fail')));
      component.delete(1);
      expect(component.error).toBe('Error while deleting');
    });
  });

  describe('validateDateRange', () => {
    it('should set dateRange error when fin <= debut', () => {
      component.seanceForm.patchValue({
        dateDebut: '2026-05-01T10:00',
        dateFin: '2026-05-01T09:00'
      });
      component.validateDateRange();
      expect(component.seanceForm.get('dateFin')?.errors?.['dateRange']).toBeTrue();
    });

    it('should clear dateRange error when dates are valid', () => {
      seanceServiceSpy.getOccupiedSalles.and.returnValue(of([1]));
      seanceServiceSpy.getOccupiedClasses.and.returnValue(of([2]));
      component.seanceForm.patchValue({
        dateDebut: '2026-05-01T09:00',
        dateFin: '2026-05-01T11:00'
      });
      component.validateDateRange();
      expect(component.seanceForm.get('dateFin')?.errors?.['dateRange']).toBeFalsy();
    });
  });
});
