import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  // Form data
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

  constructor(private router: Router) {}

  onSubmit() {
    // Validate passwords match
    if (this.signupData.password !== this.signupData.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // TODO: Call auth service when we create it
    console.log('Signup data:', this.signupData);
    
    // Simulate API call
    setTimeout(() => {
      this.isLoading = false;
      this.signupSuccess = true;
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    }, 2000);
  }

  socialSignup(provider: string) {
    console.log(`Signup with ${provider}`);
    // TODO: Implement OAuth
  }
}