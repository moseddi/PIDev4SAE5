import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { NotificationService, CourseNotification } from '../../../services/notification.service';
import { BehaviorSubject } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '../../../services/auth.service';
import { KeycloakService } from 'keycloak-angular';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let notifServiceSpy: jasmine.SpyObj<NotificationService>;
  let notificationsSubject: BehaviorSubject<CourseNotification[]>;

  const mockNotif: CourseNotification = {
    type: 'COURSE_CREATED',
    message: 'New course',
    courseId: 1,
    courseTitle: 'English Basics',
    timestamp: Date.now(),
    read: false
  };

  beforeEach(async () => {
    notificationsSubject = new BehaviorSubject<CourseNotification[]>([]);
    notifServiceSpy = jasmine.createSpyObj('NotificationService', ['connect', 'clearNotifications']);
    notifServiceSpy.notifications$ = notificationsSubject.asObservable();

    const authSpy = jasmine.createSpyObj('AuthService', ['getUser', 'getToken', 'isLoggedIn']);
    const keycloakSpy = jasmine.createSpyObj('KeycloakService', ['logout', 'updateToken', 'getToken', 'init']);

    await TestBed.configureTestingModule({
      imports: [HeaderComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: NotificationService, useValue: notifServiceSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: KeycloakService, useValue: keycloakSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should connect to notification service on init', () => {
    expect(notifServiceSpy.connect).toHaveBeenCalled();
  });

  it('should update notifications from service', () => {
    notificationsSubject.next([mockNotif]);
    expect(component.notifications.length).toBe(1);
    expect(component.unreadCount).toBe(1);
  });

  it('should toggle dropdown', () => {
    expect(component.showDropdown).toBeFalse();
    component.toggleDropdown();
    expect(component.showDropdown).toBeTrue();
  });

  it('should mark all as read when dropdown opens', () => {
    notificationsSubject.next([mockNotif]);
    component.toggleDropdown();
    expect(component.unreadCount).toBe(0);
  });

  it('should clear notifications', () => {
    component.clearAll();
    expect(notifServiceSpy.clearNotifications).toHaveBeenCalled();
    expect(component.showDropdown).toBeFalse();
  });

  describe('formatTime', () => {
    it('should return "À l\'instant" for recent timestamp', () => {
      const result = component.formatTime(Date.now());
      expect(result).toBe("À l'instant");
    });

    it('should return minutes ago for older timestamp', () => {
      const result = component.formatTime(Date.now() - 5 * 60000);
      expect(result).toContain('5 min');
    });
  });
});
