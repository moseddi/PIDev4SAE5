import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CoachingService, Seance } from '../service/coaching.service';

@Component({
  selector: 'app-seance-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './seance-list.component.html',
  styleUrls: ['./seance-list.component.css']
})
export class SeanceListComponent implements OnInit {
  seances: Seance[] = [];
  loading = true;
  notification: { message: string; type: 'success' | 'error' } | null = null;

  constructor(private coachingService: CoachingService) {}

  ngOnInit(): void {
    this.loadSeances();
  }

  loadSeances(): void {
    this.loading = true;
    this.coachingService.getAllSeances().subscribe({
      next: (data) => {
        this.seances = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading seances', err);
        this.loading = false;
        this.showNotification('Failed to load seances. Please try again.', 'error');
      }
    });
  }

  deleteSeance(seance: Seance): void {
    if (!seance.id) return;
    const confirmed = confirm(`Are you sure you want to delete "${seance.goodName}"?`);
    if (!confirmed) return;

    this.coachingService.deleteSeance(seance.id).subscribe({
      next: () => {
        this.seances = this.seances.filter(s => s.id !== seance.id);
        this.showNotification(`Seance "${seance.goodName}" deleted successfully.`, 'success');
      },
      error: (err) => {
        console.error('Error deleting seance', err);
        this.showNotification('Failed to delete seance. Please try again.', 'error');
      }
    });
  }

  showNotification(message: string, type: 'success' | 'error'): void {
    this.notification = { message, type };
    setTimeout(() => {
      this.notification = null;
    }, 4000);
  }
}
