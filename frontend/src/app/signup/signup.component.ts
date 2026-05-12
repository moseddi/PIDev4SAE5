import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  signupData = {
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  };

  acceptTerms = false;
  isLoading = false;
  signupSuccess = false;
  errorMessage = '';

  firstNameTouched = false;
  lastNameTouched = false;
  phoneNumberTouched = false;
  emailTouched = false;
  emailExists = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  validateEmail(): string | null {
    if (!this.emailTouched || !this.signupData.email) return null;
    
    const email = this.signupData.email.trim();
    const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    
    if (email.includes('..') || email.includes('@.') || email.includes('.@') || email.includes('--')) {
      return 'Email contains invalid characters';
    }
    
    const domain = email.split('@')[1].toLowerCase();
    const validTLDs = [
      '.com', '.org', '.net', '.edu', '.gov', '.mil',
      '.tn', '.fr', '.de', '.uk', '.ca', '.au', '.jp', '.cn', '.in', '.br', '.ma', '.dz', '.ly', '.eg',
      '.com.tn', '.com.fr', '.co.uk', '.com.au', '.com.ma', '.com.dz',
      '.info', '.biz', '.io', '.ai', '.app', '.dev', '.tech', '.me'
    ];
    
    const hasValidTLD = validTLDs.some(tld => domain.endsWith(tld));
    
    if (!hasValidTLD) {
      return 'Email domain does not appear valid';
    }
    
    const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com'];
    
    for (const commonDomain of commonDomains) {
      if (domain.includes(commonDomain) && domain !== commonDomain) {
        return `Did you mean @${commonDomain}?`;
      }
    }
    
    return null;
  }

  checkEmailExists() {
    if (!this.signupData.email || this.validateEmail()) return;
    
    this.userService.getUserByEmail(this.signupData.email).subscribe({
      next: () => {
        this.emailExists = true;
        this.errorMessage = 'This email is already registered';
      },
      error: () => {
        this.emailExists = false;
        this.errorMessage = '';
      }
    });
  }

  get hasMinLength(): boolean {
    return this.signupData.password.length >= 8;
  }

  get hasUpperCase(): boolean {
    return /[A-Z]/.test(this.signupData.password);
  }

  get hasLowerCase(): boolean {
    return /[a-z]/.test(this.signupData.password);
  }

  get hasNumber(): boolean {
    return /[0-9]/.test(this.signupData.password);
  }

  get hasSpecialChar(): boolean {
    return /[!@#$%^&*(),.?":{}|<>]/.test(this.signupData.password);
  }

  getPasswordStrengthClass(): string {
    const strength = this.calculatePasswordStrength();
    if (strength === 0) return '';
    if (strength <= 2) return 'weak';
    if (strength <= 4) return 'medium';
    return 'strong';
  }

  getPasswordStrengthText(): string {
    const strength = this.calculatePasswordStrength();
    if (strength === 0) return '';
    if (strength <= 2) return 'Weak password';
    if (strength <= 4) return 'Medium password';
    return 'Strong password';
  }

  private calculatePasswordStrength(): number {
    let strength = 0;
    if (this.hasMinLength) strength++;
    if (this.hasUpperCase) strength++;
    if (this.hasLowerCase) strength++;
    if (this.hasNumber) strength++;
    if (this.hasSpecialChar) strength++;
    return strength;
  }

  validateFirstName(): string | null {
    if (!this.firstNameTouched || !this.signupData.firstName) return null;
    
    if (this.signupData.firstName.length < 3) {
      return 'Must be at least 3 characters';
    }
    
    if (/\d/.test(this.signupData.firstName)) {
      return 'First name cannot contain numbers';
    }
    
    if (/[!@#$%^&*(),.?":{}|<>=+]/.test(this.signupData.firstName.replace(/['-]/g, ''))) {
      return 'First name contains invalid characters';
    }
    
    return null;
  }

  validateLastName(): string | null {
    if (!this.lastNameTouched || !this.signupData.lastName) return null;
    
    if (this.signupData.lastName.length < 3) {
      return 'Must be at least 3 characters';
    }
    
    if (/\d/.test(this.signupData.lastName)) {
      return 'Last name cannot contain numbers';
    }
    
    if (/[!@#$%^&*(),.?":{}|<>=+]/.test(this.signupData.lastName.replace(/['-]/g, ''))) {
      return 'Last name contains invalid characters';
    }
    
    return null;
  }

  validatePhoneNumber(): string | null {
    if (!this.phoneNumberTouched || !this.signupData.phoneNumber) return null;
    const phoneRegex = /^[0-9+\-\s]{8,}$/;
    return !phoneRegex.test(this.signupData.phoneNumber) ? 'Invalid phone number format' : null;
  }

  onEmailBlur() {
    this.emailTouched = true;
    this.checkEmailExists();
  }

  onFirstNameBlur() {
    this.firstNameTouched = true;
  }

  onLastNameBlur() {
    this.lastNameTouched = true;
  }

  onPhoneNumberBlur() {
    this.phoneNumberTouched = true;
  }

  onSubmit() {
    if (!this.signupData.email) {
      this.errorMessage = 'Email is required';
      return;
    }

    const emailError = this.validateEmail();
    if (emailError) {
      this.errorMessage = emailError;
      return;
    }

    if (this.emailExists) {
      this.errorMessage = 'This email is already registered';
      return;
    }

    if (this.signupData.password !== this.signupData.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    if (!this.acceptTerms) {
      this.errorMessage = 'You must accept the terms';
      return;
    }

    if (this.signupData.firstName) {
      const firstNameError = this.validateFirstName();
      if (firstNameError) {
        this.errorMessage = firstNameError;
        return;
      }
    }

    if (this.signupData.lastName) {
      const lastNameError = this.validateLastName();
      if (lastNameError) {
        this.errorMessage = lastNameError;
        return;
      }
    }

    if (this.signupData.phoneNumber) {
      const phoneError = this.validatePhoneNumber();
      if (phoneError) {
        this.errorMessage = phoneError;
        return;
      }
    }

    this.isLoading = true;
    this.errorMessage = '';

    const registerData = {
      email: this.signupData.email,
      password: this.signupData.password,
      confirmPassword: this.signupData.confirmPassword,
      firstName: this.signupData.firstName,
      lastName: this.signupData.lastName
    };

    this.authService.register(registerData).subscribe({
      next: (authResponse: any) => {
        console.log('Auth registration success:', authResponse);
        
        // 🔥 CRITICAL FIX: Store token immediately
        if (authResponse.token) {
          localStorage.setItem('auth_token', authResponse.token);
        }
        
        // Store user data
        localStorage.setItem('user_data', JSON.stringify(authResponse));
        
        setTimeout(() => {
          // Now try to get profile with token
          this.userService.getUserByEmail(this.signupData.email).subscribe({
            next: (profile: any) => {
              console.log('Found auto-created profile:', profile);
              
              const updateData = {
                firstName: this.signupData.firstName || '',
                lastName: this.signupData.lastName || '',
                phoneNumber: this.signupData.phoneNumber || ''
              };
              
              // Only update if we have data to update
              if (updateData.firstName || updateData.lastName || updateData.phoneNumber) {
                this.userService.updateUser(profile.id, updateData).subscribe({
                  next: (updatedProfile: any) => {
                    console.log('Profile updated with signup data:', updatedProfile);
                    
                    const userData = {
                      ...authResponse,
                      ...updatedProfile,
                      id: updatedProfile.id || authResponse.userId
                    };
                    localStorage.setItem('user_data', JSON.stringify(userData));
                    
                    this.isLoading = false;
                    this.signupSuccess = true;
                    
                    setTimeout(() => {
                      this.router.navigate(['/login']);
                    }, 2000);
                  },
                  error: (updateError: any) => {
                    console.error('Error updating profile:', updateError);
                    this.handlePartialSuccess(authResponse);
                  }
                });
              } else {
                // No data to update, just success
                this.handlePartialSuccess(authResponse);
              }
            },
            error: (profileError: any) => {
              console.error('Could not find auto-created profile:', profileError);
              this.createNewProfile(authResponse);
            }
          });
        }, 1500); // Wait 1.5 seconds for token to be ready
      },
      error: (authError: any) => {
        this.isLoading = false;
        this.errorMessage = authError.error?.message || 'Registration failed';
      }
    });
  }

  private handlePartialSuccess(authResponse: any) {
    localStorage.setItem('user_data', JSON.stringify(authResponse));
    this.isLoading = false;
    this.signupSuccess = true;
    
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 2000);
  }

  private createNewProfile(authResponse: any) {
    console.log('Creating new profile manually');
    
    // Make sure token is still there
    if (!localStorage.getItem('auth_token') && authResponse.token) {
      localStorage.setItem('auth_token', authResponse.token);
    }
    
    const profileData = {
      email: this.signupData.email,
      firstName: this.signupData.firstName || '',
      lastName: this.signupData.lastName || '',
      phoneNumber: this.signupData.phoneNumber || '',
      role: 'STUDENT'
    };

    this.userService.createUser(profileData).subscribe({
      next: (profileResponse: any) => {
        console.log('Profile created manually:', profileResponse);
        
        const userData = {
          ...authResponse,
          ...profileResponse,
          id: profileResponse.id || authResponse.userId
        };
        localStorage.setItem('user_data', JSON.stringify(userData));
        
        this.isLoading = false;
        this.signupSuccess = true;
        
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (createError: any) => {
        console.error('Even manual creation failed:', createError);
        this.handlePartialSuccess(authResponse);
      }
    });
  }

  socialSignup(provider: string) {
    console.log(`Signup with ${provider}`);
    this.errorMessage = `${provider} signup coming soon!`;
  }
}