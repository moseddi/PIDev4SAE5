import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LessonFormComponent } from './lesson-form.component';
import { CourseService } from '../course-list/service/course.service';

describe('LessonFormComponent - create mode', () => {
  let component: LessonFormComponent;
  let fixture: ComponentFixture<LessonFormComponent>;
  let courseServiceSpy: jasmine.SpyObj<CourseService>;
  let router: Router;

  beforeEach(async () => {
    courseServiceSpy = jasmine.createSpyObj('CourseService', ['getLessonById', 'createLesson', 'updateLesson', 'uploadLessonPdf']);

    await TestBed.configureTestingModule({
      imports: [LessonFormComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: CourseService, useValue: courseServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LessonFormComponent);
    component = fixture.componentInstance;
    component.courseId = 1;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not submit when form is invalid', () => {
    component.lessonForm.reset();
    component.onSubmit();
    expect(courseServiceSpy.createLesson).not.toHaveBeenCalled();
  });

  it('should call createLesson on valid submit', () => {
    courseServiceSpy.createLesson.and.returnValue(of({ id: 1, lessontitle: 'L1', content: 'Content', lessonorder: 1 }));
    component.lessonForm.setValue({ lessontitle: 'Lesson 1', content: 'Content here', lessonorder: 1 });
    component.onSubmit();
    expect(courseServiceSpy.createLesson).toHaveBeenCalledWith(1, jasmine.any(Object));
  });

  it('should set error notification on create failure', () => {
    courseServiceSpy.createLesson.and.returnValue(throwError(() => new Error('fail')));
    component.lessonForm.setValue({ lessontitle: 'Lesson 1', content: 'Content here', lessonorder: 1 });
    component.onSubmit();
    expect(component.notification?.type).toBe('error');
    expect(component.submitting).toBeFalse();
  });

  it('should emit cancelForm on onCancel', () => {
    const cancelSpy = spyOn(component.cancelForm, 'emit');
    component.onCancel();
    expect(cancelSpy).toHaveBeenCalled();
  });

  it('should return correct back link with courseId', () => {
    component.courseId = 5;
    expect(component.getBackLink()).toBe('/courses/5/lessons');
  });

  it('should return /courses when no courseId', () => {
    component.courseId = undefined;
    expect(component.getBackLink()).toBe('/courses');
  });

  it('should set selectedPdf on valid file selection', () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const event = { target: { files: [file] } } as any;
    component.onFileSelected(event);
    expect(component.selectedPdf).toBe(file);
    expect(component.pdfPreview).toBe('test.pdf');
  });

  it('should show error for non-PDF file', () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const event = { target: { files: [file] } } as any;
    component.onFileSelected(event);
    expect(component.notification?.type).toBe('error');
    expect(component.selectedPdf).toBeNull();
  });

  it('should clear pdf on removePdf', () => {
    component.selectedPdf = new File([''], 'test.pdf', { type: 'application/pdf' });
    component.pdfPreview = 'test.pdf';
    component.removePdf();
    expect(component.selectedPdf).toBeNull();
    expect(component.pdfPreview).toBeNull();
  });
});

describe('LessonFormComponent - edit mode', () => {
  let component: LessonFormComponent;
  let fixture: ComponentFixture<LessonFormComponent>;
  let courseServiceSpy: jasmine.SpyObj<CourseService>;

  beforeEach(async () => {
    courseServiceSpy = jasmine.createSpyObj('CourseService', ['getLessonById', 'createLesson', 'updateLesson', 'uploadLessonPdf']);
    courseServiceSpy.getLessonById.and.returnValue(of({
      id: 7, lessontitle: 'Existing Lesson', content: 'Content', lessonorder: 2,
      course: { id: 1, title: 'Course', level: 'A1', duration: 10, description: '' }
    }));

    await TestBed.configureTestingModule({
      imports: [LessonFormComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: CourseService, useValue: courseServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: (key: string) => key === 'id' ? '7' : null } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LessonFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load lesson by id on init', () => {
    expect(courseServiceSpy.getLessonById).toHaveBeenCalledWith(7);
    expect(component.lessonForm.value.lessontitle).toBe('Existing Lesson');
  });

  it('should call updateLesson on submit in edit mode', () => {
    courseServiceSpy.updateLesson.and.returnValue(of({ id: 7, lessontitle: 'Updated', content: 'Content', lessonorder: 2 }));
    component.lessonForm.setValue({ lessontitle: 'Updated Lesson', content: 'New content', lessonorder: 2 });
    component.onSubmit();
    expect(courseServiceSpy.updateLesson).toHaveBeenCalledWith(7, jasmine.any(Object));
  });

  it('should set error notification on update failure', () => {
    courseServiceSpy.updateLesson.and.returnValue(throwError(() => new Error('fail')));
    component.lessonForm.setValue({ lessontitle: 'Updated', content: 'Content', lessonorder: 2 });
    component.onSubmit();
    expect(component.notification?.type).toBe('error');
  });

  it('should set error when loadLesson fails', () => {
    courseServiceSpy.getLessonById.and.returnValue(throwError(() => new Error('fail')));
    component.loadLesson(7);
    expect(component.notification?.type).toBe('error');
  });
});
