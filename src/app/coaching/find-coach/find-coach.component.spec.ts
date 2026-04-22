import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FindCoachComponent } from './find-coach.component';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { CoachingService, Seance } from '../service/coaching.service';
import { of, throwError } from 'rxjs';
import { KeycloakService } from 'keycloak-angular';

describe('FindCoachComponent', () => {
  let component: FindCoachComponent;
  let fixture: ComponentFixture<FindCoachComponent>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let coachingServiceSpy: jasmine.SpyObj<CoachingService>;

  const mockUsers = [
    { id: 1, firstName: 'Alice', lastName: 'Smith', email: 'alice@test.com', role: 'TUTOR' },
    { id: 2, firstName: 'Bob', lastName: 'Jones', email: 'bob@test.com', role: 'STUDENT' }
  ];

  const mockSeances: Seance[] = [
    { id: 1, goodName: 'Session 1', seanceDate: '2026-05-01', seanceTime: '10:00:00' }
  ];

  beforeEach(async () => {
    userServiceSpy = jasmine.createSpyObj('UserService', ['getAllUsers']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getUser', 'getToken', 'isLoggedIn']);
    coachingServiceSpy = jasmine.createSpyObj('CoachingService', ['getSeancesByTutor', 'createReservation', 'createSeanceForTutor']);

    userServiceSpy.getAllUsers.and.returnValue(of(mockUsers));
    authServiceSpy.getUser.and.returnValue({ firstName: 'John', lastName: 'Doe', email: 'john@test.com' });
    authServiceSpy.getToken.and.returnValue('test-token');
    coachingServiceSpy.getSeancesByTutor.and.returnValue(of(mockSeances));

    const keycloakSpy = jasmine.createSpyObj('KeycloakService', ['logout', 'updateToken', 'getToken', 'init']);

    await TestBed.configureTestingModule({
      imports: [FindCoachComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: CoachingService, useValue: coachingServiceSpy },
        { provide: KeycloakService, useValue: keycloakSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FindCoachComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load only TUTOR coaches', () => {
    expect(component.coaches.length).toBe(1);
    expect(component.coaches[0].role).toBe('TUTOR');
  });

  it('should show error on load failure', () => {
    userServiceSpy.getAllUsers.and.returnValue(throwError(() => new Error('Error')));
    component.loadCoaches();
    expect(component.error).toBeTruthy();
  });

  it('should pre-fill student name from logged in user', () => {
    expect(component.reservation.studidname).toBe('John Doe');
  });

  describe('formatDateStr', () => {
    it('should format date correctly', () => {
      const date = new Date(2026, 4, 1); // May 1, 2026
      expect(component.formatDateStr(date)).toBe('2026-05-01');
    });
  });

  describe('previousMonth / nextMonth', () => {
    it('should go to previous month', () => {
      component.currentMonth = 5;
      component.previousMonth();
      expect(component.currentMonth).toBe(4);
    });

    it('should wrap to December when going back from January', () => {
      component.currentMonth = 0;
      component.currentYear = 2026;
      component.previousMonth();
      expect(component.currentMonth).toBe(11);
      expect(component.currentYear).toBe(2025);
    });

    it('should go to next month', () => {
      component.currentMonth = 5;
      component.nextMonth();
      expect(component.currentMonth).toBe(6);
    });

    it('should wrap to January when going forward from December', () => {
      component.currentMonth = 11;
      component.currentYear = 2025;
      component.nextMonth();
      expect(component.currentMonth).toBe(0);
      expect(component.currentYear).toBe(2026);
    });
  });

  describe('selectCoach', () => {
    it('should set selectedCoach and load seances', () => {
      component.selectCoach(mockUsers[0]);
      expect(component.selectedCoach).toEqual(mockUsers[0]);
      expect(coachingServiceSpy.getSeancesByTutor).toHaveBeenCalledWith(1);
    });
  });

  describe('goBackToCoaches', () => {
    it('should reset coach selection', () => {
      component.selectedCoach = mockUsers[0];
      component.goBackToCoaches();
      expect(component.selectedCoach).toBeNull();
      expect(component.allSeances.length).toBe(0);
    });
  });

  describe('cancelReservation', () => {
    it('should hide reservation form', () => {
      component.showReservationForm = true;
      component.cancelReservation();
      expect(component.showReservationForm).toBeFalse();
    });
  });

  describe('getAvailableDatesCount', () => {
    it('should return count of available days', () => {
      component.calendarDays = [
        { date: '2026-05-01', dayOfMonth: 1, isCurrentMonth: true, isToday: false, isAvailable: true, isBooked: false, seances: [] },
        { date: '2026-05-02', dayOfMonth: 2, isCurrentMonth: true, isToday: false, isAvailable: false, isBooked: true, seances: [] }
      ];
      expect(component.getAvailableDatesCount()).toBe(1);
    });
  });
});
