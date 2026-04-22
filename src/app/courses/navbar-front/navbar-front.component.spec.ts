import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NavbarFrontComponent } from './navbar-front.component';
import { AuthService } from '../../services/auth.service';
import { KeycloakService } from 'keycloak-angular';

describe('NavbarFrontComponent', () => {
  let component: NavbarFrontComponent;
  let fixture: ComponentFixture<NavbarFrontComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getUser', 'logout', 'getToken', 'isLoggedIn']);
    authServiceSpy.getUser.and.returnValue(null);
    const keycloakSpy = jasmine.createSpyObj('KeycloakService', ['logout', 'updateToken', 'getToken', 'init']);

    await TestBed.configureTestingModule({
      imports: [NavbarFrontComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: KeycloakService, useValue: keycloakSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarFrontComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set isLoggedIn false when no user', () => {
    authServiceSpy.getUser.and.returnValue(null);
    component.ngOnInit();
    expect(component.isLoggedIn).toBeFalse();
  });

  it('should set isLoggedIn true when user exists', () => {
    authServiceSpy.getUser.and.returnValue({ role: 'STUDENT', email: 'test@test.com' });
    component.ngOnInit();
    expect(component.isLoggedIn).toBeTrue();
  });

  it('should set canAccessBackoffice for ADMIN', () => {
    authServiceSpy.getUser.and.returnValue({ role: 'ADMIN' });
    component.ngOnInit();
    expect(component.canAccessBackoffice).toBeTrue();
  });

  it('should set isStudent for STUDENT role', () => {
    authServiceSpy.getUser.and.returnValue({ role: 'STUDENT' });
    component.ngOnInit();
    expect(component.isStudent).toBeTrue();
  });

  it('should open profile modal', () => {
    component.openProfileModal();
    expect(component.showProfileModal).toBeTrue();
  });

  it('should close modal', () => {
    component.showProfileModal = true;
    component.closeModal();
    expect(component.showProfileModal).toBeFalse();
  });

  it('should call logout and reset state', () => {
    component.isLoggedIn = true;
    component.logout();
    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(component.isLoggedIn).toBeFalse();
  });

  it('should refresh user on profile updated', () => {
    const updatedUser = { role: 'STUDENT', email: 'updated@test.com' };
    authServiceSpy.getUser.and.returnValue(updatedUser);
    component.onProfileUpdated();
    expect(component.user).toEqual(updatedUser);
  });
});
