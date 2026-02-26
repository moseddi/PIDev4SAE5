import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PhysicalSpaceService } from '../../services';
import { PhysicalSpace } from '../../models';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-space-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './space-details.component.html',
  styleUrl: './space-details.component.css'
})
export class SpaceDetailsComponent implements OnInit {
  space: PhysicalSpace | undefined;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private physicalSpaceService: PhysicalSpaceService,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    console.log('Loading space details for ID:', id);
    if (id) {
      this.physicalSpaceService.getSpaceById(+id).subscribe(space => {
        console.log('Space loaded from service:', space);
        this.space = space;
        this.isLoading = false;
      });
    }
  }

  goBack() {
    this.router.navigate(['/spaces']);
  }

  editSpace() {
    if (this.space) {
      this.router.navigate(['/spaces/edit', this.space.IdPhysicalSpace]);
    }
  }

  async deleteSpace() {
    if (this.space) {
      const confirmed = await this.notificationService.confirm('Are you sure you want to authorize the removal of this space?');
      if (confirmed) {
        this.physicalSpaceService.deleteSpace(this.space.IdPhysicalSpace).subscribe(success => {
          if (success) {
            this.notificationService.success('Space deleted successfully!');
            this.router.navigate(['/spaces']);
          }
        });
      }
    }
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'reserved':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusIcon(status: string): string {
    switch (status.toLowerCase()) {
      case 'available':
        return '✓';
      case 'occupied':
        return '✗';
      case 'maintenance':
        return '⚠';
      case 'reserved':
        return '📅';
      default:
        return '•';
    }
  }
}
