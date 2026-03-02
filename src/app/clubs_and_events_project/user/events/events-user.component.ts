import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EventService } from '../../services/event.service';
import { Event } from '../../models/event.model';

@Component({
    selector: 'app-events-user',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './events-user.component.html',
    styleUrls: ['./events-user.component.css']
})
export class EventsUserComponent implements OnInit {
    events: Event[] = [];
    isLoading = true;
    error: string | null = null;

    // Track which events the user has registered for (in-session)
    registeredEventIds = new Set<number>();

    constructor(
        private eventService: EventService,
        private router: Router
    ) { }

    ngOnInit() {
        this.loadEvents();
    }

    loadEvents() {
        this.isLoading = true;
        this.error = null;

        console.log('EventsUserComponent: Loading events...');
        this.eventService.getEvents().subscribe({
            next: (events) => {
                console.log('EventsUserComponent: Events loaded successfully:', events);
                this.events = Array.isArray(events) ? events : [];
                this.isLoading = false;
            },
            error: (error) => {
                console.error('EventsUserComponent: Error loading events:', error);
                this.error = 'Unable to load events. Please check if the service is running.';
                this.isLoading = false;
            }
        });
    }

    register(event: Event) {
        const id = event.ID_Event || event.id;
        if (this.registeredEventIds.has(id)) {
            return; // already registered
        }
        this.registeredEventIds.add(id);
        console.log('EventsUserComponent: User registered for event:', id);
    }

    isRegistered(event: Event): boolean {
        return this.registeredEventIds.has(event.ID_Event || event.id);
    }

    goBack() {
        this.router.navigate(['/frontoffice']);
    }
}
