import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CourseService, Lesson, Course } from '../course-list/service/course.service';
import { NavbarFrontComponent } from '../navbar-front/navbar-front.component';
import { FooterFrontComponent } from '../footer-front/footer-front.component';

@Component({
  selector: 'app-list-lesson-student',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarFrontComponent, FooterFrontComponent],
  templateUrl: './list-lesson-student.component.html',
  styleUrls: ['./list-lesson-student.component.css']
})
export class ListLessonStudentComponent implements OnInit {
  @Input() courseId?: number;
  @Input() showBackLink = true;
  @Output() backToCourses = new EventEmitter<void>();
  
  lessons: Lesson[] = [];
  course: Course | null = null;
  loading = true;
  notification: { message: string; type: 'success' | 'error' } | null = null;
  
  // Expanded lesson
  expandedLessonId: number | null = null;

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

  showNotification(message: string, type: 'success' | 'error'): void {
    this.notification = { message, type };
    setTimeout(() => this.notification = null, 4000);
  }

  // Toggle lesson content (dropdown)
  toggleLesson(id: number | undefined): void {
    if (id) {
      this.expandedLessonId = this.expandedLessonId === id ? null : id;
    }
  }

  // Check if lesson is expanded
  isLessonExpanded(id: number | undefined): boolean {
    return id !== undefined && this.expandedLessonId === id;
  }
}
