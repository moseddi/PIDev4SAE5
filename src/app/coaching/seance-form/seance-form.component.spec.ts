import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { SeanceFormComponent } from './seance-form.component';
import { CoachingService, Seance } from '../service/coaching.service';
import { of, throwError } from 'rxjs';

describe('SeanceFormComponent', () => {
  let component: SeanceFormComponent;
  let fixture: ComponentFixture<SeanceFormComponent>;
  let coachingServiceSpy: jasmine.SpyObj<CoachingService>;
  let router: Router;

  const mockSeance: Seance = { id: 1, goodName: 'Session 1', seanceDate: '2026-05-01', seanceTime: '10:00:00' };

  beforeEach(async () => {
    coachingServiceSpy = jasmine.createSpyObj('CoachingService', ['getSeanceById', 'createSeance', 'updateSeance']);
    coachingServiceSpy.getSeanceById.and.returnValue(of(mockSeance));
    coachingServiceSpy.createSeance.and.returnValue(of(mockSeance));
    coachingServiceSpy.updateSeance.and.returnValue(of(mockSeance));

    await TestBed.configureTestingModule({
      imports: [SeanceFormComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: CoachingService, useValue: coachingServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SeanceFormComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be in create mode when no id in route', () => {
    expect(component.isEditMode).toBeFalse();
  });

  it('should call createSeance on submit in create mode', () => {
    component.seance = { goodName: 'New', seanceDate: '2026-06-01', seanceTime: '09:00' };
    component.onSubmit();
    expect(coachingServiceSpy.createSeance).toHaveBeenCalled();
  });

  it('should call updateSeance on submit in edit mode', () => {
    component.isEditMode = true;
    component.seanceId = 1;
    component.seance = mockSeance;
    component.onSubmit();
    expect(coachingServiceSpy.updateSeance).toHaveBeenCalledWith(1, mockSeance);
  });

  it('should show error notification on create failure', () => {
    coachingServiceSpy.createSeance.and.returnValue(throwError(() => new Error('Error')));
    component.seance = { goodName: 'New', seanceDate: '2026-06-01', seanceTime: '09:00' };
    component.onSubmit();
    expect(component.notification?.type).toBe('error');
  });

  it('should show notification', () => {
    component.showNotification('Saved!', 'success');
    expect(component.notification?.message).toBe('Saved!');
  });
});
