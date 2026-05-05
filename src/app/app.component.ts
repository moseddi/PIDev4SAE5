import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>'
})
export class AppComponent implements OnInit {
  title: any;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    const token = this.authService.getToken();

    if (!token) {
      // ✅ No token — just let routing handle it
      // Visitor goes to /home, guards protect /backoffice
      console.log('No token — visitor mode');
      return;
    }

    if (this.isTokenExpired(token)) {
      // ✅ Token expired — clean up but stay on home page
      console.warn('⚠️ Expired token found — clearing session');
      localStorage.clear();
      this.userService.clearCache();
      // ✅ Don't redirect — let the user browse public pages
      return;
    }

    // ✅ Valid token — preload users in background for admin
    const user = this.authService.getUser();
    if (user?.role === 'ADMIN') {
      console.log('✅ Admin session found — preloading data...');
      this.userService.preloadUsers();
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }
}