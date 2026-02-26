import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-frontoffice-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './frontoffice-dashboard.component.html',
  styleUrls: ['./frontoffice-dashboard.component.css']
})
export class FrontofficeDashboardComponent {
  constructor(private router: Router) { }

  navigateToClubs() {
    this.router.navigate(['/frontoffice/clubs']);
  }

  navigateToEvents() {
    this.router.navigate(['/frontoffice/events']);
  }

  navigateToSpaces() {
    this.router.navigate(['/frontoffice/spaces']);
  }

  navigateToBackoffice() {
    this.router.navigate(['/backoffice']);
  }
}
