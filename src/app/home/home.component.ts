import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

import { NavbarFrontComponent } from '../courses/navbar-front/navbar-front.component';


import { ProfileCompletionComponent } from '../profile-completion/profile-completion.component';


@Component({
  selector: 'app-home',
  standalone: true,

  imports: [CommonModule, RouterLink,NavbarFrontComponent, ProfileCompletionComponent],

  

  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  isNavbarScrolled = false;
  isLoggedIn = false;
  userRole = '';
  canAccessBackoffice = false;
  
  user: any = {};
  showDropdown = false;
  showProfileModal = false;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    const user = this.authService.getUser();
    this.user = user;
    this.isLoggedIn = !!user;
    this.userRole = user?.role || '';
    
    // Check if user has ADMIN or TUTOR role
    this.canAccessBackoffice = this.userRole === 'ADMIN' || this.userRole === 'TUTOR';
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isNavbarScrolled = window.scrollY > 50;
  }

  logout() {
    this.authService.logout();
    this.isLoggedIn = false;
    this.userRole = '';
    this.user = {};
    this.showDropdown = false;
    this.showProfileModal = false;
  }

  getInitials(): string {
    if (this.user?.firstName) {
      return this.user.firstName.charAt(0).toUpperCase();
    }
    return this.user?.email?.charAt(0).toUpperCase() || 'U';
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  openProfileModal() {
    this.showProfileModal = true;
    this.showDropdown = false;
  }

  closeModal() {
    this.showProfileModal = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-dropdown')) {
      this.showDropdown = false;
    }
  }
}