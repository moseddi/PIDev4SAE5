import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HomeComponent } from './home.component';
import { AuthService } from '../services/auth.service';
import { KeycloakService } from 'keycloak-angular';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getUser', 'logout', 'isLoggedIn', 'getToken']);
    authServiceSpy.getUser.and.returnValue(null);

    const keycloakSpy = jasmine.createSpyObj('KeycloakService', ['logout', 'updateToken', 'getToken', 'init']);

    await TestBed.configureTestingModule({
      imports: [HomeComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: KeycloakService, useValue: keycloakSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set isLoggedIn to false when no user', () => {
    authServiceSpy.getUser.and.returnValue(null);
    component.ngOnInit();
    expect(component.isLoggedIn).toBeFalse();
  });

  it('should set isLoggedIn to true when user exists', () => {
    authServiceSpy.getUser.and.returnValue({ email: 'test@test.com', role: 'STUDENT' });
    component.ngOnInit();
    expect(component.isLoggedIn).toBeTrue();
  });

  it('should set canAccessBackoffice for ADMIN role', () => {
    authServiceSpy.getUser.and.returnValue({ role: 'ADMIN' });
    component.ngOnInit();
    expect(component.canAccessBackoffice).toBeTrue();
  });

  it('should set canAccessBackoffice for TUTOR role', () => {
    authServiceSpy.getUser.and.returnValue({ role: 'TUTOR' });
    component.ngOnInit();
    expect(component.canAccessBackoffice).toBeTrue();
  });

  it('should not set canAccessBackoffice for STUDENT role', () => {
    authServiceSpy.getUser.and.returnValue({ role: 'STUDENT' });
    component.ngOnInit();
    expect(component.canAccessBackoffice).toBeFalse();
  });

  it('should toggle dropdown', () => {
    expect(component.showDropdown).toBeFalse();
    component.toggleDropdown();
    expect(component.showDropdown).toBeTrue();
    component.toggleDropdown();
    expect(component.showDropdown).toBeFalse();
  });

  it('should open profile modal', () => {
    component.openProfileModal();
    expect(component.showProfileModal).toBeTrue();
    expect(component.showDropdown).toBeFalse();
  });

  it('should close modal', () => {
    component.showProfileModal = true;
    component.closeModal();
    expect(component.showProfileModal).toBeFalse();
  });

  it('should return initials from firstName', () => {
    component.user = { firstName: 'John' };
    expect(component.getInitials()).toBe('J');
  });

  it('should return initials from email when no firstName', () => {
    component.user = { email: 'alice@test.com' };
    expect(component.getInitials()).toBe('A');
  });

  it('should return U when no user data', () => {
    component.user = {};
    expect(component.getInitials()).toBe('U');
  });

  it('should call authService.logout on logout', () => {
    component.logout();
    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(component.isLoggedIn).toBeFalse();
  });
});
