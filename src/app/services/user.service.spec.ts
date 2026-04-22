import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { UserService } from './user.service';
import { AuthService } from './auth.service';
import { KeycloakService } from 'keycloak-angular';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockUsers = [
    { id: 1, email: 'admin@test.com', firstName: 'Admin', role: 'ADMIN', active: true },
    { id: 2, email: 'student@test.com', firstName: 'Student', role: 'STUDENT', active: true }
  ];

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken', 'getUser']);
    authServiceSpy.getToken.and.returnValue('valid-token');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        UserService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    service.clearCache();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllUsers', () => {
    it('should GET all users', () => {
      service.getAllUsers().subscribe(users => {
        expect(users.length).toBe(2);
      });
      const req = httpMock.expectOne('http://localhost:8089/api/users');
      expect(req.request.method).toBe('GET');
      req.flush(mockUsers);
    });

    it('should return cached users on second call', () => {
      service.getAllUsers().subscribe();
      httpMock.expectOne('http://localhost:8089/api/users').flush(mockUsers);

      service.getAllUsers().subscribe(users => {
        expect(users.length).toBe(2);
      });
      httpMock.expectNone('http://localhost:8089/api/users');
    });
  });

  describe('getUserById', () => {
    it('should GET user by id', () => {
      service.getUserById(1).subscribe(user => {
        expect(user.id).toBe(1);
      });
      const req = httpMock.expectOne('http://localhost:8089/api/users/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockUsers[0]);
    });
  });

  describe('getUserByEmail', () => {
    it('should GET user by email', () => {
      service.getUserByEmail('admin@test.com').subscribe(user => {
        expect(user.email).toBe('admin@test.com');
      });
      const req = httpMock.expectOne('http://localhost:8089/api/users/email/admin@test.com');
      expect(req.request.method).toBe('GET');
      req.flush(mockUsers[0]);
    });
  });

  describe('createUser', () => {
    it('should POST to create user', () => {
      const newUser = { email: 'new@test.com', firstName: 'New', role: 'STUDENT', password: 'Pass123!' };
      service.createUser(newUser).subscribe();
      const req = httpMock.expectOne('http://localhost:8089/api/users');
      expect(req.request.method).toBe('POST');
      req.flush({ id: 3, ...newUser });
    });
  });

  describe('updateUser', () => {
    it('should PUT to update user', () => {
      const update = { role: 'TUTOR' };
      service.updateUser(1, update).subscribe();
      const req = httpMock.expectOne('http://localhost:8089/api/users/1');
      expect(req.request.method).toBe('PUT');
      req.flush({ ...mockUsers[0], ...update });
    });
  });

  describe('deleteUser', () => {
    it('should DELETE user by id', () => {
      service.deleteUser(1).subscribe();
      const req = httpMock.expectOne('http://localhost:8089/api/users/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('clearCache', () => {
    it('should clear cached users', () => {
      service.getAllUsers().subscribe();
      httpMock.expectOne('http://localhost:8089/api/users').flush(mockUsers);

      service.clearCache();

      service.getAllUsers().subscribe();
      httpMock.expectOne('http://localhost:8089/api/users').flush(mockUsers);
    });
  });

  describe('forceLogout', () => {
    it('should POST to force-logout endpoint', () => {
      service.forceLogout('user@test.com').subscribe();
      const req = httpMock.expectOne('http://localhost:8089/api/users/force-logout/user@test.com');
      expect(req.request.method).toBe('POST');
      req.flush('Logged out');
    });
  });
});
