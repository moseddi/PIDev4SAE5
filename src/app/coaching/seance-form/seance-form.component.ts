import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CoachingService, Seance } from '../service/coaching.service';

@Component({
  selector: 'app-seance-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './seance-form.component.html',
  styleUrls: ['./seance-form.component.css']
})
export class SeanceFormComponent implements OnInit {
  seance: Seance = {
    goodName: '',
    seanceDate: '',
    seanceTime: ''
  };

  isEditMode = false;
  seanceId: number | null = null;
  loading = false;
  notification: { message: string; type: 'success' | 'error' } | null = null;

  constructor(
    private coachingService: CoachingService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.seanceId = +id;
      this.loadSeance(this.seanceId);
    }
  }

  loadSeance(id: number): void {
    this.loading = true;
    this.coachingService.getSeanceById(id).subscribe({
      next: (data) => {
        this.seance = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading seance', err);
        this.loading = false;
        this.showNotification('Failed to load seance.', 'error');
      }
    });
  }

  onSubmit(): void {
    if (this.isEditMode && this.seanceId) {
      this.coachingService.updateSeance(this.seanceId, this.seance).subscribe({
        next: () => {
          this.showNotification('Seance updated successfully!', 'success');
          setTimeout(() => this.router.navigate(['/seances']), 1500);
        },
        error: (err) => {
          console.error('Error updating seance', err);
          this.showNotification('Failed to update seance.', 'error');
        }
      });
    } else {
      this.coachingService.createSeance(this.seance).subscribe({
        next: () => {
          this.showNotification('Seance created successfully!', 'success');
          setTimeout(() => this.router.navigate(['/seances']), 1500);
        },
        error: (err) => {
          console.error('Error creating seance', err);
          this.showNotification('Failed to create seance.', 'error');
        }
      });
    }
  }

  showNotification(message: string, type: 'success' | 'error'): void {
    this.notification = { message, type };
    setTimeout(() => {
      this.notification = null;
    }, 4000);
  }
}
