import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ListeCoursStudentComponent } from './liste-cours-student.component';
import { CourseService, Course } from '../course-list/service/course.service';
import { AuthService } from '../../services/auth.service';
import { of, throwError } from 'rxjs';
import { KeycloakService } from 'keycloak-angular';

describe('ListeCoursStudentComponent', () => {
  let component: ListeCoursStudentComponent;
  let fixture: ComponentFixture<ListeCoursStudentComponent>;
  let courseServiceSpy: jasmine.SpyObj<CourseService>;

  const mockCourses: Course[] = [
    { id: 1, title: 'English Basics', level: 'Beginner', duration: 10, description: 'Intro' },
    { id: 2, title: 'Business English', level: 'Advanced', duration: 20, description: 'Business' },
    { id: 3, title: 'Intermediate', level: 'Intermediate', duration: 15, description: 'Mid' }
  ];

  beforeEach(async () => {
    courseServiceSpy = jasmine.createSpyObj('CourseService', ['getAllCourses']);
    courseServiceSpy.getAllCourses.and.returnValue(of(mockCourses));

    const authSpy = jasmine.createSpyObj('AuthService', ['getUser', 'getToken', 'isLoggedIn']);
    authSpy.getUser.and.returnValue(null);
    const keycloakSpy = jasmine.createSpyObj('KeycloakService', ['logout', 'updateToken', 'getToken', 'init']);

    await TestBed.configureTestingModule({
      imports: [ListeCoursStudentComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: CourseService, useValue: courseServiceSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: KeycloakService, useValue: keycloakSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ListeCoursStudentComponent);
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

  it('should show error notification on load failure', () => {
    courseServiceSpy.getAllCourses.and.returnValue(throwError(() => new Error('Error')));
    component.loadCourses();
    expect(component.notification?.type).toBe('error');
  });

  describe('filteredCourses', () => {
    it('should return all courses with no filter', () => {
      expect(component.filteredCourses.length).toBe(3);
    });

    it('should filter by level', () => {
      component.selectedLevel = 'Beginner';
      expect(component.filteredCourses.length).toBe(1);
    });

    it('should filter by search text', () => {
      component.searchText = 'business';
      expect(component.filteredCourses.length).toBe(1);
    });
  });

  describe('clearFilters', () => {
    it('should reset all filters', () => {
      component.searchText = 'test';
      component.selectedLevel = 'Advanced';
      component.clearFilters();
      expect(component.searchText).toBe('');
      expect(component.selectedLevel).toBe('');
    });
  });
});
