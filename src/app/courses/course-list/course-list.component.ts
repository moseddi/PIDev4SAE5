
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { CourseService, Course } from './service/course.service';
import { RouterLink } from '@angular/router'; 
@Component({
  selector: 'app-course-list',
  standalone: true,
   imports: [CommonModule, RouterLink],  
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.css']
})
export class CourseListComponent implements OnInit {
courses: Course[] = [];

  constructor(private courseService: CourseService) {}

  ngOnInit(): void {
    this.courseService.getAllCourses().subscribe({
      next: (data) => {
        this.courses = data;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des cours', err);
      }
    });
  }
}
