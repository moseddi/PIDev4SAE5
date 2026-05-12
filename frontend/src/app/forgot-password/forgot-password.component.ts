import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  email = '';
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  isSubmitted = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    // Validation
    if (!this.email) {
      this.errorMessage = 'Email is required';
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.forgotPassword(this.email).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.isSubmitted = true;
        this.successMessage = response.message;
        console.log('✅ Forgot password success:', response);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('❌ Forgot password error:', error);
        
        // Pour des raisons de sécurité, on affiche un message générique
        this.isSubmitted = true;
        this.successMessage = 'If your email exists in our system, you will receive a password reset link shortly.';
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}