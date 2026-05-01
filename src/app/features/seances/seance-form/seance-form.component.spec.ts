import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SeanceFormComponent } from './seance-form.component';
import { SeanceService } from '../../../core/services/seance.service';

describe('SeanceFormComponent - create mode', () => {
  let component: SeanceFormComponent;
  let fixture: ComponentFixture<SeanceFormComponent>;
  let seanceServiceSpy: jasmine.SpyObj<SeanceService>;
  let router: Router;

  beforeEach(async () => {
    seanceServiceSpy = jasmine.createSpyObj('SeanceService', ['getById', 'create', 'update', 'getSalles']);
    seanceServiceSpy.getSalles.and.returnValue(of([{ id: 1, nom: 'Salle A', capacite: 20 }]));

    await TestBed.configureTestingModule({
      imports: [SeanceFormComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: SeanceService, useValue: seanceServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SeanceFormComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load salles on init', () => {
    expect(component.salles.length).toBe(1);
    expect(component.sallesLoading).toBeFalse();
  });

  it('should set sallesError on loadSalles failure', () => {
    seanceServiceSpy.getSalles.and.returnValue(throwError(() => new Error('fail')));
    component.loadSalles();
    expect(component.sallesError).toBeTruthy();
    expect(component.sallesLoading).toBeFalse();
  });

  it('should not submit when form is invalid', () => {
    component.form.reset();
    component.submit();
    expect(seanceServiceSpy.create).not.toHaveBeenCalled();
  });

  it('should call create and navigate on valid submit', () => {
    seanceServiceSpy.create.and.returnValue(of({ warnings: [] } as any));
    const navigateSpy = spyOn(router, 'navigate');
    component.form.setValue({
      dateDebut: '2026-05-01T09:00',
      dateFin: '2026-05-01T11:00',
      type: 'PRESENTIEL',
      jour: 'Lundi',
      salleId: 1
    });
    component.submit();
    expect(seanceServiceSpy.create).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/seances'], jasmine.any(Object));
  });

  it('should set error on submit failure', () => {
    seanceServiceSpy.create.and.returnValue(throwError(() => ({ error: { message: 'Conflict' } })));
    component.form.setValue({
      dateDebut: '2026-05-01T09:00',
      dateFin: '2026-05-01T11:00',
      type: 'PRESENTIEL',
      jour: '',
      salleId: 1
    });
    component.submit();
    expect(component.error).toBe('Conflict');
    expect(component.loading).toBeFalse();
  });
});

describe('SeanceFormComponent - edit mode', () => {
  let component: SeanceFormComponent;
  let fixture: ComponentFixture<SeanceFormComponent>;
  let seanceServiceSpy: jasmine.SpyObj<SeanceService>;

  beforeEach(async () => {
    seanceServiceSpy = jasmine.createSpyObj('SeanceService', ['getById', 'create', 'update', 'getSalles']);
    seanceServiceSpy.getSalles.and.returnValue(of([]));
    seanceServiceSpy.getById.and.returnValue(of({
      id: 5, dateDebut: '2026-05-01T09:00:00', dateFin: '2026-05-01T11:00:00',
      type: 'PRESENTIEL', jour: 'Lundi', salleId: 1
    }));

    await TestBed.configureTestingModule({
      imports: [SeanceFormComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: SeanceService, useValue: seanceServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '5' } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SeanceFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load seance by id on init', () => {
    expect(seanceServiceSpy.getById).toHaveBeenCalledWith(5);
    expect(component.form.value.type).toBe('PRESENTIEL');
  });

  it('should call update when id is set', () => {
    seanceServiceSpy.update.and.returnValue(of({ warnings: [] } as any));
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate');
    component.form.setValue({
      dateDebut: '2026-05-01T09:00',
      dateFin: '2026-05-01T11:00',
      type: 'EN_LIGNE',
      jour: '',
      salleId: 1
    });
    component.submit();
    expect(seanceServiceSpy.update).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalled();
  });

  it('should set error when getById fails', () => {
    seanceServiceSpy.getById.and.returnValue(throwError(() => new Error('not found')));
    component.ngOnInit();
    expect(component.error).toBe('Séance introuvable');
  });
});
