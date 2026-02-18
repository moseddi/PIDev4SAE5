import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CoachingService, Reservation } from '../service/coaching.service';

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './reservation-list.component.html',
  styleUrls: ['./reservation-list.component.css']
})
export class ReservationListComponent implements OnInit {
  reservations: Reservation[] = [];
  loading = true;
  seanceId: number | null = null;
  notification: { message: string; type: 'success' | 'error' } | null = null;

  constructor(
    private coachingService: CoachingService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const seanceIdParam = this.route.snapshot.paramMap.get('seanceId');
    if (seanceIdParam) {
      this.seanceId = +seanceIdParam;
      this.loadReservationsBySeance(this.seanceId);
    } else {
      this.loadAllReservations();
    }
  }

  loadAllReservations(): void {
    this.loading = true;
    this.coachingService.getAllReservations().subscribe({
      next: (data) => {
        this.reservations = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading reservations', err);
        this.loading = false;
        this.showNotification('Failed to load reservations.', 'error');
      }
    });
  }

  loadReservationsBySeance(seanceId: number): void {
    this.loading = true;
    this.coachingService.getReservationsBySeance(seanceId).subscribe({
      next: (data) => {
        this.reservations = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading reservations', err);
        this.loading = false;
        this.showNotification('Failed to load reservations.', 'error');
      }
    });
  }

  deleteReservation(reservation: Reservation): void {
    if (!reservation.id) return;
    const confirmed = confirm(`Are you sure you want to delete this reservation for "${reservation.studidname}"?`);
    if (!confirmed) return;

    this.coachingService.deleteReservation(reservation.id).subscribe({
      next: () => {
        this.reservations = this.reservations.filter(r => r.id !== reservation.id);
        this.showNotification('Reservation deleted successfully.', 'success');
      },
      error: (err) => {
        console.error('Error deleting reservation', err);
        this.showNotification('Failed to delete reservation.', 'error');
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED': return 'status-confirmed';
      case 'CANCELLED': return 'status-cancelled';
      case 'PENDING': return 'status-pending';
      default: return 'status-default';
    }
  }

  showNotification(message: string, type: 'success' | 'error'): void {
    this.notification = { message, type };
    setTimeout(() => {
      this.notification = null;
    }, 4000);
  }
}
