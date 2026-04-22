import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { RoleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  const mockRoute = (roles: string[]): ActivatedRouteSnapshot => {
    const route = new ActivatedRouteSnapshot();
    (route as any).data = { roles };
    return route;
  };

  const mockState = {} as RouterStateSnapshot;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getUser']);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        RoleGuard,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    guard = TestBed.inject(RoleGuard);
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should redirect to login when no user found', () => {
    authServiceSpy.getUser.and.returnValue(null);
    const navigateSpy = spyOn(router, 'navigate');
    const result = guard.canActivate(mockRoute(['ADMIN']), mockState);
    expect(result).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('should allow access when user has required role', () => {
    authServiceSpy.getUser.and.returnValue({ role: 'ADMIN' });
    const result = guard.canActivate(mockRoute(['ADMIN', 'TUTOR']), mockState);
    expect(result).toBeTrue();
  });

  it('should deny access and redirect to home when role is insufficient', () => {
    authServiceSpy.getUser.and.returnValue({ role: 'STUDENT' });
    const navigateSpy = spyOn(router, 'navigate');
    const result = guard.canActivate(mockRoute(['ADMIN']), mockState);
    expect(result).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith(['/home']);
  });

  it('should allow access when no required roles specified', () => {
    authServiceSpy.getUser.and.returnValue({ role: 'STUDENT' });
    const navigateSpy = spyOn(router, 'navigate');
    // When requiredRoles is undefined (not set in route data), guard allows access
    const routeNoRoles = new ActivatedRouteSnapshot();
    (routeNoRoles as any).data = {};
    const result = guard.canActivate(routeNoRoles, mockState);
    expect(result).toBeTrue();
  });
});
