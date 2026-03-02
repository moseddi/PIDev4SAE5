import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css']
})
export class UserDashboardComponent {
  constructor(private router: Router) {}

  navigateToClubs() {
    this.router.navigate(['/user/clubs']);
  }

  navigateToEvents() {
    this.router.navigate(['/user/events']);
  }

  navigateToSpaces() {
    this.router.navigate(['/user/spaces']);
  }

  navigateToAdmin() {
    this.router.navigate(['/admin']);
  }
}
