import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-backoffice-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './backoffice-dashboard.component.html',
  styleUrls: ['./backoffice-dashboard.component.css']
})
export class BackofficeDashboardComponent {
  constructor(private router: Router) {}

  navigateToClubs() {
    this.router.navigate(['/backoffice/clubs']);
  }

  navigateToEvents() {
    this.router.navigate(['/backoffice/events']);
  }

  navigateToSpaces() {
    this.router.navigate(['/backoffice/spaces']);
  }

  navigateToFrontoffice() {
    this.router.navigate(['/frontoffice']);
  }
}
