import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ReservationListComponent } from './reservation-list.component';
import { CoachingService, Reservation } from '../service/coaching.service';
import { of, throwError } from 'rxjs';

describe('ReservationListComponent', () => {
  let component: ReservationListComponent;
  let fixture: ComponentFixture<ReservationListComponent>;
  let coachingServiceSpy: jasmine.SpyObj<CoachingService>;
  let router: Router;

  const mockReservations: Reservation[] = [
    { id: 1, studidname: 'Alice', merenumber: '2026-05-01', status: 'CONFIRMED' },
    { id: 2, studidname: 'Bob', merenumber: '2026-05-02', status: 'PENDING' }
  ];

  beforeEach(async () => {
    coachingServiceSpy = jasmine.createSpyObj('CoachingService', ['getAllReservations', 'getReservationsBySeance', 'deleteReservation']);
    coachingServiceSpy.getAllReservations.and.returnValue(of(mockReservations));

    await TestBed.configureTestingModule({
      imports: [ReservationListComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: CoachingService, useValue: coachingServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReservationListComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load all reservations when no seanceId', () => {
    expect(component.reservations.length).toBe(2);
    expect(component.loading).toBeFalse();
  });

  it('should show error notification on load failure', () => {
    coachingServiceSpy.getAllReservations.and.returnValue(throwError(() => new Error('Error')));
    component.loadAllReservations();
    expect(component.notification?.type).toBe('error');
  });

  describe('getStatusClass', () => {
    it('should return confirmed class', () => {
      expect(component.getStatusClass('CONFIRMED')).toBe('status-confirmed');
    });

    it('should return cancelled class', () => {
      expect(component.getStatusClass('CANCELLED')).toBe('status-cancelled');
    });

    it('should return pending class', () => {
      expect(component.getStatusClass('PENDING')).toBe('status-pending');
    });

    it('should return default class for unknown status', () => {
      expect(component.getStatusClass('UNKNOWN')).toBe('status-default');
    });
  });

  it('should not delete reservation without id', () => {
    const reservation: Reservation = { studidname: 'No ID', merenumber: '2026-05-01', status: 'PENDING' };
    component.deleteReservation(reservation);
    expect(coachingServiceSpy.deleteReservation).not.toHaveBeenCalled();
  });
});
