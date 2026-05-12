import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CoachingService, Reservation, Seance } from '../../../coaching/service/coaching.service';

@Component({
  selector: 'app-admin-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-reservations.component.html',
  styleUrls: ['./admin-reservations.component.css']
})
export class AdminReservationsComponent implements OnInit {
  reservations: Reservation[] = [];
  seances: Seance[] = [];
  loading = true;
  notification: { message: string; type: 'success' | 'error' } | null = null;

  // Edit modal
  showEditModal = false;
  editingReservation: Reservation = { studidname: '', merenumber: '', status: 'CONFIRMED' };
  statusOptions = ['CONFIRMED', 'PENDING', 'CANCELLED'];

  constructor(
    private coachingService: CoachingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.coachingService.getAllReservations().subscribe({
      next: (data) => {
        this.reservations = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showNotification('Erreur lors du chargement des réservations.', 'error');
      }
    });
  }

  openEdit(reservation: Reservation): void {
    this.editingReservation = { ...reservation };
    this.showEditModal = true;
  }

  closeEdit(): void {
    this.showEditModal = false;
  }

  saveEdit(): void {
    if (!this.editingReservation.id) return;
    this.coachingService.updateReservation(this.editingReservation.id, this.editingReservation).subscribe({
      next: (updated) => {
        const idx = this.reservations.findIndex(r => r.id === updated.id);
        if (idx !== -1) this.reservations[idx] = updated;
        this.showEditModal = false;
        this.showNotification('Réservation mise à jour avec succès.', 'success');
      },
      error: () => this.showNotification('Erreur lors de la mise à jour.', 'error')
    });
  }

  deleteReservation(reservation: Reservation): void {
    if (!reservation.id) return;
    if (!confirm(`Supprimer la réservation de "${reservation.studidname}" ?`)) return;
    this.coachingService.deleteReservation(reservation.id).subscribe({
      next: () => {
        this.reservations = this.reservations.filter(r => r.id !== reservation.id);
        this.showNotification('Réservation supprimée.', 'success');
      },
      error: () => this.showNotification('Erreur lors de la suppression.', 'error')
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
    setTimeout(() => (this.notification = null), 4000);
  }
}
