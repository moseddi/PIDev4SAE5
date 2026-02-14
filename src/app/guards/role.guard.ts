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

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Check if user is logged in
    const user = this.authService.getUser();
    
    if (!user) {
      // Not logged in, redirect to login
      this.router.navigate(['/login']);
      return false;
    }

    // Check if user has required role
    const allowedRoles = route.data['roles'] as Array<string>;
    
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // User doesn't have required role, redirect to home
      this.router.navigate(['/']);
      return false;
    }

    // User is authorized
    return true;
  }
}