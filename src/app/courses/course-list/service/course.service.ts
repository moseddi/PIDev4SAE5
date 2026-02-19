import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

// Interface matching the actual backend JSON response (capital D in Duration)
export interface CourseApiResponse {
  id?: number;
  title: string;
  level: string;
  Duration: number;
  description: string;
}

// Frontend-friendly interface
export interface Course {
  id?: number;
  title: string;
  level: string;
  duration: number;
  description: string;
  
}

export interface Lesson {
  id?: number;
  lessontitle: string;
  content: string;
  lessonorder: number;
  course?: Course;
  pdfUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class CourseService {
  // Relative URL - Angular proxy forwards /Cours_Service/* to http://localhost:5059
  //private baseUrl = '/Cours_Service';
   apiUrl = 'http://localhost:8089/Cours_Service';

  constructor(private http: HttpClient) {}

  // Helper: map API response to frontend Course model
  private mapCourse(apiCourse: CourseApiResponse): Course {
    return {
      id: apiCourse.id,
      title: apiCourse.title,
      level: apiCourse.level,
      duration: apiCourse.Duration,
      description: apiCourse.description
    };
  }

  // Helper: map frontend Course to API request body
  private toApiCourse(course: Course): CourseApiResponse {
    return {
      id: course.id,
      title: course.title,
      level: course.level,
      Duration: course.duration,
      description: course.description
    };
  }

  // ==================== Courses ====================

  getAllCourses(): Observable<Course[]> {
    return this.http.get<CourseApiResponse[]>(`${this.apiUrl}/api/courses`).pipe(
      map(courses => courses.map(c => this.mapCourse(c)))
    );
  }

  getCourseById(id: number): Observable<Course> {
    return this.http.get<CourseApiResponse>(`${this.apiUrl}/api/courses/${id}`).pipe(
      map(c => this.mapCourse(c))
    );
  }

  createCourse(course: Course): Observable<Course> {
    return this.http.post<CourseApiResponse>(`${this.apiUrl}/api/courses`, this.toApiCourse(course)).pipe(
      map(c => this.mapCourse(c))
    );
  }

  updateCourse(id: number, course: Course): Observable<Course> {
    return this.http.put<CourseApiResponse>(`${this.apiUrl}/api/courses/${id}`, this.toApiCourse(course)).pipe(
      map(c => this.mapCourse(c))
    );
  }

  deleteCourse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/courses/${id}`);
  }

  // ==================== Lessons ====================

  getAllLessons(): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.apiUrl}/api/lessons`);
  }

  getLessonById(id: number): Observable<Lesson> {
    return this.http.get<Lesson>(`${this.apiUrl}/api/lessons/${id}`);
  }

  getLessonsByCourse(courseId: number): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.apiUrl}/api/courses/${courseId}/lessons`);
  }

  createLesson(courseId: number, lesson: Lesson): Observable<Lesson> {
    return this.http.post<Lesson>(`${this.apiUrl}/api/courses/${courseId}/lessons`, lesson);
  }

  updateLesson(id: number, lesson: Lesson): Observable<Lesson> {
    return this.http.put<Lesson>(`${this.apiUrl}/api/lessons/${id}`, lesson);
  }

  deleteLesson(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/lessons/${id}`);
  }

  // ==================== PDF Upload ====================

  uploadLessonPdf(lessonId: number, file: File): Observable<{ pdfUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ pdfUrl: string }>(`${this.apiUrl}/api/lessons/${lessonId}/pdf`, formData);
  }
}
