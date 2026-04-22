import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UsersComponent } from './users.component';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { UserProfileDTO, Role } from '../../../models/auth.models';
import { of, throwError } from 'rxjs';
import { KeycloakService } from 'keycloak-angular';

describe('UsersComponent', () => {
  let component: UsersComponent;
  let fixture: ComponentFixture<UsersComponent>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockUsers: UserProfileDTO[] = [
    { id: 1, email: 'admin@test.com', firstName: 'Admin', role: Role.ADMIN, active: true, createdAt: '', updatedAt: '' },
    { id: 2, email: 'student@test.com', firstName: 'Student', role: Role.STUDENT, active: true, createdAt: '', updatedAt: '' },
    { id: 3, email: 'tutor@test.com', firstName: 'Tutor', role: Role.TUTOR, active: false, createdAt: '', updatedAt: '' }
  ];

  beforeEach(async () => {
    userServiceSpy = jasmine.createSpyObj('UserService', ['getAllUsers', 'createUser', 'updateUser', 'deleteUser', 'clearCache', 'forceLogout']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getUser', 'getToken', 'isLoggedIn', 'updateUserData', 'refreshToken']);

    userServiceSpy.getAllUsers.and.returnValue(of(mockUsers));
    authServiceSpy.getUser.and.returnValue({ email: 'admin@test.com', role: 'ADMIN' });

    const keycloakSpy = jasmine.createSpyObj('KeycloakService', ['logout', 'updateToken', 'getToken', 'init']);

    await TestBed.configureTestingModule({
      imports: [UsersComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: KeycloakService, useValue: keycloakSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (component['refreshInterval']) {
      clearInterval(component['refreshInterval']);
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init', () => {
    expect(component.users.length).toBe(3);
    expect(component.isLoading).toBeFalse();
  });

  describe('applyFilters', () => {
    it('should filter by search term', () => {
      component.searchTerm = 'admin';
      component.applyFilters();
      expect(component.filteredUsers.length).toBe(1);
    });

    it('should filter by role', () => {
      component.selectedRole = Role.STUDENT;
      component.applyFilters();
      expect(component.filteredUsers.length).toBe(1);
      expect(component.filteredUsers[0].role).toBe(Role.STUDENT);
    });

    it('should filter by active status', () => {
      component.selectedStatus = false;
      component.applyFilters();
      expect(component.filteredUsers.length).toBe(1);
      expect(component.filteredUsers[0].active).toBeFalse();
    });

    it('should return all users when no filter', () => {
      component.applyFilters();
      expect(component.filteredUsers.length).toBe(3);
    });
  });

  describe('getInitials', () => {
    it('should return initials from first and last name', () => {
      expect(component.getInitials('John', 'Doe')).toBe('JD');
    });

    it('should return U when no names', () => {
      expect(component.getInitials(undefined, undefined)).toBe('U');
    });
  });

  describe('getRoleBadgeClass', () => {
    it('should return danger for ADMIN', () => {
      expect(component.getRoleBadgeClass(Role.ADMIN)).toBe('bg-danger');
    });

    it('should return success for TUTOR', () => {
      expect(component.getRoleBadgeClass(Role.TUTOR)).toBe('bg-success');
    });

    it('should return info for STUDENT', () => {
      expect(component.getRoleBadgeClass(Role.STUDENT)).toBe('bg-info');
    });
  });

  describe('getStatusBadgeClass', () => {
    it('should return success for active', () => {
      expect(component.getStatusBadgeClass(true)).toBe('bg-success');
    });

    it('should return secondary for inactive', () => {
      expect(component.getStatusBadgeClass(false)).toBe('bg-secondary');
    });
  });

  describe('formatDate', () => {
    it('should return N/A for undefined date', () => {
      expect(component.formatDate(undefined)).toBe('N/A');
    });

    it('should format a valid date', () => {
      const result = component.formatDate('2026-01-15');
      expect(result).toBeTruthy();
    });
  });

  describe('openCreateModal', () => {
    it('should open modal in create mode', () => {
      component.openCreateModal();
      expect(component.showUserModal).toBeTrue();
      expect(component.isEditMode).toBeFalse();
    });
  });

  describe('openEditModal', () => {
    it('should open modal in edit mode', () => {
      component.openEditModal(mockUsers[0]);
      expect(component.showUserModal).toBeTrue();
      expect(component.isEditMode).toBeTrue();
    });
  });

  describe('closeModal', () => {
    it('should close all modals', () => {
      component.showUserModal = true;
      component.showDeleteModal = true;
      component.closeModal();
      expect(component.showUserModal).toBeFalse();
      expect(component.showDeleteModal).toBeFalse();
    });
  });

  describe('paginatedUsers', () => {
    it('should return first page of users', () => {
      component.filteredUsers = mockUsers;
      component.currentPage = 1;
      component.itemsPerPage = 2;
      expect(component.paginatedUsers.length).toBe(2);
    });
  });
});
