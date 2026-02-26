import { Component } from '@angular/core';
import { CommonModule, Location } from '@angular/common';

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-details.component.html',
  styleUrl: './event-details.component.css'
})
export class EventDetailsComponent {
  constructor(private location: Location) { }

  goBack() {
    this.location.back();
  }
  event = {
    id: 1,
    title: 'Annual Science Fair',
    date: '2024-03-15',
    time: '9:00 AM - 4:00 PM',
    location: 'Main Auditorium',
    attendees: 200,
    maxAttendees: 300,
    type: 'academic',
    description: 'Join us for our annual science fair where students showcase their innovative projects and scientific discoveries.',
    organizer: 'Science Department',
    requirements: ['Registration required', 'Project submission by March 1st', 'Display board provided'],
    schedule: [
      { time: '9:00 AM', activity: 'Registration & Setup' },
      { time: '10:00 AM', activity: 'Project Presentations' },
      { time: '12:00 PM', activity: 'Lunch Break' },
      { time: '1:00 PM', activity: 'Judging Session' },
      { time: '3:00 PM', activity: 'Awards Ceremony' }
    ]
  };
}
