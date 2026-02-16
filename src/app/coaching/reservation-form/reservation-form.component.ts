import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CoachingService, Reservation } from '../service/coaching.service';

@Component({
  selector: 'app-reservation-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reservation-form.component.html',
  styleUrls: ['./reservation-form.component.css']
})
export class ReservationFormComponent implements OnInit {
  reservation: Reservation = {
    studidname: '',
    merenumber: '',
    status: 'CONFIRMED'
  };

  isEditMode = false;
  reservationId: number | null = null;
  seanceId: number | null = null;
  loading = false;
  notification: { message: string; type: 'success' | 'error' } | null = null;

  statusOptions = ['CONFIRMED', 'PENDING', 'CANCELLED'];

  constructor(
    private coachingService: CoachingService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check if editing an existing reservation
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.reservationId = +id;
      this.loadReservation(this.reservationId);
    }

    // Check if creating for a specific seance
    const seanceIdParam = this.route.snapshot.paramMap.get('seanceId');
    if (seanceIdParam) {
      this.seanceId = +seanceIdParam;
    }
  }

  loadReservation(id: number): void {
    this.loading = true;
    this.coachingService.getReservationById(id).subscribe({
      next: (data) => {
        this.reservation = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading reservation', err);
        this.loading = false;
        this.showNotification('Failed to load reservation.', 'error');
      }
    });
  }

  onSubmit(): void {
    if (this.isEditMode && this.reservationId) {
      this.coachingService.updateReservation(this.reservationId, this.reservation).subscribe({
        next: () => {
          this.showNotification('Reservation updated successfully!', 'success');
          setTimeout(() => this.router.navigate(['/reservations']), 1500);
        },
        error: (err) => {
          console.error('Error updating reservation', err);
          this.showNotification('Failed to update reservation.', 'error');
        }
      });
    } else if (this.seanceId) {
      this.coachingService.createReservation(this.seanceId, this.reservation).subscribe({
        next: () => {
          this.showNotification('Reservation created successfully!', 'success');
          setTimeout(() => this.router.navigate(['/seances', this.seanceId, 'reservations']), 1500);
        },
        error: (err) => {
          console.error('Error creating reservation', err);
          this.showNotification('Failed to create reservation.', 'error');
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
