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
      console.error('🚫 RoleGuard: No user found in localStorage!');
      this.router.navigate(['/login']);
      return false;
    }
    
    const userRole = user.role ? user.role.toString().toUpperCase() : 'NONE';
    const normalizedRequiredRoles = requiredRoles.map(r => r.toUpperCase());

    console.log('🛡️ RoleGuard Check:', {
      userRole: userRole,
      requiredRoles: normalizedRequiredRoles,
      fullUserObject: user
    });
    
    if (normalizedRequiredRoles && !normalizedRequiredRoles.includes(userRole)) {
      console.warn('❌ RoleGuard: Access denied for role', userRole);
      this.router.navigate(['/home']);
      return false;
    }
    
    console.log('RoleGuard: Access granted');
    return true;
  }
}