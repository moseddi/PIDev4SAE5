import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ClubService } from '../../services';
import { Club } from '../../models';

@Component({
  selector: 'app-clubs-user-list',
  templateUrl: './clubs-user-list.component.html',
  styleUrls: ['./clubs-user-list.component.css']
})
export class ClubsUserListComponent implements OnInit {
  clubs: Club[] = [];
  filteredClubs: Club[] = [];
  userRegistrations: number[] = [];

  constructor(
    private clubService: ClubService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadClubs();
    this.loadUserRegistrations();
  }

  navigateToDashboard() {
    this.router.navigate(['/user']);
  }

  loadClubs() {
    console.log('User/ClubsUserListComponent: Loading clubs...');
    this.clubService.getClubs().subscribe({
      next: (data: Club[]) => {
        console.log('User/ClubsUserListComponent: Received data:', data);
        this.clubs = data || [];
        this.filteredClubs = [...this.clubs];
      },
      error: (error: any) => {
        console.error('User/ClubsUserListComponent: Error loading clubs:', error);
      }
    });
  }

  loadUserRegistrations() {
    // Mock data - replace with actual service call
    this.userRegistrations = [1, 3]; // User is registered for clubs with IDs 1 and 3
  }

  isUserJoined(clubId: number): boolean {
    return this.userRegistrations.includes(clubId);
  }

  joinClub(clubId: number) {
    if (this.isUserJoined(clubId)) {
      alert('You are already a member of this club!');
      return;
    }

    alert(`Joining club with ID: ${clubId}`);
    // TODO: Implement actual join logic
    this.userRegistrations.push(clubId);
  }

  viewClubDetails(clubId: number) {
    this.router.navigate(['/admin-clubs', clubId]);
  }
}
