import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Club } from '../../models/club.model';
import { CategoryClub } from '../../models/enums';
import { ClubService } from '../../services/club.service';
import { JoinClubFormComponent } from '../join-club-form/join-club-form.component';

@Component({
  selector: 'app-clubs-user-list',
  standalone: true,
  imports: [CommonModule, JoinClubFormComponent],
  templateUrl: './clubs-user-list.component.html',
  styleUrls: ['./clubs-user-list.component.css']
})
export class ClubsUserListComponent implements OnInit {
  clubs: Club[] = [];
  filteredClubs: Club[] = [];
  selectedCategory: string = 'all';
  selectedClubForJoin: { id: number; name: string } | null = null;
  showJoinForm: boolean = false;
  userRegistrations: number[] = []; // Store club IDs user has joined
  categories = [
    { value: 'all', label: 'ALL CLUBS' },
    { value: 'ACADEMY', label: 'ACADEMY' },
    { value: 'SPORTS', label: 'SPORTS' },
    { value: 'ARTS', label: 'ARTS' },
    { value: 'SOCIAL', label: 'SOCIAL' },
    { value: 'CULTURAL', label: 'CULTURAL' }
  ];

  constructor(
    private clubService: ClubService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadClubs();
    this.loadUserRegistrations();
  }

  loadClubs() {
    console.log('ClubsUserListComponent: Loading clubs...');
    this.clubService.getClubs().subscribe({
      next: (data) => {
        this.clubs = data || [];
        this.filteredClubs = [...this.clubs];
      },
      error: (err) => {
        console.error('ClubsUserListComponent: Error loading clubs:', err);
      }
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
    // Mock implementation - in real app, this would save to backend
    this.userRegistrations.push(this.selectedClubForJoin!.id);
    console.log('User joined club:', this.selectedClubForJoin?.name);
    alert(`Successfully joined ${this.selectedClubForJoin?.name}!`);
    this.closeJoinForm();
  }

  loadUserRegistrations() {
    const currentUserId = parseInt(localStorage.getItem('current_user_id') || '1');
    // Using simple registration check - in a real app this would call the registration service
    // But since this is a list view, we just need the user's registrations
    // For now we'll mock it if the service call is too complex for this component
    this.userRegistrations = [1, 3]; // Mocked as per other components
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

  navigateToDashboard() {
    this.router.navigate(['/frontoffice']);
  }
}
