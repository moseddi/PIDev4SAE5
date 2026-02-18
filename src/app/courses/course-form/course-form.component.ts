import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CourseService, Course } from '../course-list/service/course.service';

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './course-form.component.html',
  styleUrls: ['./course-form.component.css']
})
export class CourseFormComponent implements OnInit {
  @Input() isEditMode = false;
  @Input() courseId?: number;
  @Input() hideCancelButton = false;
  @Output() courseSaved = new EventEmitter<void>();
  @Output() cancelForm = new EventEmitter<void>();

  courseForm: FormGroup;
  submitButtonText = 'Create Course';
  pageTitle = 'Create New Course';
  notification: { message: string; type: 'success' | 'error' } | null = null;
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService
  ) {
    this.courseForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      level: ['', Validators.required],
      duration: [0, [Validators.required, Validators.min(1)]],
      description: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Check if editing via route params
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.courseId = +idParam;
      this.submitButtonText = 'Update Course';
      this.pageTitle = 'Edit Course';
      this.loadCourse(this.courseId);
    }
    // Override with Input values if provided
    if (this.isEditMode && this.courseId) {
      this.submitButtonText = 'Update Course';
      this.pageTitle = 'Edit Course';
      this.loadCourse(this.courseId);
    }
  }

  loadCourse(id: number): void {
    this.courseService.getCourseById(id).subscribe({
      next: (course) => {
        this.courseForm.patchValue({
          title: course.title,
          level: course.level,
          duration: course.duration,
          description: course.description
        });
      },
      error: (err) => {
        console.error('Error loading course', err);
        this.showNotification('Failed to load course data.', 'error');
      }
    });
  }

  onSubmit(): void {
    if (this.courseForm.invalid) return;

    this.submitting = true;
    const courseData: Course = this.courseForm.value;

    if (this.isEditMode && this.courseId) {
      this.courseService.updateCourse(this.courseId, courseData).subscribe({
        next: () => {
          this.showNotification('Course updated successfully!', 'success');
          this.submitting = false;
          this.courseSaved.emit();
          if (!this.hideCancelButton) {
            setTimeout(() => this.router.navigate(['/courses']), 1500);
          }
        },
        error: (err) => {
          console.error('Error updating course', err);
          this.submitting = false;
          this.showNotification('Failed to update course. Please try again.', 'error');
        }
      });
    } else {
      this.courseService.createCourse(courseData).subscribe({
        next: () => {
          this.showNotification('Course created successfully!', 'success');
          this.submitting = false;
          this.courseSaved.emit();
          if (!this.hideCancelButton) {
            setTimeout(() => this.router.navigate(['/courses']), 1500);
          }
        },
        error: (err) => {
          console.error('Error creating course', err);
          this.submitting = false;
          this.showNotification('Failed to create course. Please try again.', 'error');
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

  onCancel(): void {
    this.cancelForm.emit();
  }
}
