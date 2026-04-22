import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { KeycloakService } from 'keycloak-angular';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['forgotPassword', 'getToken', 'getUser', 'isLoggedIn']);
    const keycloakSpy = jasmine.createSpyObj('KeycloakService', ['logout', 'updateToken', 'getToken', 'init']);

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: KeycloakService, useValue: keycloakSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show error when email is empty', () => {
    component.email = '';
    component.onSubmit();
    expect(component.errorMessage).toBe('Email is required');
  });

  it('should show error for invalid email format', () => {
    component.email = 'not-valid';
    component.onSubmit();
    expect(component.errorMessage).toBe('Please enter a valid email address');
  });

  it('should call forgotPassword on valid email', () => {
    authServiceSpy.forgotPassword.and.returnValue(of({ success: true, message: 'Email sent' }));
    component.email = 'test@test.com';
    component.onSubmit();
    expect(authServiceSpy.forgotPassword).toHaveBeenCalledWith('test@test.com');
  });

  it('should set isSubmitted and successMessage on success', () => {
    authServiceSpy.forgotPassword.and.returnValue(of({ success: true, message: 'Check your inbox' }));
    component.email = 'test@test.com';
    component.onSubmit();
    expect(component.isSubmitted).toBeTrue();
    expect(component.successMessage).toBe('Check your inbox');
  });

  it('should set isSubmitted with generic message on error', () => {
    authServiceSpy.forgotPassword.and.returnValue(throwError(() => new Error('Server error')));
    component.email = 'test@test.com';
    component.onSubmit();
    expect(component.isSubmitted).toBeTrue();
    expect(component.successMessage).toContain('If your email exists');
  });

  it('should navigate to login on goToLogin', () => {
    const navigateSpy = spyOn(router, 'navigate');
    component.goToLogin();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});
