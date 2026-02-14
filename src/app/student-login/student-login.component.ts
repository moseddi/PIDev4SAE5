import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router'; // Added Router
import { FormsModule } from '@angular/forms'; // Added FormsModule
import { CommonModule } from '@angular/common'; // Added CommonModule
import { AuthService } from '../services/auth.service'; // Added AuthService

@Component({
  selector: 'app-student-login',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule], // Added FormsModule and CommonModule
  templateUrl: './student-login.component.html',
  styleUrl: './student-login.component.css'
})
export class StudentLoginComponent {
  // Add this login data object
  loginData = {
    email: '',
    password: ''
  };

  // Add constructor with dependencies
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // Add onSubmit method
  onSubmit() {
    this.authService.login(this.loginData).subscribe({
      next: (response) => {
        if (response.role === 'ADMIN' || response.role === 'TUTOR') {
          this.router.navigate(['/backoffice']);
        } else {
          this.router.navigate(['/']);
        }
      }
    });
  }
}