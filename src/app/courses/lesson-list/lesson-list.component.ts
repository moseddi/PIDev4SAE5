import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CourseService, Lesson, Course } from '../course-list/service/course.service';
import { LessonFormComponent } from '../lesson-form/lesson-form.component';

@Component({
  selector: 'app-lesson-list',
  standalone: true,
  imports: [CommonModule, RouterLink, LessonFormComponent],
  templateUrl: './lesson-list.component.html',
  styleUrls: ['./lesson-list.component.css']
})
export class LessonListComponent implements OnInit {
  @Input() courseId?: number;
  @Input() showBackLink = true;
  @Output() backToCourses = new EventEmitter<void>();
  
  lessons: Lesson[] = [];
  course: Course | null = null;
  loading = true;
  notification: { message: string; type: 'success' | 'error' } | null = null;
  
  // Form visibility
  showForm = false;
  isEditMode = false;
  editingLessonId?: number;

  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService
  ) {}

  ngOnInit(): void {
    // Use Input courseId if provided, otherwise get from route
    let id = this.courseId;
    if (!id) {
      const routeId = this.route.snapshot.paramMap.get('courseId');
      id = routeId ? +routeId : undefined;
    }
    
    if (id) {
      this.courseId = id;
      this.loadCourse();
      this.loadLessons();
    }
  }

  loadCourse(): void {
    if (!this.courseId) return;
    this.courseService.getCourseById(this.courseId).subscribe({
      next: (data) => this.course = data,
      error: (err) => console.error('Error loading course', err)
    });
  }

  loadLessons(): void {
    if (!this.courseId) return;
    this.loading = true;
    this.courseService.getLessonsByCourse(this.courseId).subscribe({
      next: (data) => {
        this.lessons = data.sort((a, b) => a.lessonorder - b.lessonorder);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading lessons', err);
        this.loading = false;
        this.showNotification('Failed to load lessons.', 'error');
      }
    });
  }

  deleteLesson(lesson: Lesson): void {
    if (!lesson.id) return;
    const confirmed = confirm(`Are you sure you want to delete "${lesson.lessontitle}"?`);
    if (!confirmed) return;

    this.courseService.deleteLesson(lesson.id).subscribe({
      next: () => {
        this.lessons = this.lessons.filter(l => l.id !== lesson.id);
        this.showNotification(`Lesson "${lesson.lessontitle}" deleted successfully.`, 'success');
      },
      error: (err) => {
        console.error('Error deleting lesson', err);
        this.showNotification('Failed to delete lesson.', 'error');
      }
    });
  }

  showNotification(message: string, type: 'success' | 'error'): void {
    this.notification = { message, type };
    setTimeout(() => this.notification = null, 4000);
  }

  // Show new lesson form
  showNewLessonForm(): void {
    this.isEditMode = false;
    this.editingLessonId = undefined;
    this.showForm = true;
  }

  // Show edit lesson form
  showEditLessonForm(lesson: Lesson): void {
    this.isEditMode = true;
    this.editingLessonId = lesson.id;
    this.showForm = true;
  }

  // Hide form
  hideForm(): void {
    this.showForm = false;
    this.isEditMode = false;
    this.editingLessonId = undefined;
  }

  // Handle lesson saved event
  onLessonSaved(): void {
    this.hideForm();
    this.loadLessons();
  }
}
