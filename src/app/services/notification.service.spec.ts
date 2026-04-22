import { TestBed } from '@angular/core/testing';
import { NotificationService, CourseNotification } from './notification.service';
import { AuthService } from './auth.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { KeycloakService } from 'keycloak-angular';

describe('NotificationService', () => {
  let service: NotificationService;

  const mockNotification: CourseNotification = {
    type: 'COURSE_CREATED',
    message: 'New course added',
    courseId: 1,
    courseTitle: 'English Basics',
    timestamp: Date.now()
  };

  beforeEach(() => {
    const keycloakSpy = jasmine.createSpyObj('KeycloakService', ['logout', 'updateToken', 'getToken', 'init']);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        NotificationService,
        AuthService,
        { provide: KeycloakService, useValue: keycloakSpy }
      ]
    });
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty notifications', (done) => {
    service.notifications$.subscribe(notifs => {
      expect(notifs.length).toBe(0);
      done();
    });
  });

  it('should add a notification', (done) => {
    service.addNotification(mockNotification);
    service.notifications$.subscribe(notifs => {
      expect(notifs.length).toBe(1);
      expect(notifs[0].courseTitle).toBe('English Basics');
      done();
    });
  });

  it('should prepend new notifications', () => {
    const first: CourseNotification = { ...mockNotification, courseTitle: 'First' };
    const second: CourseNotification = { ...mockNotification, courseTitle: 'Second' };
    service.addNotification(first);
    service.addNotification(second);
    let notifs: CourseNotification[] = [];
    service.notifications$.subscribe(n => notifs = n);
    expect(notifs[0].courseTitle).toBe('Second');
  });

  it('should clear all notifications', () => {
    service.addNotification(mockNotification);
    service.clearNotifications();
    let notifs: CourseNotification[] = [];
    service.notifications$.subscribe(n => notifs = n);
    expect(notifs.length).toBe(0);
  });

  it('should return correct notification count', () => {
    expect(service.getNotificationCount()).toBe(0);
    service.addNotification(mockNotification);
    expect(service.getNotificationCount()).toBe(1);
  });

  it('should start with disconnected status', (done) => {
    service.connectionStatus$.subscribe(status => {
      expect(status).toBeFalse();
      done();
    });
  });
});
