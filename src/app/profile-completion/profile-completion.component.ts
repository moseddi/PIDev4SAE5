import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { COUNTRIES } from './countries';

@Component({
  selector: 'app-profile-completion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-completion.component.html',
  styleUrls: ['./profile-completion.component.css']
})
export class ProfileCompletionComponent implements OnInit {
  user: any = {};
  isEditing = false;
  countries = COUNTRIES;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  // Track touched fields
  firstNameTouched = false;
  lastNameTouched = false;
  phoneNumberTouched = false;
  dateOfBirthTouched = false;
  addressTouched = false;
  cityTouched = false;

  editData = {
    firstName: '',
    lastName: '',
    phoneNumber: '',
    dateOfBirth: '',
    address: '',
    city: '',
    country: ''
  };

  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.loadUserData();
  }

  // ========== VALIDATION METHODS ==========
  
  validateFirstName(): string | null {
    if (!this.firstNameTouched) return null;
    if (!this.editData.firstName) return 'First name is required';
    
    if (this.editData.firstName.length < 3) {
      return 'Must be at least 3 characters';
    }
    
    if (/\d/.test(this.editData.firstName)) {
      return 'Cannot contain numbers';
    }
    
    // Allow hyphens and apostrophes for names like Jean-Pierre or O'Connor
    if (/[!@#$%^&*(),.?":{}|<>=+]/.test(this.editData.firstName.replace(/['-]/g, ''))) {
      return 'Contains invalid characters';
    }
    
    return null;
  }

  validateLastName(): string | null {
    if (!this.lastNameTouched || !this.editData.lastName) return null;
    
    if (this.editData.lastName.length < 3) {
      return 'Must be at least 3 characters';
    }
    
    if (/\d/.test(this.editData.lastName)) {
      return 'Cannot contain numbers';
    }
    
    if (/[!@#$%^&*(),.?":{}|<>=+]/.test(this.editData.lastName.replace(/['-]/g, ''))) {
      return 'Contains invalid characters';
    }
    
    return null;
  }

  validatePhoneNumber(): string | null {
    if (!this.phoneNumberTouched || !this.editData.phoneNumber) return null;
    
    // Remove common separators for validation
    const cleanPhone = this.editData.phoneNumber.replace(/[\s\-+]/g, '');
    
    if (!/^\d{8,}$/.test(cleanPhone)) {
      return 'Phone must be at least 8 digits';
    }
    
    return null;
  }

  validateDateOfBirth(): string | null {
    if (!this.dateOfBirthTouched || !this.editData.dateOfBirth) return null;
    
    const selectedDate = new Date(this.editData.dateOfBirth);
    const today = new Date();
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(today.getFullYear() - 18);
    
    if (selectedDate > today) {
      return 'Date cannot be in the future';
    }
    
    // Optional: Check if user is at least 18 (for adult content)
    // if (selectedDate > eighteenYearsAgo) {
    //   return 'You must be at least 18 years old';
    // }
    
    return null;
  }

  validateAddress(): string | null {
    if (!this.addressTouched || !this.editData.address) return null;
    
    if (this.editData.address.length < 5) {
      return 'Address must be at least 5 characters';
    }
    
    return null;
  }

  validateCity(): string | null {
    if (!this.cityTouched || !this.editData.city) return null;
    
    if (this.editData.city.length < 2) {
      return 'City must be at least 2 characters';
    }
    
    if (/\d/.test(this.editData.city)) {
      return 'City cannot contain numbers';
    }
    
    return null;
  }

  // ========== FIELD HANDLERS ==========
  
  onFirstNameBlur() {
    this.firstNameTouched = true;
  }

  onLastNameBlur() {
    this.lastNameTouched = true;
  }

  onPhoneNumberBlur() {
    this.phoneNumberTouched = true;
  }

  onDateOfBirthBlur() {
    this.dateOfBirthTouched = true;
  }

  onAddressBlur() {
    this.addressTouched = true;
  }

  onCityBlur() {
    this.cityTouched = true;
  }

  // ========== FORM VALIDATION ==========
  
  isFormValid(): boolean {
    // Only check touched fields that have values
    if (this.firstNameTouched && this.validateFirstName()) return false;
    if (this.lastNameTouched && this.editData.lastName && this.validateLastName()) return false;
    if (this.phoneNumberTouched && this.editData.phoneNumber && this.validatePhoneNumber()) return false;
    if (this.dateOfBirthTouched && this.editData.dateOfBirth && this.validateDateOfBirth()) return false;
    if (this.addressTouched && this.editData.address && this.validateAddress()) return false;
    if (this.cityTouched && this.editData.city && this.validateCity()) return false;
    
    return true;
  }

  // Helper method to format date from backend to YYYY-MM-DD
  private formatDateForInput(dateValue: any): string {
    if (!dateValue) return '';
    
    try {
      if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}/)) {
        return dateValue.split('T')[0];
      }
      
      if (Array.isArray(dateValue) && dateValue.length >= 3) {
        const year = dateValue[0];
        const month = String(dateValue[1]).padStart(2, '0');
        const day = String(dateValue[2]).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      return '';
    } catch (e) {
      console.error('Error formatting date:', e);
      return '';
    }
  }

  loadUserData() {
    const authUser = this.authService.getUser();
    console.log('User from auth:', authUser);
    
    if (authUser?.email) {
      this.userService.getUserByEmail(authUser.email).subscribe({
        next: (profile) => {
          console.log('Full profile from DB:', profile);
          
          this.user = { 
            ...authUser, 
            ...profile,
            id: profile.id || authUser.userId
          };
          
          const formattedDate = this.formatDateForInput(profile.dateOfBirth);
          
          this.editData = {
            firstName: profile.firstName || '',
            lastName: profile.lastName || '',
            phoneNumber: profile.phoneNumber || '',
            dateOfBirth: formattedDate,
            address: profile.address || '',
            city: profile.city || '',
            country: profile.country || ''
          };
          
          this.authService.updateUserData(this.user);
        },
        error: (err) => {
          console.log('Error loading profile:', err);
          this.resetEditData();
        }
      });
    } else {
      this.resetEditData();
    }
  }

  resetEditData() {
    this.editData = {
      firstName: '',
      lastName: '',
      phoneNumber: '',
      dateOfBirth: '',
      address: '',
      city: '',
      country: ''
    };
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    this.errorMessage = '';
    this.successMessage = '';
    
    // Reset touched states when opening edit
    this.firstNameTouched = false;
    this.lastNameTouched = false;
    this.phoneNumberTouched = false;
    this.dateOfBirthTouched = false;
    this.addressTouched = false;
    this.cityTouched = false;
    
    if (this.isEditing && this.user) {
      const formattedDate = this.formatDateForInput(this.user.dateOfBirth);
      
      this.editData = {
        firstName: this.user.firstName || '',
        lastName: this.user.lastName || '',
        phoneNumber: this.user.phoneNumber || '',
        dateOfBirth: formattedDate,
        address: this.user.address || '',
        city: this.user.city || '',
        country: this.user.country || ''
      };
    }
  }

  saveProfile() {
    // Mark all fields as touched to show validation
    this.firstNameTouched = true;
    if (this.editData.lastName) this.lastNameTouched = true;
    if (this.editData.phoneNumber) this.phoneNumberTouched = true;
    if (this.editData.dateOfBirth) this.dateOfBirthTouched = true;
    if (this.editData.address) this.addressTouched = true;
    if (this.editData.city) this.cityTouched = true;
    
    // Check required field
    if (!this.editData.firstName) {
      this.errorMessage = 'First name is required';
      return;
    }
    
    // Run all validations
    const firstNameError = this.validateFirstName();
    if (firstNameError) {
      this.errorMessage = firstNameError;
      return;
    }
    
    const lastNameError = this.validateLastName();
    if (lastNameError) {
      this.errorMessage = lastNameError;
      return;
    }
    
    const phoneError = this.validatePhoneNumber();
    if (phoneError) {
      this.errorMessage = phoneError;
      return;
    }
    
    const dobError = this.validateDateOfBirth();
    if (dobError) {
      this.errorMessage = dobError;
      return;
    }
    
    const addressError = this.validateAddress();
    if (addressError) {
      this.errorMessage = addressError;
      return;
    }
    
    const cityError = this.validateCity();
    if (cityError) {
      this.errorMessage = cityError;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    let formattedDateForBackend = null;
    if (this.editData.dateOfBirth) {
      formattedDateForBackend = this.editData.dateOfBirth + 'T00:00:00';
    }

    const updateData = {
      firstName: this.editData.firstName,
      lastName: this.editData.lastName || '',
      phoneNumber: this.editData.phoneNumber || '',
      dateOfBirth: formattedDateForBackend,
      address: this.editData.address || '',
      city: this.editData.city || '',
      country: this.editData.country || ''
    };

    this.userService.updateUser(this.user.id, updateData).subscribe({
      next: (response) => {
        console.log('Update response:', response);
        this.handleSuccess(response);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Failed to update profile';
        console.error('Update error:', error);
      }
    });
  }

  private handleSuccess(updatedProfile: any) {
    const formattedDate = this.formatDateForInput(this.editData.dateOfBirth || updatedProfile.dateOfBirth);
    
    this.user = { 
      ...this.user, 
      ...updatedProfile,
      firstName: this.editData.firstName,
      lastName: this.editData.lastName,
      phoneNumber: this.editData.phoneNumber,
      address: this.editData.address,
      city: this.editData.city,
      country: this.editData.country
    };
    
    this.editData = {
      firstName: this.editData.firstName,
      lastName: this.editData.lastName,
      phoneNumber: this.editData.phoneNumber,
      dateOfBirth: formattedDate,
      address: this.editData.address,
      city: this.editData.city,
      country: this.editData.country
    };
    
    this.authService.updateUserData(this.user);
    
    this.isLoading = false;
    this.isEditing = false;
    this.successMessage = 'Profile saved successfully!';
    
    setTimeout(() => this.successMessage = '', 3000);
  }

  getInitials(): string {
    if (this.user?.firstName) {
      return this.user.firstName.charAt(0).toUpperCase();
    }
    return this.user?.email?.charAt(0).toUpperCase() || 'U';
  }
}