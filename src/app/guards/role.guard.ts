import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const user = this.authService.getUser();
    const requiredRoles = route.data['roles'] as Array<string>;
    
    if (!user) {
      console.log('RoleGuard: No user found, redirecting to login');
      this.router.navigate(['/login']);
      return false;
    }
    
    console.log('RoleGuard: User role:', user.role, 'Required roles:', requiredRoles);
    
    if (requiredRoles && !requiredRoles.includes(user.role)) {
      console.log('RoleGuard: Access denied - insufficient role');
      this.router.navigate(['/home']);
      return false;
    }
    
    console.log('RoleGuard: Access granted');
    return true;
  }
}