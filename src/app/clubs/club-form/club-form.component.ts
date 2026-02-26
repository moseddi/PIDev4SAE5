import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ClubService } from '../../services';
import { Club, ClubCreateRequest, ClubUpdateRequest, ClubCreateRequestBackend, ClubUpdateRequestBackend } from '../../models';
import { CategoryClub } from '../../models/enums';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-club-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './club-form.component.html',
  styleUrl: './club-form.component.css'
})
export class ClubFormComponent implements OnInit {
  clubForm: FormGroup;
  isEditMode = false;
  clubId: number | null = null;
  categories = [
    { value: 'ACADEMY', label: 'ACADEMY' },
    { value: 'SPORTS', label: 'SPORTS' },
    { value: 'ARTS', label: 'ARTS' },
    { value: 'SOCIAL', label: 'SOCIAL' },
    { value: 'CULTURAL', label: 'CULTURAL' }
  ];

  constructor(
    private fb: FormBuilder,
    private clubService: ClubService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: NotificationService
  ) {
    this.clubForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      Status: ['ACTIVE', Validators.required],
      Email_Contact: ['', [Validators.required, Validators.email]],
      Category: ['', Validators.required],
      budget: [0, [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit() {
    console.log('=== CLUB FORM INIT ===');
    console.log('Current URL:', this.router.url);

    // Use ActivatedRoute to get route parameters properly
    this.route.params.subscribe(params => {
      console.log('Route params:', params);
      console.log('Club ID from params:', params['id']);

      if (params['id']) {
        this.isEditMode = true;
        this.clubId = +params['id']; // Convert to number
        console.log('Edit mode detected, clubId:', this.clubId);
        console.log('isEditMode:', this.isEditMode);

        if (this.clubId) {
          this.loadClubData();
        }
      } else {
        console.log('Create mode detected');
        this.isEditMode = false;
        this.clubId = null;
      }
    });

    console.log('=== END CLUB FORM INIT ===');
  }

  loadClubData() {
    console.log('=== LOAD CLUB DATA ===');
    console.log('Loading club data for ID:', this.clubId);

    if (this.clubId) {
      this.clubService.getClubById(this.clubId).subscribe({
        next: (club: any) => {
          console.log('=== CLUB DATA RECEIVED ===');
          console.log('Raw club data:', club);
          console.log('Club ID_Club:', club.ID_Club);
          console.log('Club id:', club.id);
          console.log('Club name:', club.name);
          console.log('Club Status:', club.Status);
          console.log('Club Category:', club.Category);
          console.log('Club Email_Contact:', club.Email_Contact);


          // Utiliser la même approche que deleteClub
          if (club && club.ID_Club) {
            const clubData = {
              name: club.name || '',
              Status: club.Status || 'ACTIVE',
              Email_Contact: club.Email_Contact || '',
              Category: club.Category || '',
              budget: club.budget || 0
            };

            console.log('=== FORM PATCH DATA ===');
            console.log('Form data to patch:', clubData);

            this.clubForm.patchValue(clubData);
            console.log('Form value after patch:', this.clubForm.value);
            console.log('=== END FORM PATCH ===');
          } else {
            console.error('Invalid club data received:', club);
          }
        },
        error: (error: any) => {
          console.error('=== LOAD CLUB ERROR ===');
          console.error('Error loading club data:', error);
          console.error('Error status:', error.status);
          console.error('Error message:', error.message);
          console.error('Full error object:', JSON.stringify(error, null, 2));
          console.log('=== END LOAD CLUB ERROR ===');
        }
      });
    }
    console.log('=== END LOAD CLUB DATA ===');
  }

  onSubmit() {
    console.log('=== FORM SUBMIT DEBUG ===');
    console.log('Form submitted!');
    console.log('isEditMode:', this.isEditMode);
    console.log('clubId:', this.clubId);
    console.log('Form valid:', this.clubForm.valid);
    console.log('Form invalid:', this.clubForm.invalid);
    console.log('Form value:', this.clubForm.value);

    if (this.clubForm.invalid) {
      console.log('=== FORM INVALID DEBUG ===');
      console.log('Form errors:', this.clubForm.errors);
      console.log('Field errors:');
      Object.keys(this.clubForm.controls).forEach(key => {
        const control = this.clubForm.get(key);
        console.log(`${key}:`, control?.errors);
      });
      console.log('=== END FORM INVALID DEBUG ===');
      return;
    }

    console.log('=== END FORM SUBMIT DEBUG ===');

    if (this.isEditMode && this.clubId) {
      console.log('=== UPDATE MODE ===');
      console.log('Updating existing club with ID:', this.clubId);
      this.updateExistingClub();
    } else {
      console.log('=== CREATE MODE ===');
      console.log('Creating new club');
      this.createNewClub();
    }
  }

  updateExistingClub() {
    console.log('=== UPDATE EXISTING CLUB ===');
    const formData = this.clubForm.value;
    console.log('Form data for update:', formData);

    const updateData: ClubUpdateRequestBackend = {
      name: formData.name,
      Status: formData.Status,
      Email_Contact: formData.Email_Contact,
      Category: formData.Category,
      budget: formData.budget
    };

    console.log('Update data prepared:', updateData);

    this.clubService.updateClub(this.clubId!, updateData).subscribe({
      next: (response: any) => {
        console.log('Club updated successfully:', response);
        this.notificationService.success('Club updated successfully!');
        this.router.navigate(['/backoffice/clubs']);
      },
      error: (error: any) => {
        console.error('Error updating club:', error);
        this.notificationService.error('Error updating club: ' + error.message);
      }
    });
  }

  createNewClub() {
    console.log('=== CREATE NEW CLUB ===');
    const formData = this.clubForm.value;
    console.log('Form data for create:', formData);

    const createData: ClubCreateRequestBackend = {
      name: formData.name,
      Status: formData.Status,
      Email_Contact: formData.Email_Contact,
      Category: formData.Category,
      budget: formData.budget
    };

    console.log('Create data prepared:', createData);

    this.clubService.createClub(createData).subscribe({
      next: (response: any) => {
        console.log('Club created successfully:', response);
        this.notificationService.success('Club created successfully!');
        this.router.navigate(['/backoffice/clubs']);
      },
      error: (error: any) => {
        console.error('Error creating club:', error);
        this.notificationService.error('Error creating club: ' + error.message);
      }
    });
  }

  onCancel() {
    console.log('Cancel clicked');
    this.router.navigate(['/backoffice/clubs']);
  }
}
