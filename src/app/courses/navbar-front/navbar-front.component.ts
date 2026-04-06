import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ProfileCompletionComponent } from '../../profile-completion/profile-completion.component'; // ADD THIS IMPORT

@Component({
  selector: 'app-navbar-front',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink,
    ProfileCompletionComponent // ADD THIS TO IMPORTS
  ],
  templateUrl: './navbar-front.component.html',
  styleUrls: ['./navbar-front.component.css']
})
export class NavbarFrontComponent implements OnInit {
  isNavbarScrolled = false;
  isLoggedIn = false;
  userRole: string = '';
  canAccessBackoffice = false;
  isStudent = false;
  user: any = {};
  showProfileModal = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Get user data from AuthService
    const user = this.authService.getUser();
    this.user = user;
    this.isLoggedIn = !!user;
    this.userRole = user?.role || '';
    this.canAccessBackoffice = this.userRole === 'ADMIN' || this.userRole === 'TUTOR';
    this.isStudent = this.userRole === 'STUDENT';
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isNavbarScrolled = window.scrollY > 50;
  }

  logout(): void {
    this.authService.logout();
    this.isLoggedIn = false;
    this.userRole = '';
    this.canAccessBackoffice = false;
    this.isStudent = false;
    this.user = {};
    this.showProfileModal = false;
  }

  openProfileModal(): void {
    this.showProfileModal = true;
  }

  closeModal(): void {
    this.showProfileModal = false;
  }

  onProfileUpdated(): void {
    // Refresh user data when profile is updated
    const updatedUser = this.authService.getUser();
    this.user = updatedUser;
  }
}