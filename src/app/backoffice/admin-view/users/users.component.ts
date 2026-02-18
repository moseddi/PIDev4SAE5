import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { UserProfileDTO, Role, CreateUserRequest, UpdateUserRequest } from '../../../models/auth.models';
import { RouterModule } from '@angular/router';
@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule,RouterModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit {
  Math = Math;
  users: UserProfileDTO[] = [];
  filteredUsers: UserProfileDTO[] = [];
  selectedUser: UserProfileDTO | null = null;
  
  // Modal visibility
  showUserModal = false;
  showDeleteModal = false;
  showViewModal = false;
  
  // Form data
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
  
  // Filters
  searchTerm = '';
  selectedRole: Role | 'ALL' = 'ALL';
  selectedStatus: boolean | 'ALL' = 'ALL';
  
  // Loading states
  isLoading = false;
  isCreating = false;
  isUpdating = false;
  isDeleting = false;
  errorMessage = '';
  successMessage = '';

  // Validation errors
  validationErrors: any = {};

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  roleOptions = [
    { value: Role.ADMIN, label: 'Admin' },
    { value: Role.TUTOR, label: 'Tutor' },
    { value: Role.STUDENT, label: 'Student' }
  ];

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.isLoading = true;
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load users';
        this.isLoading = false;
        console.error('Error loading users:', error);
      }
    });
  }

  applyFilters() {
    let filtered = [...this.users];

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(term) ||
        user.firstName?.toLowerCase().includes(term) ||
        user.lastName?.toLowerCase().includes(term) ||
        user.phoneNumber?.includes(term)
      );
    }

    if (this.selectedRole !== 'ALL') {
      filtered = filtered.filter(user => user.role === this.selectedRole);
    }

    if (this.selectedStatus !== 'ALL') {
      filtered = filtered.filter(user => user.active === this.selectedStatus);
    }

    this.filteredUsers = filtered;
    this.totalItems = filtered.length;
  }

  get paginatedUsers() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredUsers.slice(start, start + this.itemsPerPage);
  }

  openCreateModal() {
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
  }

  openEditModal(user: UserProfileDTO) {
    this.isEditMode = true;
    // Only store what's needed for edit (role and active status)
    this.userForm = {
      id: user.id,
      role: user.role,
      active: user.active
      // NO other fields - admin can't edit them
    };
    this.validationErrors = {};
    this.showUserModal = true;
  }

  openViewModal(user: UserProfileDTO) {
    this.selectedUser = user;
    this.showViewModal = true;
  }

  openDeleteModal(user: UserProfileDTO) {
    this.selectedUser = user;
    this.showDeleteModal = true;
  }

  saveUser() {
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

    // Email validation (required for new users)
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

    // First Name validation (only for new users)
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

    // Last Name validation (optional but if provided, must be valid)
    if (!this.isEditMode && this.userForm.lastName && this.userForm.lastName.length > 0) {
      const lastNameRegex = /^[A-Za-z]{2,}$/;
      if (!lastNameRegex.test(this.userForm.lastName)) {
        this.validationErrors.lastName = 'Last name must contain only letters and be at least 2 characters';
        isValid = false;
      }
    }

    // Phone validation (optional but if provided, must be valid)
    if (!this.isEditMode && this.userForm.phoneNumber && this.userForm.phoneNumber.length > 0) {
      // Tunisian phone numbers: 2,3,4,5,9 followed by 7 digits
      const phoneRegex = /^[2-9][0-9]{7}$/;
      const cleanedPhone = this.userForm.phoneNumber.replace(/\s/g, '');
      
      if (!phoneRegex.test(cleanedPhone)) {
        this.validationErrors.phoneNumber = 'Please enter a valid phone number (8 digits starting with 2,3,4,5,9)';
        isValid = false;
      }
    }

    // Password validation for new users
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
    this.isCreating = true;
    this.errorMessage = '';
    
    // Close modal immediately
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
      next: (response) => {
        this.successMessage = 'User created successfully';
        this.loadUsers();
        setTimeout(() => this.successMessage = '', 3000);
        this.isCreating = false;
      },
      error: (error) => {
        console.error('Create error:', error);
        this.errorMessage = error.error?.message || 'Failed to create user';
        this.isCreating = false;
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  private updateUser() {
    this.isUpdating = true;
    this.errorMessage = '';
    
    this.closeModal();
    
    this.successMessage = 'Updating user...';
    
    // ✅ ONLY send role and active status for update
    const updateData: UpdateUserRequest = {
      role: this.userForm.role,
      active: this.userForm.active
      // NO firstName, lastName, phoneNumber, etc.
    };
    
    this.userService.updateUser(this.userForm.id, updateData).subscribe({
      next: () => {
        this.successMessage = 'User updated successfully';
        this.loadUsers();
        setTimeout(() => this.successMessage = '', 3000);
        this.isUpdating = false;
      },
      error: (error) => {
        console.error('Update error:', error);
        this.errorMessage = error.error?.message || 'Failed to update user';
        this.isUpdating = false;
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  confirmDelete() {
    if (!this.selectedUser) return;
    
    this.isDeleting = true;
    const userToDelete = this.selectedUser;
    
    this.closeModal();
    
    this.successMessage = 'Deleting user...';
    
    this.userService.deleteUser(userToDelete.id).subscribe({
      next: () => {
        this.successMessage = 'User deleted successfully';
        this.loadUsers();
        setTimeout(() => this.successMessage = '', 3000);
        this.isDeleting = false;
      },
      error: (error) => {
        console.error('Delete error:', error);
        this.errorMessage = 'Failed to delete user';
        this.isDeleting = false;
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  toggleUserStatus(user: UserProfileDTO) {
    const originalStatus = user.active;
    
    user.active = !user.active;
    
    const updateData: UpdateUserRequest = {
      active: user.active
    };
    
    this.userService.updateUser(user.id, updateData).subscribe({
      next: () => {
        this.successMessage = `User ${user.active ? 'activated' : 'deactivated'}`;
        setTimeout(() => this.successMessage = '', 2000);
      },
      error: (error) => {
        console.error('Status update error:', error);
        user.active = originalStatus;
        this.errorMessage = `Failed to ${user.active ? 'activate' : 'deactivate'} user`;
        setTimeout(() => this.errorMessage = '', 3000);
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
    switch(role) {
      case Role.ADMIN: return 'bg-danger';
      case Role.TUTOR: return 'bg-success';
      case Role.STUDENT: return 'bg-info';
      default: return 'bg-secondary';
    }
  }

  getStatusBadgeClass(active: boolean): string {
    return active ? 'bg-success' : 'bg-secondary';
  }
  // Add this method to get initials for avatars
getInitials(firstName: string | undefined, lastName: string | undefined): string {
  const first = firstName ? firstName.charAt(0).toUpperCase() : '';
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return (first + last) || 'U';
}
  
}