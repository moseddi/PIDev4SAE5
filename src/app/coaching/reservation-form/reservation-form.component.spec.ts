import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ReservationFormComponent } from './reservation-form.component';
import { CoachingService, Reservation } from '../service/coaching.service';
import { of, throwError } from 'rxjs';

describe('ReservationFormComponent', () => {
  let component: ReservationFormComponent;
  let fixture: ComponentFixture<ReservationFormComponent>;
  let coachingServiceSpy: jasmine.SpyObj<CoachingService>;
  let router: Router;

  const mockReservation: Reservation = { id: 1, studidname: 'Alice', merenumber: '2026-05-01', status: 'CONFIRMED' };

  beforeEach(async () => {
    coachingServiceSpy = jasmine.createSpyObj('CoachingService', ['getReservationById', 'createReservation', 'updateReservation']);
    coachingServiceSpy.getReservationById.and.returnValue(of(mockReservation));
    coachingServiceSpy.createReservation.and.returnValue(of(mockReservation));
    coachingServiceSpy.updateReservation.and.returnValue(of(mockReservation));

    await TestBed.configureTestingModule({
      imports: [ReservationFormComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: CoachingService, useValue: coachingServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationFormComponent);
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

  it('should call createReservation when seanceId is set', () => {
    component.seanceId = 1;
    component.reservation = { studidname: 'Alice', merenumber: '2026-05-01', status: 'CONFIRMED' };
    component.onSubmit();
    expect(coachingServiceSpy.createReservation).toHaveBeenCalledWith(1, component.reservation);
  });

  it('should call updateReservation in edit mode', () => {
    component.isEditMode = true;
    component.reservationId = 1;
    component.reservation = mockReservation;
    component.onSubmit();
    expect(coachingServiceSpy.updateReservation).toHaveBeenCalledWith(1, mockReservation);
  });

  it('should show error notification on create failure', () => {
    coachingServiceSpy.createReservation.and.returnValue(throwError(() => new Error('Error')));
    component.seanceId = 1;
    component.reservation = { studidname: 'Alice', merenumber: '2026-05-01', status: 'CONFIRMED' };
    component.onSubmit();
    expect(component.notification?.type).toBe('error');
  });

  it('should show notification', () => {
    component.showNotification('Created!', 'success');
    expect(component.notification?.message).toBe('Created!');
  });
});
