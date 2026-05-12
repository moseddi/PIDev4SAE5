import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-unblock',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div style="min-height: 100vh; background: linear-gradient(135deg, #0f2121, #1e3a3a); display: flex; align-items: center; justify-content: center; padding: 20px;">
      <div style="background: rgba(0,0,0,0.6); border-radius: 24px; padding: 40px; max-width: 500px; width: 100%; text-align: center;">
        
        <div *ngIf="loading">
          <div class="spinner"></div>
          <p style="color: white; margin-top: 20px;">Processing...</p>
        </div>

        <div *ngIf="success">
          <div style="font-size: 64px;">✅</div>
          <h2 style="color: #28a745; margin-top: 20px;">Account Unblocked!</h2>
          <p style="color: rgba(255,255,255,0.7); margin-top: 10px;">
            The account has been successfully unblocked.
            <strong>The student will receive an email notification.</strong>
          </p>
          <button (click)="goToLogin()" 
                  style="background: #2D5757; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; margin-top: 20px;">
            Go to Login
          </button>
        </div>

        <div *ngIf="error">
          <div style="font-size: 64px;">❌</div>
          <h2 style="color: #dc3545; margin-top: 20px;">Error</h2>
          <p style="color: rgba(255,255,255,0.7); margin-top: 10px;">
            {{ errorMessage }}
          </p>
          <button (click)="goToLogin()" 
                  style="background: #2D5757; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; margin-top: 20px;">
            Go to Login
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255,255,255,0.2);
      border-top: 4px solid #28a745;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class UnblockComponent implements OnInit {
  loading = true;
  success = false;
  error = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    const email = this.route.snapshot.params['email'];
    if (email) {
      // ✅ FIXED: Add responseType: 'text' to handle string response
      this.http.post(`http://localhost:8089/api/users/unblock/${email}`, {}, { responseType: 'text' })
        .subscribe({
          next: (response) => {
            console.log('Unblock response:', response);
            this.loading = false;
            this.success = true;
          },
          error: (err) => {
            console.error('Error:', err);
            // If status is 200, it actually succeeded
            if (err.status === 200) {
              this.success = true;
            } else {
              this.error = true;
              this.errorMessage = err.error?.message || 'Failed to unblock account';
            }
            this.loading = false;
          }
        });
    } else {
      this.loading = false;
      this.error = true;
      this.errorMessage = 'Invalid link';
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}