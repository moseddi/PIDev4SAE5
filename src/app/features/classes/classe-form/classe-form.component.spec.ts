import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ClasseFormComponent } from './classe-form.component';
import { ClasseService } from '../../../core/services/classe.service';

describe('ClasseFormComponent', () => {
  let component: ClasseFormComponent;
  let fixture: ComponentFixture<ClasseFormComponent>;
  let classeServiceSpy: jasmine.SpyObj<ClasseService>;
  let router: Router;

  beforeEach(async () => {
    classeServiceSpy = jasmine.createSpyObj('ClasseService', ['getById', 'create', 'update']);

    await TestBed.configureTestingModule({
      imports: [ClasseFormComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: ClasseService, useValue: classeServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClasseFormComponent);
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
    expect(classeServiceSpy.create).not.toHaveBeenCalled();
  });

  it('should call create when no id', () => {
    classeServiceSpy.create.and.returnValue(of({ id: 1, nom: 'Test' }));
    const navigateSpy = spyOn(router, 'navigate');
    component.form.setValue({ nom: 'Test Classe' });
    component.submit();
    expect(classeServiceSpy.create).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/classes']);
  });

  it('should set error on submit failure', () => {
    classeServiceSpy.create.and.returnValue(throwError(() => new Error('fail')));
    component.form.setValue({ nom: 'Test Classe' });
    component.submit();
    expect(component.error).toBeTruthy();
    expect(component.loading).toBeFalse();
  });
});

describe('ClasseFormComponent - edit mode', () => {
  let component: ClasseFormComponent;
  let fixture: ComponentFixture<ClasseFormComponent>;
  let classeServiceSpy: jasmine.SpyObj<ClasseService>;

  beforeEach(async () => {
    classeServiceSpy = jasmine.createSpyObj('ClasseService', ['getById', 'create', 'update']);
    classeServiceSpy.getById.and.returnValue(of({ id: 5, nom: 'Existing' }));

    await TestBed.configureTestingModule({
      imports: [ClasseFormComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: ClasseService, useValue: classeServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '5' } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ClasseFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load classe by id on init', () => {
    expect(classeServiceSpy.getById).toHaveBeenCalledWith(5);
    expect(component.form.value.nom).toBe('Existing');
  });

  it('should call update when id is set', () => {
    classeServiceSpy.update.and.returnValue(of({ id: 5, nom: 'Updated' }));
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate');
    component.form.setValue({ nom: 'Updated Classe' });
    component.submit();
    expect(classeServiceSpy.update).toHaveBeenCalledWith(5, jasmine.any(Object));
    expect(navigateSpy).toHaveBeenCalledWith(['/classes']);
  });

  it('should set error when getById fails', () => {
    classeServiceSpy.getById.and.returnValue(throwError(() => new Error('not found')));
    component.ngOnInit();
    expect(component.error).toBe('Classe introuvable');
  });
});
