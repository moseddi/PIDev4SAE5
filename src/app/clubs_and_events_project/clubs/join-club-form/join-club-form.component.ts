import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ClubService } from '../../services/club.service';
import { ClubRegistrationService } from '../../services/club-registration.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-join-club-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './join-club-form.component.html',
  styleUrls: ['./join-club-form.component.css']
})
export class JoinClubFormComponent implements OnInit {
  @Input() clubId: number = 0;
  @Input() clubName: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() joined = new EventEmitter<void>();

  joinForm: FormGroup;
  isSubmitting = false;
  clubDetails: any = null;

  constructor(
    private fb: FormBuilder,
    private clubRegistrationService: ClubRegistrationService,
    private clubService: ClubService,
    private notificationService: NotificationService
  ) {
    // Get current user ID from localStorage or use default 1
    const currentUserId = parseInt(localStorage.getItem('current_user_id') || '1');

    this.joinForm = this.fb.group({
      userId: [currentUserId, Validators.required],
      status: ['Pending', Validators.required],
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[+]?[\d\s\-\(\)]+$/)]],
      studentId: ['', [Validators.required, Validators.minLength(3)]],
      yearOfStudy: ['', Validators.required],
      motivation: ['', [Validators.required, Validators.minLength(5)]],
      skills: [''],
      termsAccepted: [false, Validators.requiredTrue]
    });
  }

  ngOnInit() {
    this.loadClubDetails();
  }

  loadClubDetails() {
    if (this.clubId) {
      this.clubService.getClubById(this.clubId).subscribe({
        next: (club) => {
          this.clubDetails = club;
          if (club && club.name) {
            this.clubName = club.name;
          }
        },
        error: (error) => {
          console.error('Error loading club details:', error);
        }
      });
    }
  }

  onSubmit() {
    console.log('=== FORM SUBMIT CLICKED ===');
    console.log('Form Validity:', this.joinForm.valid);
    console.log('Form Values:', this.joinForm.value);

    if (this.joinForm.invalid) {
      console.warn('Form is invalid. Errors:', this.getFormErrors());
      this.notificationService.error('Please fill all required fields correctly.');
      return;
    }

    if (!this.isSubmitting) {
      this.isSubmitting = true;

      const registrationData = {
        User_Id: Number(this.joinForm.value.userId),
        Club_Id: Number(this.clubId),
        Status: 'Pending',
        FullName: this.joinForm.value.fullName,
        Email: this.joinForm.value.email,
        Phone: this.joinForm.value.phone,
        StudentId: this.joinForm.value.studentId,
        YearOfStudy: this.joinForm.value.yearOfStudy,
        Motivation: this.joinForm.value.motivation,
        Skills: this.joinForm.value.skills,
        TermsAccepted: this.joinForm.value.termsAccepted,
        Date_Inscription: new Date().toISOString().split('.')[0]
      };

      console.log('Sending Registration Data:', registrationData);

      this.clubRegistrationService.createRegistration(registrationData).subscribe({
        next: (response) => {
          this.notificationService.success(`Your application to join ${this.clubName} has been submitted successfully!`);
          this.joined.emit();
          this.close.emit();
        },
        error: (error) => {
          console.error('Registration error details:', error);
          this.isSubmitting = false;
          let errorMessage = 'Unknown error';
          if (error.status === 400) {
            // Show the actual backend validation error if available
            if (error.error?.message) {
              errorMessage = error.error.message;
            } else if (typeof error.error === 'object') {
              // Validation errors come as field → message map
              const fieldErrors = Object.entries(error.error)
                .map(([field, msg]) => `${field}: ${msg}`)
                .join(', ');
              errorMessage = fieldErrors || 'Bad Request: Please verify your information.';
            } else {
              errorMessage = 'Bad Request: Please verify your information.';
            }
          } else if (error.status === 0) {
            errorMessage = 'Cannot reach the server.';
          } else {
            errorMessage = error.error?.message || error.message || 'Server error';
          }
          this.notificationService.error(`Failed to submit application: ${errorMessage}`);
        }
      });
    }
  }

  private getFormErrors() {
    const errors: any = {};
    Object.keys(this.joinForm.controls).forEach(key => {
      const controlErrors = this.joinForm.get(key)?.errors;
      if (controlErrors != null) {
        errors[key] = controlErrors;
      }
    });
    return errors;
  }

  onCancel() {
    this.close.emit();
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollToBottom() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }
}
