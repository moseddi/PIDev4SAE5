import { Component, HostListener, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  isNavbarScrolled = false;
  isLoggedIn = false;
  userRole: string = '';
  canAccessBackoffice = false;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.isLoggedIn = this.authService.isLoggedIn();
    const user = this.authService.getUser();
    this.userRole = user?.role || '';
    
    // Check if user can access backoffice (ADMIN or TUTOR)
    this.canAccessBackoffice = this.isLoggedIn && 
      (this.userRole === 'ADMIN' || this.userRole === 'TUTOR');
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.isNavbarScrolled = window.scrollY > 50;
  }

  logout() {
    this.authService.logout();
    window.location.reload(); // Simple reload to update UI
  }
}