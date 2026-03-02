import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ClubService } from '../../services/club.service';
import { Club } from '../../models/club.model';
import { JoinClubFormComponent } from '../join-club-form/join-club-form.component';
import { ClubRegistrationService } from '../../services/club-registration.service';

@Component({
  selector: 'app-club-details',
  standalone: true,
  imports: [CommonModule, JoinClubFormComponent],
  templateUrl: './club-details.component.html',
  styleUrls: ['./club-details.component.css']
})
export class ClubDetailsComponent implements OnInit {
  club: Club | null = null;
  isLoading = true;
  error: string | null = null;

  // Registration state
  showJoinModal = false;
  registrationStatus: 'None' | 'Pending' | 'Approved' = 'None';
  currentUserId = 1; // Default user ID

  constructor(
    private route: ActivatedRoute,
    private clubService: ClubService,
    private clubRegistrationService: ClubRegistrationService,
    private router: Router
  ) {
    // Get current user ID
    const storedId = localStorage.getItem('current_user_id');
    if (storedId) {
      this.currentUserId = parseInt(storedId, 10);
    }
  }

  ngOnInit() {
    console.log('=== CLUB DETAILS COMPONENT INIT ===');

    // Check if club data was passed via state
    const state = history.state;
    if (state && state.club) {
      console.log('Club data found in state:', state.club);
      this.club = state.club;
      this.isLoading = false;
      this.checkRegistrationStatus();
    }

    // Get club ID from route parameters
    this.route.params.subscribe(params => {
      const clubId = +params['id'];
      console.log('Club ID from route:', clubId);

      // If we already have the club from state and it matches the ID, we're good
      if (this.club && this.club.ID_Club === clubId) {
        console.log('Using club data from state');
        this.checkRegistrationStatus();
        return;
      }

      if (clubId) {
        this.loadClubDetails(clubId);
      } else {
        if (!this.club) {
          this.error = 'Invalid club ID';
          this.isLoading = false;
        }
      }
    });
  }

  loadClubDetails(clubId: number) {
    console.log('=== LOADING CLUB DETAILS ===');
    console.log('Fetching club details for ID:', clubId);

    this.clubService.getClubById(clubId).subscribe({
      next: (club) => {
        console.log('Club details loaded:', club);
        this.club = club;
        this.isLoading = false;
        this.checkRegistrationStatus();
      },
      error: (error) => {
        console.error('Error loading club details:', error);
        this.error = 'Failed to load club details';
        this.isLoading = false;
      }
    });
  }

  checkRegistrationStatus() {
    if (!this.club) return;

    // We use id primarily, fallback to ID_Club if needed (though usually normalized)
    const clubId = this.club.ID_Club;
    if (!clubId) return;

    this.clubRegistrationService.getRegistrationsByUser(this.currentUserId).subscribe(registrations => {
      const registration = registrations.find(r => r.Club_Id === clubId);
      if (registration) {
        this.registrationStatus = registration.Status as 'Pending' | 'Approved';
      } else {
        this.registrationStatus = 'None';
      }
      console.log('Registration status for user', this.currentUserId, 'in club', clubId, ':', this.registrationStatus);
    });
  }

  goBack() {
    console.log('=== NAVIGATING BACK TO LIST ===');
    // Using simple location.back() or navigating to a known parent
    // If we came from admin-clubs, go there. If from frontoffice (implied by "Back to List"), go there?
    // The user said "remove edit club... user can do it". It sounds like this is now a user-facing page.
    // The previous back button said "Back to Admin Clubs". The new request implies user context.
    // I'll check history or just default to /frontoffice if it looks like user mode, but 
    // for now let's stick to safe navigation.
    this.router.navigate(['/frontoffice']);
  }

  openJoinModal() {
    this.showJoinModal = true;
  }

  closeJoinModal() {
    this.showJoinModal = false;
  }

  onJoined() {
    this.checkRegistrationStatus(); // Refresh status
    this.closeJoinModal();
  }

  getContactEmail(): string {
    return this.club?.Email_Contact || '';
  }
}
