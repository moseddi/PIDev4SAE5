import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PhysicalSpaceService } from '../../services';
import { PhysicalSpace } from '../../models';
import { SpaceType } from '../../models/enums';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-spaces-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spaces-list.component.html',
  styleUrls: ['./spaces-list.component.css']
})
export class SpacesListComponent implements OnInit {
  spaces: PhysicalSpace[] = [];
  filteredSpaces: PhysicalSpace[] = [];
  selectedType: string = 'all';

  spaceTypes = [
    { name: 'all', label: 'All Spaces' },
    { name: SpaceType.AUDITORIUM, label: 'Auditoriums' },
    { name: SpaceType.GYMNASIUM, label: 'Gymnasiums' },
    { name: SpaceType.STUDIO, label: 'Studios' },
    { name: SpaceType.LABORATORY, label: 'Laboratories' },
    { name: SpaceType.CLASSROOM, label: 'Classrooms' },
    { name: SpaceType.CONFERENCE_ROOM, label: 'Conference Rooms' },
    { name: SpaceType.STUDY_ROOM, label: 'Study Rooms' },
    { name: SpaceType.SPORTS_FIELD, label: 'Sports Fields' },
    { name: SpaceType.MEETING_ROOM, label: 'Meeting Rooms' },
    { name: SpaceType.DINING_HALL, label: 'Dining Halls' },
    { name: SpaceType.LIBRARY, label: 'Libraries' },
    { name: SpaceType.COMPUTER_LAB, label: 'Computer Labs' },
    { name: SpaceType.MUSIC_ROOM, label: 'Music Rooms' },
    { name: SpaceType.ART_GALLERY, label: 'Art Galleries' },
    { name: SpaceType.LECTURE_HALL, label: 'Lecture Halls' }
  ];

  constructor(
    private physicalSpaceService: PhysicalSpaceService,
    private router: Router,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    console.log('SpacesListComponent initialized!!!');
    console.log('Space types:', this.spaceTypes);
    this.selectedType = 'all'; // Explicit initialization
    console.log('Initial selectedType:', this.selectedType);
    this.loadSpaces();
  }

  loadSpaces() {
    console.log('Loading spaces...');
    this.physicalSpaceService.getSpaces().subscribe(data => {
      console.log('Spaces loaded:', data);
      this.spaces = data;
      this.filteredSpaces = [...this.spaces]; // Initialize filtered spaces
    });
  }

  async deleteSpace(id: number) {
    const confirmed = await this.notificationService.confirm('Are you sure you want to authorize the removal of this space?');
    if (confirmed) {
      this.physicalSpaceService.deleteSpace(id).subscribe(success => {
        if (success) {
          this.notificationService.success('Space deleted successfully!');
          this.loadSpaces();
        }
      });
    }
  }

  bookSpace(space: PhysicalSpace) {
    if (space.Status === 'UNAVAILABLE') {
      this.notificationService.error('This space is currently unavailable');
      return;
    }

    this.notificationService.info(`Booking protocol initiated for: ${space.Name}`);
    // TODO: Implement actual booking logic
  }

  navigateToCreate() {
    this.router.navigate(['/spaces/create']);
  }

  viewDetails(id: number) {
    this.router.navigate(['/spaces', id]);
  }

  editSpace(id: number) {
    this.router.navigate(['/spaces/edit', id]);
  }

  filterByType(type: string) {
    console.log('BUTTON CLICKED!!!', type);
    this.selectedType = type;
    console.log('Filtering by type:', type);
    console.log('Available spaces:', this.spaces);

    if (type === 'all') {
      this.filteredSpaces = [...this.spaces];
    } else {
      this.filteredSpaces = this.spaces.filter(space => {
        console.log('Space type:', space.Type, 'Filtering for:', type);
        return space.Type === type;
      });
    }

    console.log('Filtered spaces:', this.filteredSpaces);
  }

  getSpaceTypeButtonClass(type: string): string {
    const baseClass = 'px-4 py-2 rounded-lg font-medium transition-colors duration-300';
    const isActive = this.selectedType === type;

    console.log('Button class check - type:', type, 'selectedType:', this.selectedType, 'isActive:', isActive);

    if (isActive) {
      return `${baseClass} bg-[#2D5757] text-[#F7EDE2] shadow-lg scale-105`;
    } else {
      return `${baseClass} bg-white text-[#2D5757]/40 border border-black/5 hover:border-[#2D5757]/20 hover:text-[#2D5757]`;
    }
  }
}
