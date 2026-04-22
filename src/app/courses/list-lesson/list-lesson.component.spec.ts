import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { ListLessonComponent } from './list-lesson.component';
import { CourseService, Lesson, Course } from '../course-list/service/course.service';
import { of, throwError } from 'rxjs';

describe('ListLessonComponent', () => {
  let component: ListLessonComponent;
  let fixture: ComponentFixture<ListLessonComponent>;
  let courseServiceSpy: jasmine.SpyObj<CourseService>;

  const mockCourse: Course = { id: 1, title: 'English Basics', level: 'Beginner', duration: 10, description: 'Intro' };
  const mockLessons: Lesson[] = [
    { id: 1, lessontitle: 'Lesson 1', content: 'Content 1', lessonorder: 1 },
    { id: 2, lessontitle: 'Lesson 2', content: 'Content 2', lessonorder: 2 }
  ];

  beforeEach(async () => {
    courseServiceSpy = jasmine.createSpyObj('CourseService', ['getCourseById', 'getLessonsByCourse', 'deleteLesson']);
    courseServiceSpy.getCourseById.and.returnValue(of(mockCourse));
    courseServiceSpy.getLessonsByCourse.and.returnValue(of(mockLessons));

    await TestBed.configureTestingModule({
      imports: [ListLessonComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: CourseService, useValue: courseServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ListLessonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load lessons on init', () => {
    expect(component.lessons.length).toBe(2);
    expect(component.loading).toBeFalse();
  });

  it('should load course on init', () => {
    expect(component.course?.title).toBe('English Basics');
  });

  it('should show error notification when loading fails', () => {
    courseServiceSpy.getLessonsByCourse.and.returnValue(throwError(() => new Error('Error')));
    component.loadLessons();
    expect(component.notification?.type).toBe('error');
  });

  it('should toggle lesson expansion', () => {
    expect(component.expandedLessonId).toBeNull();
    component.toggleLesson(1);
    expect(component.expandedLessonId).toBe(1);
    component.toggleLesson(1);
    expect(component.expandedLessonId).toBeNull();
  });

  it('should show new lesson form', () => {
    component.showNewLessonForm();
    expect(component.showForm).toBeTrue();
    expect(component.isEditMode).toBeFalse();
  });

  it('should show edit lesson form', () => {
    component.showEditLessonForm(mockLessons[0]);
    expect(component.showForm).toBeTrue();
    expect(component.isEditMode).toBeTrue();
    expect(component.editingLessonId).toBe(1);
  });

  it('should hide form', () => {
    component.showForm = true;
    component.hideForm();
    expect(component.showForm).toBeFalse();
  });

  it('should not delete lesson without id', () => {
    const lesson: Lesson = { lessontitle: 'No ID', content: 'test', lessonorder: 1 };
    component.deleteLesson(lesson);
    expect(courseServiceSpy.deleteLesson).not.toHaveBeenCalled();
  });
});
