import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './auth.service';
import { KeycloakService } from 'keycloak-angular';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let keycloakSpy: jasmine.SpyObj<KeycloakService>;

  beforeEach(() => {
    keycloakSpy = jasmine.createSpyObj('KeycloakService', ['logout', 'updateToken', 'getToken', 'init']);
    keycloakSpy.logout.and.returnValue(Promise.resolve());
    keycloakSpy.updateToken.and.returnValue(Promise.resolve(true));
    keycloakSpy.getToken.and.returnValue(Promise.resolve('new-token'));

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        AuthService,
        { provide: KeycloakService, useValue: keycloakSpy }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('register', () => {
    it('should POST to register endpoint', () => {
      const userData = { email: 'test@test.com', password: 'Pass123!' };
      service.register(userData).subscribe();
      const req = httpMock.expectOne('http://localhost:8089/api/auth/register');
      expect(req.request.method).toBe('POST');
      req.flush({ token: 'abc', email: 'test@test.com' });
    });
  });

  describe('login', () => {
    it('should store token on successful login', (done) => {
      const credentials = { email: 'test@test.com', password: 'Pass123!' };
      service.login(credentials).subscribe((res) => {
        expect(localStorage.getItem('auth_token')).toBe('test-token');
        done();
      });
      const req = httpMock.expectOne('http://localhost:8089/api/auth/login');
      req.flush({ token: 'test-token', email: 'test@test.com', role: 'STUDENT' });
    });

    it('should emit error on login failure', (done) => {
      const credentials = { email: 'bad@test.com', password: 'wrong' };
      service.login(credentials).subscribe({
        error: (err) => {
          expect(err).toBeTruthy();
          done();
        }
      });
      const req = httpMock.expectOne('http://localhost:8089/api/auth/login');
      req.flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('getToken', () => {
    it('should return null when no token stored', () => {
      expect(service.getToken()).toBeNull();
    });

    it('should return stored token', () => {
      localStorage.setItem('auth_token', 'my-token');
      expect(service.getToken()).toBe('my-token');
    });
  });

  describe('getUser', () => {
    it('should return null when no user stored', () => {
      expect(service.getUser()).toBeNull();
    });

    it('should return parsed user from localStorage', () => {
      const user = { email: 'test@test.com', role: 'STUDENT' };
      localStorage.setItem('user_data', JSON.stringify(user));
      expect(service.getUser()).toEqual(user);
    });
  });

  describe('isLoggedIn', () => {
    it('should return false when no token', () => {
      expect(service.isLoggedIn()).toBeFalse();
    });

    it('should return true when token exists', () => {
      localStorage.setItem('auth_token', 'some-token');
      expect(service.isLoggedIn()).toBeTrue();
    });
  });

  describe('updateUserData', () => {
    it('should update user data in localStorage', () => {
      const userData = { email: 'updated@test.com', role: 'ADMIN' };
      service.updateUserData(userData);
      expect(JSON.parse(localStorage.getItem('user_data')!)).toEqual(userData);
    });
  });

  describe('forgotPassword', () => {
    it('should POST to forgot-password endpoint', () => {
      service.forgotPassword('test@test.com').subscribe();
      const req = httpMock.expectOne('http://localhost:8089/api/auth/forgot-password');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'test@test.com' });
      req.flush({ success: true, message: 'Email sent' });
    });
  });

  describe('resetPassword', () => {
    it('should POST to reset-password endpoint', () => {
      const data = { token: 'abc', newPassword: 'New123!', confirmPassword: 'New123!' };
      service.resetPassword(data).subscribe();
      const req = httpMock.expectOne('http://localhost:8089/api/auth/reset-password');
      expect(req.request.method).toBe('POST');
      req.flush({ message: 'Password reset' });
    });
  });

  describe('validateResetToken', () => {
    it('should GET validate-reset-token with token param', () => {
      service.validateResetToken('my-token').subscribe();
      const req = httpMock.expectOne(r => r.url.includes('validate-reset-token'));
      expect(req.request.method).toBe('GET');
      req.flush({ valid: true });
    });
  });

  describe('logoutUser', () => {
    it('should POST to logout endpoint with email and logoutType', () => {
      service.logoutUser('test@test.com', 'VOLUNTARY').subscribe();
      const req = httpMock.expectOne(r => r.url.includes('/logout'));
      expect(req.request.method).toBe('POST');
      req.flush({ success: true });
    });
  });
});
