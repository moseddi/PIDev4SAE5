import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ProfileService } from './profile.service';
import { AuthService } from './auth.service';
import { KeycloakService } from 'keycloak-angular';

describe('ProfileService', () => {
  let service: ProfileService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockUser = { userId: 1, email: 'test@test.com', role: 'STUDENT' };
  const mockProfile = { id: 1, email: 'test@test.com', firstName: 'John', lastName: 'Doe' };

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getUser', 'getToken']);
    authServiceSpy.getUser.and.returnValue(mockUser);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        ProfileService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(ProfileService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should GET current user profile', () => {
    service.getMyProfile().subscribe(profile => {
      expect(profile.email).toBe('test@test.com');
    });
    const req = httpMock.expectOne('http://localhost:8089/api/users/1');
    expect(req.request.method).toBe('GET');
    req.flush(mockProfile);
  });

  it('should PUT to update profile', () => {
    const update = { firstName: 'Jane' };
    service.updateProfile(1, update).subscribe(profile => {
      expect(profile.firstName).toBe('Jane');
    });
    const req = httpMock.expectOne('http://localhost:8089/api/users/1');
    expect(req.request.method).toBe('PUT');
    req.flush({ ...mockProfile, ...update });
  });

  it('should POST to create profile', () => {
    const newProfile = { email: 'new@test.com', firstName: 'New' };
    service.createProfile(newProfile as any).subscribe();
    const req = httpMock.expectOne('http://localhost:8089/api/users');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 2, ...newProfile });
  });
});
