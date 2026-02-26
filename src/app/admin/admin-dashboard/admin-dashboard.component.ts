import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent {
  constructor(private router: Router) {}

  navigateToClubs() {
    this.router.navigate(['/admin/clubs']);
  }

  navigateToEvents() {
    this.router.navigate(['/admin/events']);
  }

  navigateToSpaces() {
    this.router.navigate(['/admin/spaces']);
  }

  navigateToUserInterface() {
    this.router.navigate(['/']);
  }
}
