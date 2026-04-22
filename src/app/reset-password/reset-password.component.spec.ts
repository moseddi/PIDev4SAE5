import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { ResetPasswordComponent } from './reset-password.component';
import { AuthService } from '../services/auth.service';
import { of, throwError } from 'rxjs';
import { KeycloakService } from 'keycloak-angular';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['resetPassword', 'getToken', 'getUser', 'isLoggedIn']);
    const keycloakSpy = jasmine.createSpyObj('KeycloakService', ['logout', 'updateToken', 'getToken', 'init']);

    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: KeycloakService, useValue: keycloakSpy },
        {
          provide: ActivatedRoute,
          useValue: { queryParams: of({ token: 'reset-token-123' }) }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should read token from query params', () => {
    expect(component.token).toBe('reset-token-123');
  });

  it('should show error when fields are empty', () => {
    component.newPassword = '';
    component.confirmPassword = '';
    component.onSubmit();
    expect(component.errorMessage).toBe('All fields are required');
  });

  it('should show error when password is too short', () => {
    component.newPassword = '123';
    component.confirmPassword = '123';
    component.onSubmit();
    expect(component.errorMessage).toBe('Password must be at least 6 characters');
  });

  it('should show error when passwords do not match', () => {
    component.newPassword = 'Pass123!';
    component.confirmPassword = 'Different!';
    component.onSubmit();
    expect(component.errorMessage).toBe('Passwords do not match');
  });

  it('should call resetPassword on valid input', () => {
    authServiceSpy.resetPassword.and.returnValue(of({ message: 'Password reset' }));
    component.token = 'reset-token-123';
    component.newPassword = 'NewPass123!';
    component.confirmPassword = 'NewPass123!';
    component.onSubmit();
    expect(authServiceSpy.resetPassword).toHaveBeenCalled();
  });

  it('should show success message on successful reset', () => {
    authServiceSpy.resetPassword.and.returnValue(of({ message: 'Password reset' }));
    component.token = 'reset-token-123';
    component.newPassword = 'NewPass123!';
    component.confirmPassword = 'NewPass123!';
    component.onSubmit();
    expect(component.successMessage).toContain('Password reset successfully');
  });

  it('should show error message on reset failure', () => {
    authServiceSpy.resetPassword.and.returnValue(throwError(() => ({ error: { message: 'Token expired' } })));
    component.token = 'reset-token-123';
    component.newPassword = 'NewPass123!';
    component.confirmPassword = 'NewPass123!';
    component.onSubmit();
    expect(component.errorMessage).toBe('Token expired');
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword).toBeFalse();
    component.togglePasswordVisibility();
    expect(component.showPassword).toBeTrue();
  });
});
