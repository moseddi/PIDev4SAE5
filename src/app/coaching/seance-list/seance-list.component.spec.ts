import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SeanceListComponent } from './seance-list.component';
import { CoachingService, Seance } from '../service/coaching.service';
import { of, throwError } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('SeanceListComponent', () => {
  let component: SeanceListComponent;
  let fixture: ComponentFixture<SeanceListComponent>;
  let coachingServiceSpy: jasmine.SpyObj<CoachingService>;

  const mockSeances: Seance[] = [
    { id: 1, goodName: 'Session A', seanceDate: '2026-05-01', seanceTime: '10:00:00' },
    { id: 2, goodName: 'Session B', seanceDate: '2026-05-02', seanceTime: '14:00:00' }
  ];

  beforeEach(async () => {
    coachingServiceSpy = jasmine.createSpyObj('CoachingService', ['getAllSeances', 'deleteSeance']);
    coachingServiceSpy.getAllSeances.and.returnValue(of(mockSeances));

    await TestBed.configureTestingModule({
      imports: [SeanceListComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [{ provide: CoachingService, useValue: coachingServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(SeanceListComponent);
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

  it('should show error notification on load failure', () => {
    coachingServiceSpy.getAllSeances.and.returnValue(throwError(() => new Error('Error')));
    component.loadSeances();
    expect(component.notification?.type).toBe('error');
  });

  it('should not delete seance without id', () => {
    const seance: Seance = { goodName: 'No ID', seanceDate: '2026-05-01', seanceTime: '10:00' };
    component.deleteSeance(seance);
    expect(coachingServiceSpy.deleteSeance).not.toHaveBeenCalled();
  });

  it('should show notification', () => {
    component.showNotification('Test', 'success');
    expect(component.notification?.message).toBe('Test');
    expect(component.notification?.type).toBe('success');
  });
});
