import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { EventService } from '../../services/event.service';
import { ClubService } from '../../services/club.service';
import { Event, EventCreateRequest, EventUpdateRequest, EventCreateRequestBackend, EventUpdateRequestBackend } from '../../models/event.model';
import { EventType } from '../../models/enums';
import { Club } from '../../models/club.model';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './event-form.component.html',
  styleUrls: ['./event-form.component.css']
})
export class EventFormComponent implements OnInit {
  eventForm: FormGroup;
  isEditMode = false;
  eventId: number | null = null;
  eventTypes = Object.values(EventType);
  clubs: Club[] = [];

  constructor(
    private fb: FormBuilder,
    private eventService: EventService,
    private clubService: ClubService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {
    this.eventForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      type: [EventType.MEETING, Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      manifesto: ['', [Validators.required, Validators.minLength(10)]],
      maxParticipants: [1, [Validators.required, Validators.min(1)]],
      status: ['PLANNED', Validators.required],
      clubId: [null, Validators.required],
      estimatedCost: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit() {
    console.log('=== EVENT FORM COMPONENT INIT ===');

    // Load clubs for selection
    this.loadClubs();

    // Check if we're in edit mode by checking route params
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.eventId = +params['id'];
        console.log('Edit mode detected for event ID:', this.eventId);
        this.loadEventData();
      }
    });
  }

  loadClubs() {
    console.log('=== LOADING CLUBS ===');
    this.clubService.getClubs().subscribe({
      next: (clubs) => {
        console.log('Clubs loaded:', clubs);
        this.clubs = clubs;
      },
      error: (error) => {
        console.error('Error loading clubs:', error);
      }
    });
  }

  loadEventData() {
    if (this.eventId) {
      console.log('=== LOADING EVENT DATA ===');
      console.log('Loading event data for ID:', this.eventId);

      this.eventService.getEventById(this.eventId).subscribe({
        next: (event) => {
          console.log('Event data loaded:', event);
          if (event) {
            this.eventForm.patchValue({
              title: event.Title || (event as any).title,
              type: event.Type || (event as any).type,
              startDate: event.StartDate || (event as any).startDate,
              endDate: event.EndDate || (event as any).endDate,
              manifesto: event.Manifesto || (event as any).manifesto || (event as any).description,
              maxParticipants: event.MaxParticipants || (event as any).maxParticipants,
              status: event.Status || (event as any).status,
              clubId: event.ID_Club || (event as any).ID_Club || (event as any).ClubId || (event as any).clubId,
              estimatedCost: (event as any).EstimatedCost || (event as any).estimatedCost || 0
            });
          }
        },
        error: (error) => {
          console.error('Error loading event data:', error);
        }
      });
    }
  }

  onSubmit() {
    console.log('=== SUBMITTING EVENT FORM ===');
    console.log('Form valid:', this.eventForm.valid);
    console.log('Form value:', this.eventForm.value);
    console.log('Form errors:', this.eventForm.errors);
    console.log('Form status:', this.eventForm.status);

    // Check each field individually
    console.log('Title valid:', this.eventForm.get('title')?.valid);
    console.log('Title value:', this.eventForm.get('title')?.value);
    console.log('Type valid:', this.eventForm.get('type')?.valid);
    console.log('Type value:', this.eventForm.get('type')?.value);
    console.log('Start Date valid:', this.eventForm.get('startDate')?.valid);
    console.log('Start Date value:', this.eventForm.get('startDate')?.value);
    console.log('End Date valid:', this.eventForm.get('endDate')?.valid);
    console.log('End Date value:', this.eventForm.get('endDate')?.value);
    console.log('Description valid:', this.eventForm.get('description')?.valid);
    console.log('Description value:', this.eventForm.get('description')?.value);
    console.log('Max Participants valid:', this.eventForm.get('maxParticipants')?.valid);
    console.log('Max Participants value:', this.eventForm.get('maxParticipants')?.value);

    if (this.eventForm.valid) {
      const formData = this.eventForm.value;
      console.log('Form data:', JSON.stringify(formData, null, 2));

      if (this.isEditMode && this.eventId) {
        console.log('=== UPDATING EVENT ===');
        console.log('Event ID:', this.eventId);
        const updateData: EventUpdateRequest = {
          Title: formData.title,
          type: formData.type,
          startDate: formData.startDate,
          endDate: formData.endDate,
          manifesto: formData.manifesto,
          maxParticipants: formData.maxParticipants,
          status: formData.status,
          ID_Club: formData.clubId,
          estimatedCost: formData.estimatedCost
        };

        console.log('Update data:', JSON.stringify(updateData, null, 2));

        this.eventService.updateEvent(this.eventId, updateData).subscribe({
          next: (response) => {
            console.log('Event updated successfully:', response);
            this.notificationService.success('Event updated successfully!');
            this.router.navigate(['/backoffice/events']);
          },
          error: (error) => {
            console.error('Error updating event:', error);
            console.error('Error status:', error?.status);
            console.error('Error message:', error?.message);
            this.notificationService.error(`Failed to update event: ${error?.message || 'Unknown error'}`);
          }
        });
      } else {
        console.log('=== CREATING EVENT ===');
        const createData: EventCreateRequest = {
          Title: formData.title,
          type: formData.type,
          startDate: formData.startDate,
          endDate: formData.endDate,
          manifesto: formData.manifesto,
          maxParticipants: formData.maxParticipants,
          status: formData.status,
          ID_Club: formData.clubId,
          estimatedCost: formData.estimatedCost
        };

        console.log('Create data:', JSON.stringify(createData, null, 2));

        // Log the exact data being sent
        console.log('=== SENDING TO SERVICE ===');
        console.log('Title:', createData.Title);
        console.log('Type:', createData.type);
        console.log('Start Date:', createData.startDate); // Corrected from 'Description' and 'updateData'
        console.log('End Date:', createData.endDate);
        console.log('Manifesto:', createData.manifesto);
        console.log('Max Participants:', createData.maxParticipants);
        console.log('Status:', createData.status);
        console.log('ID Club:', createData.ID_Club);

        this.eventService.createEvent(createData).subscribe({
          next: (response) => {
            console.log('Event created successfully:', response);
            this.notificationService.success('Event created successfully!');
            this.router.navigate(['/backoffice/events']);
          },
          error: (error) => {
            console.error('Error creating event:', error);

            let displayMessage = 'Unable to create event';
            if (error?.error?.error) {
              displayMessage = error.error.error;
            } else if (error?.error?.message) {
              displayMessage = error.error.message;
            } else if (error?.message) {
              displayMessage = error.message;
            }

            this.notificationService.error(displayMessage);
          }
        });
      }
    } else {
      console.log('=== FORM IS INVALID ===');
      console.log('Form errors:', this.eventForm.errors);
      this.notificationService.error('Please fill in all required fields correctly');
    }
  }

  onCancel() {
    console.log('=== CANCELING EVENT FORM ===');
    this.router.navigate(['/backoffice/events']);
  }
}
