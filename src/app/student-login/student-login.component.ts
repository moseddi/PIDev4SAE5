import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-student-login',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './student-login.component.html',
  styleUrls: ['./student-login.component.css']
})
export class StudentLoginComponent {
  loginData = {
    email: '',
    password: ''
  };
  
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    if (!this.loginData.email || !this.loginData.password) {
      this.errorMessage = 'Email and password are required';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.loginData).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.role === 'ADMIN' || response.role === 'TUTOR') {
          this.router.navigate(['/backoffice']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Invalid email or password';
      }
    });
  }

  socialLogin(provider: string) {
    console.log(`Login with ${provider}`);
    this.errorMessage = `${provider} login coming soon!`;
  }
}