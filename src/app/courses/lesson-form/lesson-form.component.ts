import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CourseService, Lesson } from '../course-list/service/course.service';

@Component({
  selector: 'app-lesson-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './lesson-form.component.html',
  styleUrls: ['./lesson-form.component.css']
})
export class LessonFormComponent implements OnInit {
  @Input() isEditMode = false;
  @Input() lessonId?: number;
  @Input() courseId?: number;
  @Input() hideCancelButton = false;
  @Input() showBackLink = true;
  @Output() lessonSaved = new EventEmitter<void>();
  @Output() cancelForm = new EventEmitter<void>();

  lessonForm: FormGroup;
  pageTitle = 'Create New Lesson';
  notification: { message: string; type: 'success' | 'error' } | null = null;
  submitting = false;
  
  // PDF upload
  selectedPdf: File | null = null;
  pdfPreview: string | null = null;
  uploadingPdf = false;
  existingPdfUrl?: string;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService
  ) {
    this.lessonForm = this.fb.group({
      lessontitle: ['', [Validators.required, Validators.minLength(3)]],
      content: ['', Validators.required],
      lessonorder: [1, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    // Check if editing via route params
    const lessonIdParam = this.route.snapshot.paramMap.get('id');
    const courseIdParam = this.route.snapshot.paramMap.get('courseId');

    // Use Input values if provided
    if (this.isEditMode && this.lessonId) {
      this.pageTitle = 'Edit Lesson';
      this.loadLesson(this.lessonId);
    } else if (lessonIdParam && !courseIdParam) {
      // Edit mode: /lessons/edit/:id
      this.isEditMode = true;
      this.lessonId = +lessonIdParam;
      this.pageTitle = 'Edit Lesson';
      this.loadLesson(this.lessonId);
    } else if (courseIdParam) {
      // Create mode: /courses/:courseId/lessons/new
      this.courseId = +courseIdParam;
    } else if (this.courseId) {
      // Use Input courseId
    }
  }

  loadLesson(id: number): void {
    this.courseService.getLessonById(id).subscribe({
      next: (lesson) => {
        this.courseId = lesson.course?.id;
        this.existingPdfUrl = lesson.pdfUrl;
        this.lessonForm.patchValue({
          lessontitle: lesson.lessontitle,
          content: lesson.content,
          lessonorder: lesson.lessonorder
        });
      },
      error: (err) => {
        console.error('Error loading lesson', err);
        this.showNotification('Failed to load lesson data.', 'error');
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.type !== 'application/pdf') {
        this.showNotification('Please select a PDF file.', 'error');
        return;
      }
      this.selectedPdf = file;
      this.pdfPreview = file.name;
    }
  }

  removePdf(): void {
    this.selectedPdf = null;
    this.pdfPreview = null;
  }

  private uploadPdf(lessonId: number): void {
    if (!this.selectedPdf) return;
    
    this.uploadingPdf = true;
    this.courseService.uploadLessonPdf(lessonId, this.selectedPdf).subscribe({
      next: (response) => {
        this.uploadingPdf = false;
        this.existingPdfUrl = response.pdfUrl;
      },
      error: (err) => {
        console.error('Error uploading PDF', err);
        this.uploadingPdf = false;
        this.showNotification('Lesson saved but PDF upload failed.', 'error');
      }
    });
  }

  onSubmit(): void {
    if (this.lessonForm.invalid) return;

    this.submitting = true;
    const lessonData: Lesson = this.lessonForm.value;

    if (this.isEditMode && this.lessonId) {
      this.courseService.updateLesson(this.lessonId, lessonData).subscribe({
        next: () => {
          this.showNotification('Lesson updated successfully!', 'success');
          // Upload PDF if selected
          if (this.selectedPdf && this.lessonId) {
            this.uploadPdf(this.lessonId);
          }
          this.submitting = false;
          this.lessonSaved.emit();
          if (!this.hideCancelButton) {
            setTimeout(() => {
              if (this.courseId) {
                this.router.navigate(['/courses', this.courseId, 'lessons']);
              } else {
                this.router.navigate(['/courses']);
              }
            }, 1500);
          }
        },
        error: (err) => {
          console.error('Error updating lesson', err);
          this.submitting = false;
          this.showNotification('Failed to update lesson.', 'error');
        }
      });
    } else if (this.courseId) {
      this.courseService.createLesson(this.courseId, lessonData).subscribe({
        next: (createdLesson) => {
          this.showNotification('Lesson created successfully!', 'success');
          // Upload PDF if selected
          if (this.selectedPdf && createdLesson.id) {
            this.uploadPdf(createdLesson.id);
          }
          this.submitting = false;
          this.lessonSaved.emit();
          if (!this.hideCancelButton) {
            setTimeout(() => this.router.navigate(['/courses', this.courseId, 'lessons']), 1500);
          }
        },
        error: (err) => {
          console.error('Error creating lesson', err);
          this.submitting = false;
          this.showNotification('Failed to create lesson.', 'error');
        }
      });
    }
  }

  showNotification(message: string, type: 'success' | 'error'): void {
    this.notification = { message, type };
    setTimeout(() => this.notification = null, 4000);
  }

  onCancel(): void {
    this.cancelForm.emit();
  }

  getBackLink(): string {
    if (this.courseId) {
      return `/courses/${this.courseId}/lessons`;
    }
    return '/courses';
  }
}
