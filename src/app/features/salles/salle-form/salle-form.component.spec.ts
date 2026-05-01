import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SalleFormComponent } from './salle-form.component';
import { SalleService } from '../../../core/services/salle.service';

describe('SalleFormComponent - create mode', () => {
  let component: SalleFormComponent;
  let fixture: ComponentFixture<SalleFormComponent>;
  let salleServiceSpy: jasmine.SpyObj<SalleService>;
  let router: Router;

  beforeEach(async () => {
    salleServiceSpy = jasmine.createSpyObj('SalleService', ['getById', 'create', 'update']);

    await TestBed.configureTestingModule({
      imports: [SalleFormComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: SalleService, useValue: salleServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SalleFormComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not submit when form is invalid', () => {
    component.form.reset();
    component.submit();
    expect(salleServiceSpy.create).not.toHaveBeenCalled();
  });

  it('should call create and navigate on valid submit', () => {
    salleServiceSpy.create.and.returnValue(of({ id: 1, nom: 'S1', capacite: 20, materiels: [] }));
    const navigateSpy = spyOn(router, 'navigate');
    component.form.setValue({ nom: 'Salle Test', capacite: 20 });
    component.submit();
    expect(salleServiceSpy.create).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/salles']);
  });

  it('should set error on submit failure', () => {
    salleServiceSpy.create.and.returnValue(throwError(() => new Error('fail')));
    component.form.setValue({ nom: 'Salle Test', capacite: 20 });
    component.submit();
    expect(component.error).toBeTruthy();
    expect(component.loading).toBeFalse();
  });
});

describe('SalleFormComponent - edit mode', () => {
  let component: SalleFormComponent;
  let fixture: ComponentFixture<SalleFormComponent>;
  let salleServiceSpy: jasmine.SpyObj<SalleService>;

  beforeEach(async () => {
    salleServiceSpy = jasmine.createSpyObj('SalleService', ['getById', 'create', 'update']);
    salleServiceSpy.getById.and.returnValue(of({ id: 3, nom: 'Existing', capacite: 50, materiels: [] }));

    await TestBed.configureTestingModule({
      imports: [SalleFormComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: SalleService, useValue: salleServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '3' } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SalleFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load salle by id on init', () => {
    expect(salleServiceSpy.getById).toHaveBeenCalledWith(3);
    expect(component.form.value.nom).toBe('Existing');
  });

  it('should call update when id is set', () => {
    salleServiceSpy.update.and.returnValue(of({ id: 3, nom: 'Updated', capacite: 60, materiels: [] }));
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate');
    component.form.setValue({ nom: 'Updated Salle', capacite: 60 });
    component.submit();
    expect(salleServiceSpy.update).toHaveBeenCalledWith(3, jasmine.any(Object));
    expect(navigateSpy).toHaveBeenCalledWith(['/salles']);
  });

  it('should set error when getById fails', () => {
    salleServiceSpy.getById.and.returnValue(throwError(() => new Error('not found')));
    component.ngOnInit();
    expect(component.error).toBe('Salle introuvable');
  });
});
