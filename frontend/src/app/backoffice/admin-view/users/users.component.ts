import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { UserProfileDTO, Role, CreateUserRequest, UpdateUserRequest } from '../../../models/auth.models';
import { RouterModule, Router } from '@angular/router';
import { firstValueFrom, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit, OnDestroy {
  Math = Math;
  users: UserProfileDTO[] = [];
  filteredUsers: UserProfileDTO[] = [];
  selectedUser: UserProfileDTO | null = null;

  showUserModal = false;
  showDeleteModal = false;
  showViewModal = false;

  userForm: any = {
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: Role.STUDENT,
    active: true,
    password: ''
  };
  isEditMode = false;

  // ✅ Search and Filter - BIND THESE TO YOUR HTML
  searchTerm = '';
  selectedRole: Role | 'ALL' = 'ALL';
  selectedStatus: boolean | 'ALL' = 'ALL';

  isLoading = false;
  isCreating = false;
  isUpdating = false;
  isDeleting = false;
  errorMessage = '';
  successMessage = '';

  validationErrors: any = {};

  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  private refreshInterval: any = null;
  private isRedirecting = false;
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  roleOptions = [
    { value: Role.ADMIN, label: 'Admin' },
    { value: Role.TUTOR, label: 'Tutor' },
    { value: Role.STUDENT, label: 'Student' }
  ];

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.setupSearchDebounce();
    this.setupAutoRefresh();
  }

  // ✅ Setup search with debounce
  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage = 1;
      this.applyFilters();
      this.cdr.detectChanges();
    });
  }

  private setupAutoRefresh(): void {
    this.refreshInterval = setInterval(() => {
      if (!document.hidden && document.hasFocus() && !this.isRedirecting) {
        console.log('🔄 Auto-refreshing users...');
        this.loadUsers(true);
      }
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private handleSessionExpired(): void {
    if (this.isRedirecting) return;
    this.isRedirecting = true;
    
    this.errorMessage = 'Your session has expired. Redirecting to login...';
    this.isLoading = false;
    this.isCreating = false;
    this.isUpdating = false;
    this.isDeleting = false;
    
    setTimeout(() => {
      localStorage.clear();
      this.router.navigate(['/login']);
    }, 2000);
  }

  loadUsers(forceRefresh: boolean = false) {
    if (this.isRedirecting) return;
    
    this.isLoading = true;
    this.errorMessage = '';

    if (forceRefresh) {
      this.userService.clearCache();
    }

    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.applyFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.isLoading = false;

        if (error.status === 401) {
          this.handleSessionExpired();
        } else if (error.status === 0) {
          this.errorMessage = 'Cannot connect to server. Check if services are running.';
        } else {
          this.errorMessage = error.error?.message || 'Failed to load users. Please try again.';
        }
        this.cdr.detectChanges();
      }
    });
  }

  // ✅ Apply filters - this is called whenever search/filter changes
  applyFilters() {
    let filtered = [...this.users];

    // Search filter
    if (this.searchTerm && this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(user =>
        user.email.toLowerCase().includes(term) ||
        user.firstName?.toLowerCase().includes(term) ||
        user.lastName?.toLowerCase().includes(term) ||
        user.phoneNumber?.includes(term)
      );
    }

    // Role filter
    if (this.selectedRole !== 'ALL') {
      filtered = filtered.filter(user => user.role === this.selectedRole);
    }

    // Status filter
    if (this.selectedStatus !== 'ALL') {
      filtered = filtered.filter(user => user.active === this.selectedStatus);
    }

    this.filteredUsers = filtered;
    this.totalItems = filtered.length;
    this.cdr.detectChanges();
  }

  // ✅ Call this from your HTML search input
  onSearchChange(term: string): void {
    this.searchSubject.next(term);
  }

  // ✅ Call this from your HTML role select
  onRoleChange(role: Role | 'ALL'): void {
    this.selectedRole = role;
    this.currentPage = 1;
    this.applyFilters();
    this.cdr.detectChanges();
  }

  // ✅ Call this from your HTML status select
  onStatusChange(status: boolean | 'ALL'): void {
    this.selectedStatus = status;
    this.currentPage = 1;
    this.applyFilters();
    this.cdr.detectChanges();
  }

  get paginatedUsers() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredUsers.slice(start, start + this.itemsPerPage);
  }

  openCreateModal() {
    if (this.isRedirecting) return;
    this.isEditMode = false;
    this.userForm = {
      email: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      role: Role.STUDENT,
      active: true,
      password: ''
    };
    this.validationErrors = {};
    this.showUserModal = true;
    this.cdr.detectChanges();
  }

  openEditModal(user: UserProfileDTO) {
    if (this.isRedirecting) return;
    this.isEditMode = true;
    this.userForm = {
      id: user.id,
      email: user.email,
      role: user.role,
      active: user.active
    };
    this.validationErrors = {};
    this.showUserModal = true;
    this.cdr.detectChanges();
  }

  openViewModal(user: UserProfileDTO) {
    if (this.isRedirecting) return;
    this.selectedUser = user;
    this.showViewModal = true;
    this.cdr.detectChanges();
  }

  openDeleteModal(user: UserProfileDTO) {
    if (this.isRedirecting) return;
    this.selectedUser = user;
    this.showDeleteModal = true;
    this.cdr.detectChanges();
  }

  saveUser() {
    if (this.isRedirecting) return;
    this.validationErrors = {};
    if (!this.validateForm()) return;

    if (this.isEditMode && this.userForm.id) {
      this.updateUser();
    } else {
      this.createUser();
    }
  }

  private validateForm(): boolean {
    let isValid = true;
    this.validationErrors = {};

    if (!this.isEditMode) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!this.userForm.email) {
        this.validationErrors.email = 'Email is required';
        isValid = false;
      } else if (!emailRegex.test(this.userForm.email)) {
        this.validationErrors.email = 'Please enter a valid email address';
        isValid = false;
      }
    }

    if (!this.isEditMode) {
      const nameRegex = /^[A-Za-z]{3,}$/;
      if (!this.userForm.firstName) {
        this.validationErrors.firstName = 'First name is required';
        isValid = false;
      } else if (!nameRegex.test(this.userForm.firstName)) {
        this.validationErrors.firstName = 'First name must contain only letters and be at least 3 characters';
        isValid = false;
      }
    }

    if (!this.isEditMode && this.userForm.lastName && this.userForm.lastName.length > 0) {
      const lastNameRegex = /^[A-Za-z]{2,}$/;
      if (!lastNameRegex.test(this.userForm.lastName)) {
        this.validationErrors.lastName = 'Last name must contain only letters and be at least 2 characters';
        isValid = false;
      }
    }

    if (!this.isEditMode && this.userForm.phoneNumber && this.userForm.phoneNumber.length > 0) {
      const phoneRegex = /^[2-9][0-9]{7}$/;
      const cleanedPhone = this.userForm.phoneNumber.replace(/\s/g, '');
      if (!phoneRegex.test(cleanedPhone)) {
        this.validationErrors.phoneNumber = 'Please enter a valid phone number (8 digits starting with 2,3,4,5,9)';
        isValid = false;
      }
    }

    if (!this.isEditMode) {
      if (!this.userForm.password) {
        this.validationErrors.password = 'Password is required';
        isValid = false;
      } else if (this.userForm.password.length < 8) {
        this.validationErrors.password = 'Password must be at least 8 characters';
        isValid = false;
      }
    }

    return isValid;
  }

  private createUser() {
    if (this.isRedirecting) return;
    
    this.isCreating = true;
    this.errorMessage = '';
    this.closeModal();

    const createData: CreateUserRequest = {
      email: this.userForm.email,
      firstName: this.userForm.firstName,
      lastName: this.userForm.lastName || '',
      phoneNumber: this.userForm.phoneNumber || '',
      role: this.userForm.role,
      password: this.userForm.password,
      createdBy: this.authService.getUser()?.email || 'admin'
    };

    this.successMessage = 'Creating user...';

    this.userService.createUser(createData).subscribe({
      next: () => {
        this.successMessage = 'User created successfully';
        this.loadUsers(true);
        setTimeout(() => this.successMessage = '', 3000);
        this.isCreating = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Create error:', error);
        this.isCreating = false;
        
        if (error.status === 401) {
          this.handleSessionExpired();
        } else {
          this.errorMessage = error.error?.message || 'Failed to create user';
          setTimeout(() => this.errorMessage = '', 5000);
        }
        this.cdr.detectChanges();
      }
    });
  }

  private updateUser() {
    if (this.isRedirecting) return;
    
    this.isUpdating = true;
    this.errorMessage = '';
    this.closeModal();
    this.successMessage = 'Updating user...';

    const updateData: UpdateUserRequest = {
      role: this.userForm.role,
      active: this.userForm.active
    };

    this.userService.updateUser(this.userForm.id, updateData).subscribe({
      next: async (updatedUser) => {
        this.successMessage = 'User updated successfully';

        const currentUser = this.authService.getUser();

        if (currentUser && currentUser.email === this.userForm.email) {
          this.successMessage = 'Your role has been updated. Refreshing your session...';

          try {
            const updatedUserData = { ...currentUser, role: this.userForm.role };
            this.authService.updateUserData(updatedUserData);

            const refreshed = await this.authService.refreshToken();

            if (refreshed) {
              this.successMessage = `Role updated to ${this.userForm.role}. Refreshing page...`;
              setTimeout(() => window.location.reload(), 1500);
            } else {
              this.successMessage = 'Please refresh the page to see changes.';
              setTimeout(() => window.location.reload(), 1500);
            }
          } catch (error) {
            console.error('Error during refresh:', error);
            setTimeout(() => window.location.reload(), 1500);
          }
        } else {
          try {
            await firstValueFrom(this.userService.forceLogout(this.userForm.email));
            this.successMessage = 'User updated and logged out. They must login again to see changes.';
          } catch (logoutError) {
            console.warn('Logout trigger failed:', logoutError);
          }
        }

        this.loadUsers(true);
        setTimeout(() => this.successMessage = '', 5000);
        this.isUpdating = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Update error:', error);
        this.isUpdating = false;
        
        if (error.status === 401) {
          this.handleSessionExpired();
        } else {
          this.errorMessage = error.error?.message || 'Failed to update user';
          setTimeout(() => this.errorMessage = '', 5000);
        }
        this.cdr.detectChanges();
      }
    });
  }

  confirmDelete() {
    if (this.isRedirecting) return;
    if (!this.selectedUser) return;

    this.isDeleting = true;
    const userToDelete = this.selectedUser;
    this.closeModal();
    this.successMessage = 'Deleting user...';

    this.userService.deleteUser(userToDelete.id).subscribe({
      next: () => {
        this.successMessage = 'User deleted successfully';
        this.loadUsers(true);
        setTimeout(() => this.successMessage = '', 3000);
        this.isDeleting = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Delete error:', error);
        this.isDeleting = false;
        
        if (error.status === 401) {
          this.handleSessionExpired();
        } else {
          this.errorMessage = 'Failed to delete user';
          setTimeout(() => this.errorMessage = '', 5000);
        }
        this.cdr.detectChanges();
      }
    });
  }

  toggleUserStatus(user: UserProfileDTO) {
    if (this.isRedirecting) return;
    
    const originalStatus = user.active;
    user.active = !user.active;

    const updateData: UpdateUserRequest = { active: user.active };

    this.userService.updateUser(user.id, updateData).subscribe({
      next: () => {
        this.successMessage = `User ${user.active ? 'activated' : 'deactivated'}`;
        setTimeout(() => this.successMessage = '', 2000);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Status update error:', error);
        user.active = originalStatus;
        
        if (error.status === 401) {
          this.handleSessionExpired();
        } else {
          this.errorMessage = `Failed to ${user.active ? 'activate' : 'deactivate'} user`;
          setTimeout(() => this.errorMessage = '', 3000);
        }
        this.cdr.detectChanges();
      }
    });
  }

  closeModal() {
    this.showUserModal = false;
    this.showDeleteModal = false;
    this.showViewModal = false;
    this.selectedUser = null;
    this.errorMessage = '';
    this.validationErrors = {};
    this.cdr.detectChanges();
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getRoleBadgeClass(role: Role): string {
    switch (role) {
      case Role.ADMIN: return 'bg-danger';
      case Role.TUTOR: return 'bg-success';
      case Role.STUDENT: return 'bg-info';
      default: return 'bg-secondary';
    }
  }

  getStatusBadgeClass(active: boolean): string {
    return active ? 'bg-success' : 'bg-secondary';
  }

  getInitials(firstName: string | undefined, lastName: string | undefined): string {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return (first + last) || 'U';
  }
}