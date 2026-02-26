import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Club } from '../../models/club.model';
import { CategoryClub } from '../../models/enums';
import { ClubService } from '../../services/club.service';
import { ClubRegistrationService } from '../../services/club-registration.service';
import { NotificationService } from '../../services/notification.service';
import { JoinClubFormComponent } from '../join-club-form/join-club-form.component';

@Component({
  selector: 'app-clubs-user-view',
  standalone: true,
  imports: [CommonModule, JoinClubFormComponent],
  templateUrl: './clubs-user-view.component.html',
  styleUrls: ['./clubs-user-view.component.css']
})
export class ClubsUserViewComponent implements OnInit {
  clubs: Club[] = [];
  filteredClubs: Club[] = [];
  selectedCategory: string = 'all';
  userRegistrations: number[] = []; // Store club IDs user has joined
  selectedClubForJoin: { id: number; name: string } | null = null;
  showJoinForm: boolean = false;
  categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'SPORTS', label: 'Sports' },
    { value: 'CULTURAL', label: 'Culture' },
    { value: 'TECHNOLOGY', label: 'Technology' },
    { value: 'ACADEMY', label: 'Academic' },
    { value: 'SOCIAL', label: 'Social' }
  ];

  constructor(
    private clubService: ClubService,
    private clubRegistrationService: ClubRegistrationService,
    private router: Router,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    this.loadClubs();
    this.loadUserRegistrations();
  }

  loadClubs() {
    this.clubService.getClubs().subscribe(data => {
      this.clubs = data;
      this.filteredClubs = [...this.clubs];
    });
  }

  loadUserRegistrations() {
    this.clubRegistrationService.getRegistrations().subscribe((registrations: any[]) => {
      this.userRegistrations = registrations.map((reg: any) => reg.Club_Id);
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

  openJoinForm(club: Club) {
    this.selectedClubForJoin = { id: club.ID_Club || 0, name: club.name };
    this.showJoinForm = true;
  }

  closeJoinForm() {
    this.showJoinForm = false;
    this.selectedClubForJoin = null;
  }

  onJoinSubmit() {
    if (this.selectedClubForJoin) {
      this.userRegistrations.push(this.selectedClubForJoin.id);
      this.notificationService.success(`Successfully joined ${this.selectedClubForJoin.name}!`);
    }
    this.closeJoinForm();
  }

  joinClub(clubId: number) {
    const club = this.clubs.find(c => c.ID_Club === clubId);
    if (club) {
      this.openJoinForm(club);
    }
  }

  leaveClub(clubId: number) {
    // Mock implementation for now
    this.userRegistrations = this.userRegistrations.filter(id => id !== clubId);
    this.notificationService.success('Successfully left the club!');
  }

  isUserRegistered(clubId: number): boolean {
    return this.userRegistrations.includes(clubId);
  }

  viewDetails(id: number) {
    this.router.navigate(['/admin-clubs', id]);
  }

  getCategoryLabel(category: CategoryClub): string {
    const cat = this.categories.find(c => c.value === category);
    return cat ? cat.label : category;
  }

  navigateToBackoffice() {
    this.router.navigate(['/frontoffice']);
  }
}
