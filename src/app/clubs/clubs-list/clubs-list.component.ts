import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Club } from '../../models/club.model';
import { CategoryClub } from '../../models/enums';
import { ClubService } from '../../services/club.service';
import { ClubRegistrationService } from '../../services/club-registration.service';
import { JoinClubFormComponent } from '../join-club-form/join-club-form.component';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-clubs-list',
  standalone: true,
  imports: [CommonModule, RouterModule, JoinClubFormComponent],
  templateUrl: './clubs-list.component.html',
  styleUrls: ['./clubs-list.component.css']
})
export class ClubsListComponent implements OnInit {
  clubs: Club[] = [];
  filteredClubs: Club[] = [];
  selectedCategory: string = 'all';
  selectedClubForJoin: { id: number; name: string } | null = null;
  userRegistrations: number[] = []; // Store club IDs user has joined

  categories = [
    { name: 'all', label: 'ALL CLUBS' },
    { name: CategoryClub.ACADEMY, label: 'ACADEMY' },
    { name: CategoryClub.SPORTS, label: 'SPORTS' },
    { name: CategoryClub.ARTS, label: 'ARTS' },
    { name: CategoryClub.SOCIAL, label: 'SOCIAL' },
    { name: CategoryClub.CULTURAL, label: 'CULTURAL' }
  ];

  constructor(
    private clubService: ClubService,
    private clubRegistrationService: ClubRegistrationService,
    private router: Router,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    console.log('ClubsListComponent: Initializing...');
    this.loadClubs();
    this.loadUserRegistrations();
  }

  loadClubs() {
    console.log('ClubsListComponent: Loading clubs from API...');
    this.clubService.getClubs().subscribe({
      next: (data: Club[]) => {
        console.log('ClubsListComponent: Received data:', data);
        this.clubs = data || [];
        this.filteredClubs = [...this.clubs];
        console.log('ClubsListComponent: Clubs count:', this.clubs.length);
      },
      error: (error: any) => {
        console.error('ClubsListComponent: Error loading clubs:', error);
        this.notificationService.error('Failed to load clubs. Please check if the backend is running.');
      }
    });
  }

  loadUserRegistrations() {
    console.log('=== LOAD USER REGISTRATIONS ===');

    // Reset the array first
    this.userRegistrations = [];

    // Get current user ID from localStorage or use default 1
    const currentUserId = parseInt(localStorage.getItem('current_user_id') || '1');
    console.log('Current user ID:', currentUserId);

    this.clubRegistrationService.getRegistrationsByUser(currentUserId).subscribe(registrations => {
      console.log('Raw registrations from service:', registrations);

      // Only add club IDs where user is actually registered
      this.userRegistrations = registrations.map(reg => reg.Club_Id);
      console.log('Final userRegistrations array:', this.userRegistrations);
      console.log('User is member of clubs:', this.userRegistrations);

      // Force UI update
      this.userRegistrations = [...this.userRegistrations];
      console.log('=== END LOAD USER REGISTRATIONS ===');
    });
  }

  filterByCategory(category: string) {
    this.selectedCategory = category;
    if (category === 'all') {
      this.filteredClubs = [...this.clubs];
    } else {
      this.filteredClubs = this.clubs.filter(club => club.Category === category);
    }
  }

  getCategoryButtonClass(category: string): string {
    const baseClass = 'px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ';

    if (this.selectedCategory === category) {
      return baseClass + 'bg-[#F6BD60] text-white border-2 border-[#F6BD60]';
    } else {
      return baseClass + 'bg-white/10 text-[#2D5757] border-2 border-white/20 hover:bg-white/20';
    }
  }

  isUserJoined(clubId: number): boolean {
    // Check if this specific club ID is in user's registrations
    const isMember = this.userRegistrations.includes(clubId);
    console.log(`Checking if user is member of club ${clubId}:`, isMember);
    console.log('User is member of clubs:', this.userRegistrations);
    console.log('Looking for club ID:', clubId);
    console.log('Found in array:', this.userRegistrations.includes(clubId));
    return isMember;
  }

  getJoinButtonText(clubId: number): string {
    return this.isUserJoined(clubId) ? 'Joined' : 'Join';
  }

  getClubId(club: Club): number {
    return club.ID_Club || 0;
  }

  getJoinButtonClass(clubId: number): string {
    const baseClass = 'btn-primary flex-1 transition-all duration-300 ';

    if (this.isUserJoined(clubId)) {
      return baseClass + 'opacity-50 cursor-not-allowed bg-gray-300 text-gray-500';
    } else {
      return baseClass + 'hover:bg-[#F6BD60]/90 hover:scale-105';
    }
  }

  editClub(clubOrId: any): void {
    console.log('=== EDIT CLUB DEBUG ===');
    console.log('Edit parameter:', clubOrId);
    console.log('Parameter type:', typeof clubOrId);

    let clubId: number;
    let club: Club | undefined;

    if (typeof clubOrId === 'object') {
      // Parameter is a Club object
      club = clubOrId as Club;
      clubId = club.ID_Club;
      console.log('Received Club object:', club);
      console.log('Editing club with ID:', clubId);
    } else if (typeof clubOrId === 'number') {
      // Parameter is a number
      clubId = clubOrId;
      club = this.clubs.find(c => c.ID_Club === clubId);
      console.log('Received club ID:', clubId);
      console.log('Found club:', club);
    } else {
      console.error('Invalid parameter type:', typeof clubOrId);
      alert('Invalid parameter type');
      return;
    }

    console.log('Final ID type:', typeof clubId);

    if (!clubId || isNaN(clubId)) {
      console.error('Invalid club ID for editing:', clubId);
      this.notificationService.error('Invalid club ID');
      return;
    }

    this.router.navigate(['/admin-clubs', 'edit', clubId]);
  }

  viewDetails(clubId: number): void {
    console.log('Navigating to club details:', clubId);
    this.router.navigate(['/admin-clubs', clubId]);
  }

  joinClub(clubId: number) {
    console.log('=== JOIN CLUB DEBUG ===');
    console.log('Received clubId parameter:', clubId);
    console.log('Type of clubId:', typeof clubId);

    // Force complete reset
    this.selectedClubForJoin = null;

    // Force change detection
    setTimeout(() => {
      console.log('All available clubs:', this.clubs);
      console.log('Looking for club with ID:', clubId);

      const club = this.clubs.find(c => c.ID_Club === clubId);
      console.log('Found club for join:', club);

      if (club) {
        this.selectedClubForJoin = {
          id: club.ID_Club,
          name: club.name
        };
        console.log('Set selectedClubForJoin to:', this.selectedClubForJoin);
      } else {
        console.error('Club not found for join with ID:', clubId);
      }
    }, 50);
  }

  onClubJoined() {
    console.log('=== CLUB JOINED SUCCESSFULLY ===');

    // Get the club ID that was just joined
    if (this.selectedClubForJoin) {
      const clubId = this.selectedClubForJoin.id;
      console.log('Adding club ID to userRegistrations:', clubId);

      // Immediately add to userRegistrations array
      if (!this.userRegistrations.includes(clubId)) {
        this.userRegistrations.push(clubId);
        console.log('Updated userRegistrations:', this.userRegistrations);
      }
    }

    // Also refresh from service
    setTimeout(() => {
      this.loadUserRegistrations();
    }, 500);
  }

  closeJoinForm() {
    this.selectedClubForJoin = null;
  }
}
