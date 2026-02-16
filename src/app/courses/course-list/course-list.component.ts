import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CourseService, Course } from './service/course.service';
import { RouterLink } from '@angular/router';
import { CourseFormComponent } from '../course-form/course-form.component';
import { LessonListComponent } from '../lesson-list/lesson-list.component';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, RouterLink, CourseFormComponent, LessonListComponent],
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.css']
})
export class CourseListComponent implements OnInit {
  courses: Course[] = [];
  loading = true;
  notification: { message: string; type: 'success' | 'error' } | null = null;
  
  // Form visibility
  showForm = false;
  isEditMode = false;
  editingCourseId?: number;
  
  // Lesson view
  showLessons = false;
  viewingCourseId?: number;

  constructor(private courseService: CourseService) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.loading = true;
    this.courseService.getAllCourses().subscribe({
      next: (data) => {
        this.courses = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading courses', err);
        this.loading = false;
        this.showNotification('Failed to load courses. Please try again.', 'error');
      }
    });
  }

  deleteCourse(course: Course): void {
    if (!course.id) return;
    const confirmed = confirm(`Are you sure you want to delete "${course.title}"?`);
    if (!confirmed) return;

    this.courseService.deleteCourse(course.id).subscribe({
      next: () => {
        this.courses = this.courses.filter(c => c.id !== course.id);
        this.showNotification(`Course "${course.title}" deleted successfully.`, 'success');
      },
      error: (err) => {
        console.error('Error deleting course', err);
        this.showNotification('Failed to delete course. Please try again.', 'error');
      }
    });
  }

  showNotification(message: string, type: 'success' | 'error'): void {
    this.notification = { message, type };
    setTimeout(() => {
      this.notification = null;
    }, 4000);
  }

  // Show new course form
  showNewCourseForm(): void {
    this.isEditMode = false;
    this.editingCourseId = undefined;
    this.showForm = true;
  }

  // Show edit course form
  showEditCourseForm(course: Course): void {
    this.isEditMode = true;
    this.editingCourseId = course.id;
    this.showForm = true;
  }

  // Hide form
  hideForm(): void {
    this.showForm = false;
    this.isEditMode = false;
    this.editingCourseId = undefined;
  }

  // Handle course saved event
  onCourseSaved(): void {
    this.hideForm();
    this.loadCourses();
  }

  // Show lessons for a course
  showCourseLessons(course: Course): void {
    if (course.id) {
      this.viewingCourseId = course.id;
      this.showLessons = true;
    }
  }

  // Hide lessons view
  hideLessons(): void {
    this.showLessons = false;
    this.viewingCourseId = undefined;
  }
}
