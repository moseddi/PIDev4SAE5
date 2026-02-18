import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NavbarFrontComponent } from '../courses/navbar-front/navbar-front.component';


@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink,NavbarFrontComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  isNavbarScrolled = false;
  isLoggedIn = false;
  userRole = '';
  canAccessBackoffice = true; // 👈 CHANGE THIS TO TRUE (was false)

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // You can keep this for other functionality, but backoffice is now always visible
    const user = this.authService.getUser();
    this.isLoggedIn = !!user;
    this.userRole = user?.role || '';
    
    // This line is no longer needed since we set canAccessBackoffice = true above
    // this.canAccessBackoffice = this.userRole === 'ADMIN' || this.userRole === 'TUTOR';
  }

  logout() {
    this.authService.logout();
    this.isLoggedIn = false;
    this.userRole = '';
  }
}