import { Component, HostListener, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar-front',
  standalone: true,
  imports: [CommonModule, RouterLink], // ✅ Modules nécessaires ajoutés
  templateUrl: './navbar-front.component.html',
  styleUrls: ['./navbar-front.component.css'] // ✅ 'styleUrls' (avec 's')
})
export class NavbarFrontComponent implements OnInit {
  isNavbarScrolled = false;
  isLoggedIn = false;
  userRole: string = '';
  canAccessBackoffice = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Initialisation (à remplacer par un vrai service d'authentification)
    this.isLoggedIn = false;
    this.userRole = '';
    this.canAccessBackoffice = false;
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isNavbarScrolled = window.scrollY > 50;
  }

  logout(): void {
    // Logique de déconnexion
    // this.authService.logout();
    this.router.navigate(['/home']);
  }
}