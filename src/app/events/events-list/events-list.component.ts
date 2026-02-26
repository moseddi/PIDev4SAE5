import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EventService } from '../../services/event.service';
import { Event } from '../../models/event.model';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './events-list.component.html',
  styleUrls: ['./events-list.component.css']
})
export class EventsListComponent implements OnInit {
  events: Event[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(
    private eventService: EventService,
    private router: Router,
    private notificationService: NotificationService
  ) { }

  ngOnInit() {
    console.log('=== EVENTS LIST COMPONENT INIT ===');
    this.loadEvents();
  }

  loadEvents() {
    console.log('=== LOADING EVENTS ===');
    console.log('Loading events from backend...');
    this.isLoading = true;
    this.error = null;

    this.eventService.getEvents().subscribe({
      next: (events) => {
        console.log('=== EVENTS LOADED SUCCESSFULLY ===');
        console.log('Raw response:', events);
        console.log('Events count:', events?.length || 0);

        if (Array.isArray(events)) {
          this.events = events;
          console.log('Events assigned:', this.events);
        } else {
          console.error('Expected array but got:', typeof events);
          this.error = 'Invalid data format received from server';
        }

        this.isLoading = false;
      },
      error: (error) => {
        console.error('=== ERROR LOADING EVENTS ===');
        console.error('Full error:', error);
        console.error('Error status:', error?.status);
        console.error('Error message:', error?.message);

        if (error?.status === 0) {
          this.error = 'Cannot connect to backend server. Please check if the server is running on http://localhost:7071';
        } else if (error?.status === 404) {
          this.error = 'Events API endpoint not found. Please check the backend configuration.';
        } else {
          this.error = `Failed to load events: ${error?.message || 'Unknown error'}`;
        }

        this.isLoading = false;
      }
    });
  }

  createEvent() {
    this.router.navigate(['/backoffice/events/create']);
  }

  editEvent(event: Event) {
    const id = event.ID_Event || event.id;
    this.router.navigate(['/backoffice/events', id, 'edit']);
  }

  async deleteEvent(event: Event) {
    const id = event.ID_Event || event.id;
    console.log('=== DELETE EVENT ===');
    console.log('Deleting event:', id);

    const confirmed = await this.notificationService.confirm(`Are you sure you want to authorize the removal of "${event.Title || (event as any).title}"?`);
    if (confirmed) {
      this.eventService.deleteEvent(id).subscribe({
        next: (response) => {
          console.log('Event deleted successfully:', response);
          this.notificationService.success('Event deleted successfully!');
          this.loadEvents(); // Reload the list
        },
        error: (error) => {
          console.error('Error deleting event:', error);
          this.notificationService.error('Failed to delete event: ' + (error?.message || 'Unknown error'));
        }
      });
    }
  }

  viewEventDetails(event: Event) {
    const id = event.ID_Event || event.id;
    this.router.navigate(['/backoffice/events', id]);
  }

  navigateToDashboard() {
    this.router.navigate(['/backoffice']);
  }
}
