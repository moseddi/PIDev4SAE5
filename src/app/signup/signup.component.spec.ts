import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SignupComponent } from './signup.component';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { KeycloakService } from 'keycloak-angular';

describe('SignupComponent', () => {
  let component: SignupComponent;
  let fixture: ComponentFixture<SignupComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let userServiceSpy: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['register', 'getToken', 'getUser', 'isLoggedIn']);
    userServiceSpy = jasmine.createSpyObj('UserService', ['getUserByEmail', 'updateUser', 'createUser', 'clearCache']);
    const keycloakSpy = jasmine.createSpyObj('KeycloakService', ['logout', 'updateToken', 'getToken', 'init']);

    await TestBed.configureTestingModule({
      imports: [SignupComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: KeycloakService, useValue: keycloakSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SignupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('validateEmail', () => {
    it('should return null when not touched', () => {
      component.emailTouched = false;
      expect(component.validateEmail()).toBeNull();
    });

    it('should return error for invalid email', () => {
      component.emailTouched = true;
      component.signupData.email = 'not-an-email';
      expect(component.validateEmail()).toBeTruthy();
    });

    it('should return null for valid email', () => {
      component.emailTouched = true;
      component.signupData.email = 'valid@gmail.com';
      expect(component.validateEmail()).toBeNull();
    });
  });

  describe('validateFirstName', () => {
    it('should return null when not touched', () => {
      component.firstNameTouched = false;
      expect(component.validateFirstName()).toBeNull();
    });

    it('should return error for name with numbers', () => {
      component.firstNameTouched = true;
      component.signupData.firstName = 'John1';
      expect(component.validateFirstName()).toBeTruthy();
    });

    it('should return error for name too short', () => {
      component.firstNameTouched = true;
      component.signupData.firstName = 'Jo';
      expect(component.validateFirstName()).toBeTruthy();
    });

    it('should return null for valid name', () => {
      component.firstNameTouched = true;
      component.signupData.firstName = 'John';
      expect(component.validateFirstName()).toBeNull();
    });
  });

  describe('validateLastName', () => {
    it('should return error for name with numbers', () => {
      component.lastNameTouched = true;
      component.signupData.lastName = 'Doe2';
      expect(component.validateLastName()).toBeTruthy();
    });

    it('should return null for valid last name', () => {
      component.lastNameTouched = true;
      component.signupData.lastName = 'Doe';
      expect(component.validateLastName()).toBeNull();
    });
  });

  describe('validatePhoneNumber', () => {
    it('should return error for invalid phone', () => {
      component.phoneNumberTouched = true;
      component.signupData.phoneNumber = '123';
      expect(component.validatePhoneNumber()).toBeTruthy();
    });

    it('should return null for valid phone', () => {
      component.phoneNumberTouched = true;
      component.signupData.phoneNumber = '12345678';
      expect(component.validatePhoneNumber()).toBeNull();
    });
  });

  describe('password strength', () => {
    it('should detect min length', () => {
      component.signupData.password = 'Pass123!';
      expect(component.hasMinLength).toBeTrue();
    });

    it('should detect uppercase', () => {
      component.signupData.password = 'Pass123!';
      expect(component.hasUpperCase).toBeTrue();
    });

    it('should detect lowercase', () => {
      component.signupData.password = 'Pass123!';
      expect(component.hasLowerCase).toBeTrue();
    });

    it('should detect number', () => {
      component.signupData.password = 'Pass123!';
      expect(component.hasNumber).toBeTrue();
    });

    it('should detect special char', () => {
      component.signupData.password = 'Pass123!';
      expect(component.hasSpecialChar).toBeTrue();
    });

    it('should return strong for full password', () => {
      component.signupData.password = 'Pass123!';
      expect(component.getPasswordStrengthClass()).toBe('strong');
    });

    it('should return weak for simple password', () => {
      component.signupData.password = 'pass';
      expect(component.getPasswordStrengthClass()).toBe('weak');
    });
  });

  describe('onSubmit', () => {
    it('should show error when email is empty', () => {
      component.signupData.email = '';
      component.onSubmit();
      expect(component.errorMessage).toBe('Email is required');
    });

    it('should show error when passwords do not match', () => {
      component.emailTouched = true;
      component.signupData.email = 'test@gmail.com';
      component.signupData.password = 'Pass123!';
      component.signupData.confirmPassword = 'Different1!';
      component.acceptTerms = true;
      component.onSubmit();
      expect(component.errorMessage).toBe('Passwords do not match');
    });

    it('should show error when terms not accepted', () => {
      component.emailTouched = true;
      component.signupData.email = 'test@gmail.com';
      component.signupData.password = 'Pass123!';
      component.signupData.confirmPassword = 'Pass123!';
      component.acceptTerms = false;
      component.onSubmit();
      expect(component.errorMessage).toBe('You must accept the terms');
    });
  });
});
