import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';  // ← AJOUTE CET IMPORT

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  newPassword = '';
  confirmPassword = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService  // ← REMPLACE http PAR authService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (!this.token) {
        this.errorMessage = 'Invalid reset link';
      }
    });
  }

  onSubmit() {
    if (!this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'All fields are required';
      return;
    }

    if (this.newPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // ✅ UTILISE authService (qui appelle le gateway sur 8089)
    this.authService.resetPassword({
      token: this.token,
      newPassword: this.newPassword,
      confirmPassword: this.confirmPassword
    }).subscribe({
      next: (response: any) => {
        this.successMessage = '✅ Password reset successfully!';
        this.isLoading = false;
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'An error occurred';
        this.isLoading = false;
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}