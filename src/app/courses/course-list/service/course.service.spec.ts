import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CourseService, Course, Lesson } from './course.service';

describe('CourseService', () => {
  let service: CourseService;
  let httpMock: HttpTestingController;

  const mockApiCourse = { id: 1, title: 'English Basics', level: 'Beginner', Duration: 10, description: 'Intro' };
  const mockCourse: Course = { id: 1, title: 'English Basics', level: 'Beginner', duration: 10, description: 'Intro' };
  const mockLesson: Lesson = { id: 1, lessontitle: 'Lesson 1', content: 'Content', lessonorder: 1 };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CourseService]
    });
    service = TestBed.inject(CourseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Courses', () => {
    it('should GET all courses and map Duration to duration', () => {
      service.getAllCourses().subscribe(courses => {
        expect(courses[0].duration).toBe(10);
      });
      const req = httpMock.expectOne(`${service.apiUrl}/api/courses`);
      expect(req.request.method).toBe('GET');
      req.flush([mockApiCourse]);
    });

    it('should GET course by id', () => {
      service.getCourseById(1).subscribe(c => expect(c.id).toBe(1));
      const req = httpMock.expectOne(`${service.apiUrl}/api/courses/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockApiCourse);
    });

    it('should POST to create course with Duration field', () => {
      service.createCourse(mockCourse).subscribe();
      const req = httpMock.expectOne(`${service.apiUrl}/api/courses`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.Duration).toBe(10);
      req.flush(mockApiCourse);
    });

    it('should PUT to update course', () => {
      service.updateCourse(1, mockCourse).subscribe();
      const req = httpMock.expectOne(`${service.apiUrl}/api/courses/1`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockApiCourse);
    });

    it('should DELETE course', () => {
      service.deleteCourse(1).subscribe();
      const req = httpMock.expectOne(`${service.apiUrl}/api/courses/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('Lessons', () => {
    it('should GET all lessons', () => {
      service.getAllLessons().subscribe(lessons => expect(lessons.length).toBe(1));
      const req = httpMock.expectOne(`${service.apiUrl}/api/lessons`);
      expect(req.request.method).toBe('GET');
      req.flush([mockLesson]);
    });

    it('should GET lesson by id', () => {
      service.getLessonById(1).subscribe(l => expect(l.id).toBe(1));
      const req = httpMock.expectOne(`${service.apiUrl}/api/lessons/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockLesson);
    });

    it('should GET lessons by course', () => {
      service.getLessonsByCourse(1).subscribe();
      const req = httpMock.expectOne(`${service.apiUrl}/api/courses/1/lessons`);
      expect(req.request.method).toBe('GET');
      req.flush([mockLesson]);
    });

    it('should POST to create lesson', () => {
      service.createLesson(1, mockLesson).subscribe();
      const req = httpMock.expectOne(`${service.apiUrl}/api/courses/1/lessons`);
      expect(req.request.method).toBe('POST');
      req.flush({ id: 2, ...mockLesson });
    });

    it('should PUT to update lesson', () => {
      service.updateLesson(1, mockLesson).subscribe();
      const req = httpMock.expectOne(`${service.apiUrl}/api/lessons/1`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockLesson);
    });

    it('should DELETE lesson', () => {
      service.deleteLesson(1).subscribe();
      const req = httpMock.expectOne(`${service.apiUrl}/api/lessons/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
