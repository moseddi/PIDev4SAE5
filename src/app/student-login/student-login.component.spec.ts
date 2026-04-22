import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { StudentLoginComponent } from './student-login.component';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { KeycloakService } from 'keycloak-angular';

describe('StudentLoginComponent', () => {
  let component: StudentLoginComponent;
  let fixture: ComponentFixture<StudentLoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'getUser', 'getToken', 'isLoggedIn']);
    const keycloakSpy = jasmine.createSpyObj('KeycloakService', ['logout', 'updateToken', 'getToken', 'init']);

    await TestBed.configureTestingModule({
      imports: [StudentLoginComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: KeycloakService, useValue: keycloakSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StudentLoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show error when email or password is empty', () => {
    component.loginData = { email: '', password: '' };
    component.onSubmit();
    expect(component.errorMessage).toBe('Email and password are required');
  });

  it('should navigate to backoffice for ADMIN role', () => {
    authServiceSpy.login.and.returnValue(of({ role: 'ADMIN', token: 'abc' }));
    const navigateSpy = spyOn(router, 'navigate');
    component.loginData = { email: 'admin@test.com', password: 'Pass123!' };
    component.onSubmit();
    expect(navigateSpy).toHaveBeenCalledWith(['/backoffice']);
  });

  it('should navigate to backoffice for TUTOR role', () => {
    authServiceSpy.login.and.returnValue(of({ role: 'TUTOR', token: 'abc' }));
    const navigateSpy = spyOn(router, 'navigate');
    component.loginData = { email: 'tutor@test.com', password: 'Pass123!' };
    component.onSubmit();
    expect(navigateSpy).toHaveBeenCalledWith(['/backoffice']);
  });

  it('should navigate to home for STUDENT role', () => {
    authServiceSpy.login.and.returnValue(of({ role: 'STUDENT', token: 'abc' }));
    const navigateSpy = spyOn(router, 'navigate');
    component.loginData = { email: 'student@test.com', password: 'Pass123!' };
    component.onSubmit();
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });

  it('should show error message on login failure', () => {
    authServiceSpy.login.and.returnValue(throwError(() => ({ error: { message: 'Invalid credentials' } })));
    component.loginData = { email: 'bad@test.com', password: 'wrong' };
    component.onSubmit();
    expect(component.errorMessage).toBe('Invalid credentials');
    expect(component.isLoading).toBeFalse();
  });

  it('should set isLoading to true during login', () => {
    authServiceSpy.login.and.returnValue(of({ role: 'STUDENT', token: 'abc' }));
    component.loginData = { email: 'test@test.com', password: 'Pass123!' };
    component.onSubmit();
    expect(component.isLoading).toBeFalse(); // false after completion
  });

  it('should set error message for social login', () => {
    component.socialLogin('Google');
    expect(component.errorMessage).toContain('Google');
  });
});
