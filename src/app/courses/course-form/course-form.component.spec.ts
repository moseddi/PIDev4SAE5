import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { CourseFormComponent } from './course-form.component';
import { CourseService } from '../course-list/service/course.service';
import { NotificationService } from '../../services/notification.service';

describe('CourseFormComponent - create mode', () => {
  let component: CourseFormComponent;
  let fixture: ComponentFixture<CourseFormComponent>;
  let courseServiceSpy: jasmine.SpyObj<CourseService>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
  let router: Router;

  beforeEach(async () => {
    courseServiceSpy = jasmine.createSpyObj('CourseService', ['getCourseById', 'createCourse', 'updateCourse']);
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['addNotification']);

    await TestBed.configureTestingModule({
      imports: [CourseFormComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: CourseService, useValue: courseServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CourseFormComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not submit when form is invalid', () => {
    component.courseForm.reset();
    component.onSubmit();
    expect(courseServiceSpy.createCourse).not.toHaveBeenCalled();
  });

  it('should call createCourse on valid submit', () => {
    courseServiceSpy.createCourse.and.returnValue(of({ id: 1, title: 'Test', level: 'A1', duration: 10, description: 'Desc' }));
    component.courseForm.setValue({ title: 'Test Course', level: 'A1', duration: 10, description: 'Description' });
    component.onSubmit();
    expect(courseServiceSpy.createCourse).toHaveBeenCalled();
    expect(notificationServiceSpy.addNotification).toHaveBeenCalled();
  });

  it('should set error notification on create failure', () => {
    courseServiceSpy.createCourse.and.returnValue(throwError(() => new Error('fail')));
    component.courseForm.setValue({ title: 'Test Course', level: 'A1', duration: 10, description: 'Description' });
    component.onSubmit();
    expect(component.notification?.type).toBe('error');
    expect(component.submitting).toBeFalse();
  });

  it('should emit cancelForm on onCancel', () => {
    const cancelSpy = spyOn(component.cancelForm, 'emit');
    component.onCancel();
    expect(cancelSpy).toHaveBeenCalled();
  });

  it('should show and auto-clear notification', (done) => {
    component.showNotification('Test message', 'success');
    expect(component.notification?.message).toBe('Test message');
    setTimeout(() => {
      expect(component.notification).toBeNull();
      done();
    }, 4100);
  });
});

describe('CourseFormComponent - edit mode via route', () => {
  let component: CourseFormComponent;
  let fixture: ComponentFixture<CourseFormComponent>;
  let courseServiceSpy: jasmine.SpyObj<CourseService>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    courseServiceSpy = jasmine.createSpyObj('CourseService', ['getCourseById', 'createCourse', 'updateCourse']);
    notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['addNotification']);
    courseServiceSpy.getCourseById.and.returnValue(of({ id: 3, title: 'Existing', level: 'B1', duration: 20, description: 'Desc' }));

    await TestBed.configureTestingModule({
      imports: [CourseFormComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: CourseService, useValue: courseServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '3' } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CourseFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load course by id on init', () => {
    expect(courseServiceSpy.getCourseById).toHaveBeenCalledWith(3);
    expect(component.courseForm.value.title).toBe('Existing');
  });

  it('should call updateCourse on submit in edit mode', () => {
    courseServiceSpy.updateCourse.and.returnValue(of({ id: 3, title: 'Updated', level: 'B2', duration: 25, description: 'Updated' }));
    component.courseForm.setValue({ title: 'Updated', level: 'B2', duration: 25, description: 'Updated desc' });
    component.onSubmit();
    expect(courseServiceSpy.updateCourse).toHaveBeenCalledWith(3, jasmine.any(Object));
  });

  it('should set error notification on update failure', () => {
    courseServiceSpy.updateCourse.and.returnValue(throwError(() => new Error('fail')));
    component.courseForm.setValue({ title: 'Updated', level: 'B2', duration: 25, description: 'Updated desc' });
    component.onSubmit();
    expect(component.notification?.type).toBe('error');
  });

  it('should set error notification when loadCourse fails', () => {
    courseServiceSpy.getCourseById.and.returnValue(throwError(() => new Error('fail')));
    component.loadCourse(3);
    expect(component.notification?.type).toBe('error');
  });
});
