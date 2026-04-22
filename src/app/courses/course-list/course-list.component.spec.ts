import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CourseListComponent } from './course-list.component';
import { CourseService, Course } from './service/course.service';
import { of, throwError } from 'rxjs';

describe('CourseListComponent', () => {
  let component: CourseListComponent;
  let fixture: ComponentFixture<CourseListComponent>;
  let courseServiceSpy: jasmine.SpyObj<CourseService>;

  const mockCourses: Course[] = [
    { id: 1, title: 'English Basics', level: 'Beginner', duration: 10, description: 'Intro course' },
    { id: 2, title: 'Business English', level: 'Advanced', duration: 20, description: 'Business course' },
    { id: 3, title: 'Intermediate English', level: 'Intermediate', duration: 15, description: 'Mid course' }
  ];

  beforeEach(async () => {
    courseServiceSpy = jasmine.createSpyObj('CourseService', ['getAllCourses', 'deleteCourse']);
    courseServiceSpy.getAllCourses.and.returnValue(of(mockCourses));

    await TestBed.configureTestingModule({
      imports: [CourseListComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [{ provide: CourseService, useValue: courseServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(CourseListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load courses on init', () => {
    expect(component.courses.length).toBe(3);
    expect(component.loading).toBeFalse();
  });

  it('should show error notification when loading fails', () => {
    courseServiceSpy.getAllCourses.and.returnValue(throwError(() => new Error('Network error')));
    component.loadCourses();
    expect(component.notification?.type).toBe('error');
  });

  describe('filteredCourses', () => {
    it('should return all courses when no filter', () => {
      expect(component.filteredCourses.length).toBe(3);
    });

    it('should filter by level', () => {
      component.selectedLevel = 'Beginner';
      expect(component.filteredCourses.length).toBe(1);
      expect(component.filteredCourses[0].title).toBe('English Basics');
    });

    it('should filter by search text', () => {
      component.searchText = 'business';
      expect(component.filteredCourses.length).toBe(1);
      expect(component.filteredCourses[0].title).toBe('Business English');
    });

    it('should combine level and search filters', () => {
      component.selectedLevel = 'Advanced';
      component.searchText = 'business';
      expect(component.filteredCourses.length).toBe(1);
    });
  });

  describe('clearFilters', () => {
    it('should reset search and level', () => {
      component.searchText = 'test';
      component.selectedLevel = 'Beginner';
      component.clearFilters();
      expect(component.searchText).toBe('');
      expect(component.selectedLevel).toBe('');
    });
  });

  describe('form visibility', () => {
    it('should show new course form', () => {
      component.showNewCourseForm();
      expect(component.showForm).toBeTrue();
      expect(component.isEditMode).toBeFalse();
    });

    it('should show edit course form', () => {
      component.showEditCourseForm(mockCourses[0]);
      expect(component.showForm).toBeTrue();
      expect(component.isEditMode).toBeTrue();
      expect(component.editingCourseId).toBe(1);
    });

    it('should hide form', () => {
      component.showForm = true;
      component.hideForm();
      expect(component.showForm).toBeFalse();
    });
  });

  describe('showNotification', () => {
    it('should set notification and clear after timeout', (done) => {
      jasmine.clock().install();
      component.showNotification('Test message', 'success');
      expect(component.notification?.message).toBe('Test message');
      jasmine.clock().tick(4001);
      expect(component.notification).toBeNull();
      jasmine.clock().uninstall();
      done();
    });
  });

  describe('deleteCourse', () => {
    it('should not delete when course has no id', () => {
      const course: Course = { title: 'No ID', level: 'Beginner', duration: 5, description: 'test' };
      component.deleteCourse(course);
      expect(courseServiceSpy.deleteCourse).not.toHaveBeenCalled();
    });
  });
});
