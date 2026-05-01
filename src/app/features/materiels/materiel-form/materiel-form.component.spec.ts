import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MaterielFormComponent } from './materiel-form.component';
import { MaterielService } from '../../../core/services/materiel.service';
import { SalleService } from '../../../core/services/salle.service';

describe('MaterielFormComponent - create mode', () => {
  let component: MaterielFormComponent;
  let fixture: ComponentFixture<MaterielFormComponent>;
  let materielServiceSpy: jasmine.SpyObj<MaterielService>;
  let salleServiceSpy: jasmine.SpyObj<SalleService>;
  let router: Router;

  beforeEach(async () => {
    materielServiceSpy = jasmine.createSpyObj('MaterielService', ['getById', 'create', 'update']);
    salleServiceSpy = jasmine.createSpyObj('SalleService', ['getAll']);
    salleServiceSpy.getAll.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [MaterielFormComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: MaterielService, useValue: materielServiceSpy },
        { provide: SalleService, useValue: salleServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MaterielFormComponent);
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
    expect(materielServiceSpy.create).not.toHaveBeenCalled();
  });

  it('should set error when assigned > total', () => {
    component.form.setValue({ nom: 'Test', status: 'AVAILABLE', quantiteTotale: 2, quantiteAssociee: 5, seuilMaintenance: 100, salleId: null });
    component.submit();
    expect(component.error).toBeTruthy();
    expect(component.loading).toBeFalse();
  });

  it('should call create and navigate on valid submit', () => {
    materielServiceSpy.create.and.returnValue(of({ materiel: {} as any, warnings: [] }));
    const navigateSpy = spyOn(router, 'navigate');
    component.form.setValue({ nom: 'Projecteur', status: 'AVAILABLE', quantiteTotale: 5, quantiteAssociee: 1, seuilMaintenance: 100, salleId: null });
    component.submit();
    expect(materielServiceSpy.create).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/materiels']);
  });

  it('should set error on create failure', () => {
    materielServiceSpy.create.and.returnValue(throwError(() => ({ error: { message: 'fail' } })));
    component.form.setValue({ nom: 'Projecteur', status: 'AVAILABLE', quantiteTotale: 5, quantiteAssociee: 1, seuilMaintenance: 100, salleId: null });
    component.submit();
    expect(component.error).toBeTruthy();
    expect(component.loading).toBeFalse();
  });

  describe('quantiteRestanteDisplay', () => {
    it('should compute total - assigned', () => {
      component.form.patchValue({ quantiteTotale: 10, quantiteAssociee: 3 });
      expect(component.quantiteRestanteDisplay()).toBe(7);
    });

    it('should return 0 when assigned > total', () => {
      component.form.patchValue({ quantiteTotale: 2, quantiteAssociee: 8 });
      expect(component.quantiteRestanteDisplay()).toBe(0);
    });
  });
});

describe('MaterielFormComponent - edit mode', () => {
  let component: MaterielFormComponent;
  let fixture: ComponentFixture<MaterielFormComponent>;
  let materielServiceSpy: jasmine.SpyObj<MaterielService>;
  let salleServiceSpy: jasmine.SpyObj<SalleService>;

  beforeEach(async () => {
    materielServiceSpy = jasmine.createSpyObj('MaterielService', ['getById', 'create', 'update']);
    salleServiceSpy = jasmine.createSpyObj('SalleService', ['getAll']);
    salleServiceSpy.getAll.and.returnValue(of([]));
    materielServiceSpy.getById.and.returnValue(of({
      id: 2, nom: 'Tableau', status: 'IN_USE',
      quantiteTotale: 3, quantiteAssociee: 1, seuilMaintenance: 50,
      salle: { id: 1, nom: 'S1', capacite: 20, materiels: [] }
    }));

    await TestBed.configureTestingModule({
      imports: [MaterielFormComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: MaterielService, useValue: materielServiceSpy },
        { provide: SalleService, useValue: salleServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '2' } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MaterielFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load materiel by id on init', () => {
    expect(materielServiceSpy.getById).toHaveBeenCalledWith(2);
    expect(component.form.value.nom).toBe('Tableau');
  });

  it('should call update when id is set', () => {
    materielServiceSpy.update.and.returnValue(of({ materiel: {} as any, warnings: [] }));
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate');
    component.form.setValue({ nom: 'Updated', status: 'AVAILABLE', quantiteTotale: 5, quantiteAssociee: 1, seuilMaintenance: 100, salleId: null });
    component.submit();
    expect(materielServiceSpy.update).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/materiels']);
  });

  it('should set error when getById fails', () => {
    materielServiceSpy.getById.and.returnValue(throwError(() => new Error('not found')));
    component.ngOnInit();
    expect(component.error).toBe('Matériel introuvable');
  });
});
