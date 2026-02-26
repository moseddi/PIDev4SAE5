import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Club } from '../../models/club.model';
import { CategoryClub } from '../../models/enums';
import { ClubService } from '../../services/club.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-clubs-management',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clubs-management.component.html',
  styleUrls: ['./clubs-management.component.css']
})
export class ClubsManagementComponent implements OnInit {
  clubs: Club[] = [];
  filteredClubs: Club[] = [];
  selectedCategory: string = 'all';
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
    private router: Router,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    this.loadClubs();
  }

  loadClubs() {
    this.clubService.getClubs().subscribe((data: Club[]) => {
      this.clubs = data;
      this.filteredClubs = [...this.clubs];
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

  createClub() {
    this.router.navigate(['/admin-clubs/create']);
  }

  updateClub(club: any): void {
    console.log('=== UPDATE CLUB DEBUG ===');
    console.log('updateClub method called!');
    console.log('Club object:', club);
    console.log('Club ID:', club.ID_Club);

    // Vérification que l'ID existe
    if (!club || !club.ID_Club) {
      console.error('Invalid club data for update:', club);
      alert('Invalid club data for update');
      return;
    }

    // Conversion explicite en nombre
    const clubId = Number(club.ID_Club);
    const clubName = club.name || 'this club';

    if (isNaN(clubId)) {
      console.error('ID is not a valid number:', clubId);
      alert('Invalid club ID for update');
      return;
    }

    console.log('Updating club with ID (converted):', clubId);
    console.log('Final ID type:', typeof clubId);

    // Navigate to update form directly - CORRECT ROUTE PATTERN
    console.log('Navigating to: /admin-clubs/edit/' + clubId);
    this.router.navigate(['/admin-clubs/edit', clubId]);
  }

  async deleteClub(club: any): Promise<void> {
    console.log('=== DELETE CLUB DEBUG ===');
    console.log('Club object:', club);
    console.log('Club ID:', club.ID_Club);

    // Vérification que l'ID existe
    if (!club || !club.ID_Club) {
      console.error('Invalid club data for deletion:', club);
      return;
    }

    // Conversion explicite en nombre
    const clubId = Number(club.ID_Club);
    const clubName = club.name || 'this club';

    if (isNaN(clubId)) {
      console.error('ID is not a valid number:', clubId);
      return;
    }

    const confirmed = await this.notificationService.confirm(`Are you sure you want to authorize the removal of "${clubName}"?`);
    if (confirmed) {
      this.clubService.deleteClub(clubId).subscribe({
        next: (response: any) => {
          console.log('Club deleted successfully:', response);
          this.loadClubs();
          this.notificationService.success('Club deleted successfully!');
        },
        error: (error: any) => {
          console.error('Error deleting club:', error);
          this.notificationService.error('Error deleting club: ' + error.message);
        }
      });
    }
  }



  getCategoryLabel(category: CategoryClub): string {
    const cat = this.categories.find(c => c.value === category);
    return cat ? cat.label : category;
  }

  navigateToDashboard() {
    this.router.navigate(['/backoffice']);
  }
}
