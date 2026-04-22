import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BackofficeComponent } from './backoffice.component';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { NotificationService } from '../services/notification.service';

describe('BackofficeComponent', () => {
  let component: BackofficeComponent;
  let fixture: ComponentFixture<BackofficeComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getUser', 'getToken', 'isLoggedIn']);
    authServiceSpy.getUser.and.returnValue({ role: 'ADMIN', email: 'admin@test.com' });

    const keycloakSpy = jasmine.createSpyObj('KeycloakService', ['logout', 'updateToken', 'getToken', 'init']);
    const notifSpy = jasmine.createSpyObj('NotificationService', ['connect', 'notifications$', 'clearNotifications']);
    notifSpy.notifications$ = { subscribe: jasmine.createSpy().and.returnValue({ unsubscribe: () => {} }) };

    await TestBed.configureTestingModule({
      imports: [BackofficeComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: KeycloakService, useValue: keycloakSpy },
        { provide: NotificationService, useValue: notifSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BackofficeComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should redirect ADMIN to /backoffice/admin on init', () => {
    authServiceSpy.getUser.and.returnValue({ role: 'ADMIN' });
    const navigateSpy = spyOn(router, 'navigate');
    spyOnProperty(router, 'url', 'get').and.returnValue('/backoffice');
    component.ngOnInit();
    expect(navigateSpy).toHaveBeenCalledWith(['/backoffice/admin']);
  });

  it('should redirect TUTOR to /backoffice/tutor on init', () => {
    authServiceSpy.getUser.and.returnValue({ role: 'TUTOR' });
    const navigateSpy = spyOn(router, 'navigate');
    spyOnProperty(router, 'url', 'get').and.returnValue('/backoffice');
    component.ngOnInit();
    expect(navigateSpy).toHaveBeenCalledWith(['/backoffice/tutor']);
  });

  it('should not redirect when already on a child route', () => {
    const navigateSpy = spyOn(router, 'navigate');
    spyOnProperty(router, 'url', 'get').and.returnValue('/backoffice/admin/users');
    component.ngOnInit();
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
