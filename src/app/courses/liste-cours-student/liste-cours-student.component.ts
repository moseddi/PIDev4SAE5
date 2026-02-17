import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CourseService, Course } from '../course-list/service/course.service';
import { NavbarFrontComponent } from '../navbar-front/navbar-front.component';
import { FooterFrontComponent } from '../footer-front/footer-front.component';

@Component({
  selector: 'app-liste-cours-student',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarFrontComponent, FormsModule , FooterFrontComponent],
  templateUrl: './liste-cours-student.component.html',
  styleUrls: ['./liste-cours-student.component.css']
})
export class ListeCoursStudentComponent implements OnInit {
  courses: Course[] = [];
  loading = true;
  notification: { message: string; type: 'success' | 'error' } | null = null;

  // Search and filter
  searchText = '';
  selectedLevel = '';
  availableLevels = ['Beginner', 'Intermediate', 'Advanced', 'Business'];

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
        console.error('Erreur chargement cours', err);
        this.loading = false;
        this.showNotification('Impossible de charger les cours. Réessayez plus tard.', 'error');
      }
    });
  }

  showNotification(message: string, type: 'success' | 'error'): void {
    this.notification = { message, type };
    setTimeout(() => (this.notification = null), 4000);
  }

  // Get filtered courses based on search text and level
  get filteredCourses(): Course[] {
    let filtered = this.courses;

    // Filter by level (radio button selection)
    if (this.selectedLevel) {
      filtered = filtered.filter(course =>
        course.level.toLowerCase() === this.selectedLevel.toLowerCase()
      );
    }

    // Filter by search text (search in course title)
    if (this.searchText.trim()) {
      const search = this.searchText.toLowerCase().trim();
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(search)
      );
    }

    return filtered;
  }

  // Clear all filters
  clearFilters(): void {
    this.searchText = '';
    this.selectedLevel = '';
  }
}