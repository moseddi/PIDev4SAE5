import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ListLessonStudentComponent } from './list-lesson-student.component';
import { CourseService } from '../course-list/service/course.service';

const mockLessons = [
  { id: 1, lessontitle: 'Lesson A', content: 'Content A', lessonorder: 2 },
  { id: 2, lessontitle: 'Lesson B', content: 'Content B', lessonorder: 1 },
];

describe('ListLessonStudentComponent', () => {
  let component: ListLessonStudentComponent;
  let fixture: ComponentFixture<ListLessonStudentComponent>;
  let courseServiceSpy: jasmine.SpyObj<CourseService>;

  beforeEach(async () => {
    courseServiceSpy = jasmine.createSpyObj('CourseService', ['getCourseById', 'getLessonsByCourse']);
    courseServiceSpy.getCourseById.and.returnValue(of({ id: 1, title: 'Course', level: 'A1', duration: 10, description: '' }));
    courseServiceSpy.getLessonsByCourse.and.returnValue(of(mockLessons));

    await TestBed.configureTestingModule({
      imports: [ListLessonStudentComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: CourseService, useValue: courseServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } },
      ],
    })
    // Override template to avoid NavbarFront/FooterFront dependencies
    .overrideTemplate(ListLessonStudentComponent, '<div></div>')
    .compileComponents();

    fixture = TestBed.createComponent(ListLessonStudentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load lessons sorted by lessonorder', () => {
    expect(component.lessons[0].lessonorder).toBe(1);
    expect(component.loading).toBeFalse();
  });

  it('should set error notification on loadLessons failure', () => {
    courseServiceSpy.getLessonsByCourse.and.returnValue(throwError(() => new Error('fail')));
    component.loadLessons();
    expect(component.notification?.type).toBe('error');
    expect(component.loading).toBeFalse();
  });

  describe('toggleLesson', () => {
    it('should expand a lesson', () => {
      component.toggleLesson(1);
      expect(component.expandedLessonId).toBe(1);
    });

    it('should collapse an already expanded lesson', () => {
      component.expandedLessonId = 1;
      component.toggleLesson(1);
      expect(component.expandedLessonId).toBeNull();
    });

    it('should not toggle when id is undefined', () => {
      component.toggleLesson(undefined);
      expect(component.expandedLessonId).toBeNull();
    });
  });

  describe('isLessonExpanded', () => {
    it('should return true when lesson is expanded', () => {
      component.expandedLessonId = 2;
      expect(component.isLessonExpanded(2)).toBeTrue();
    });

    it('should return false when lesson is not expanded', () => {
      component.expandedLessonId = 1;
      expect(component.isLessonExpanded(2)).toBeFalse();
    });

    it('should return false when id is undefined', () => {
      expect(component.isLessonExpanded(undefined)).toBeFalse();
    });
  });
});
