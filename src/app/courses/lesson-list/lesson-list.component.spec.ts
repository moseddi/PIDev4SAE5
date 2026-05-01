import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { LessonListComponent } from './lesson-list.component';
import { CourseService } from '../course-list/service/course.service';

const mockLessons = [
  { id: 1, lessontitle: 'Lesson 1', content: 'Content 1', lessonorder: 2 },
  { id: 2, lessontitle: 'Lesson 2', content: 'Content 2', lessonorder: 1 },
];

describe('LessonListComponent', () => {
  let component: LessonListComponent;
  let fixture: ComponentFixture<LessonListComponent>;
  let courseServiceSpy: jasmine.SpyObj<CourseService>;

  beforeEach(async () => {
    courseServiceSpy = jasmine.createSpyObj('CourseService', [
      'getCourseById', 'getLessonsByCourse', 'deleteLesson'
    ]);
    courseServiceSpy.getCourseById.and.returnValue(of({ id: 1, title: 'Course', level: 'A1', duration: 10, description: '' }));
    courseServiceSpy.getLessonsByCourse.and.returnValue(of(mockLessons));

    await TestBed.configureTestingModule({
      imports: [LessonListComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: CourseService, useValue: courseServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LessonListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load lessons sorted by lessonorder', () => {
    expect(component.lessons[0].lessonorder).toBe(1);
    expect(component.lessons[1].lessonorder).toBe(2);
    expect(component.loading).toBeFalse();
  });

  it('should set error notification on loadLessons failure', () => {
    courseServiceSpy.getLessonsByCourse.and.returnValue(throwError(() => new Error('fail')));
    component.loadLessons();
    expect(component.notification?.type).toBe('error');
    expect(component.loading).toBeFalse();
  });

  describe('deleteLesson', () => {
    it('should not delete when lesson has no id', () => {
      component.deleteLesson({ lessontitle: 'No ID', content: '', lessonorder: 1 });
      expect(courseServiceSpy.deleteLesson).not.toHaveBeenCalled();
    });

    it('should not delete when confirm is cancelled', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.deleteLesson(mockLessons[0]);
      expect(courseServiceSpy.deleteLesson).not.toHaveBeenCalled();
    });

    it('should delete lesson on confirm', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      courseServiceSpy.deleteLesson.and.returnValue(of(undefined));
      const lesson = { id: 1, lessontitle: 'Lesson 1', content: 'Content 1', lessonorder: 2 };
      component.deleteLesson(lesson);
      expect(courseServiceSpy.deleteLesson).toHaveBeenCalledWith(1);
    });

    it('should set error notification on delete failure', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      courseServiceSpy.deleteLesson.and.returnValue(throwError(() => new Error('fail')));
      component.deleteLesson(mockLessons[0]);
      expect(component.notification?.type).toBe('error');
    });
  });

  describe('form visibility', () => {
    it('should show new lesson form', () => {
      component.showNewLessonForm();
      expect(component.showForm).toBeTrue();
      expect(component.isEditMode).toBeFalse();
    });

    it('should show edit lesson form', () => {
      const lesson = { id: 1, lessontitle: 'Lesson 1', content: 'Content 1', lessonorder: 2 };
      component.showEditLessonForm(lesson);
      expect(component.showForm).toBeTrue();
      expect(component.isEditMode).toBeTrue();
      expect(component.editingLessonId).toBe(1);
    });

    it('should hide form', () => {
      component.showForm = true;
      component.hideForm();
      expect(component.showForm).toBeFalse();
    });

    it('should reload lessons on lesson saved', () => {
      component.onLessonSaved();
      expect(courseServiceSpy.getLessonsByCourse).toHaveBeenCalled();
    });
  });
});
