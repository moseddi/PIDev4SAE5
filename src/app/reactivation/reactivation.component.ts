import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-reactivation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div style="min-height: 100vh; background: linear-gradient(135deg, #0f2121, #1e3a3a); display: flex; align-items: center; justify-content: center; padding: 20px;">
      <div style="background: rgba(0,0,0,0.6); border-radius: 24px; padding: 40px; max-width: 500px; width: 100%; backdrop-filter: blur(10px);">
        
        <div *ngIf="step === 'validating'">
          <h2 style="color: white; text-align: center;">🔐 Validating...</h2>
          <div style="text-align: center; margin-top: 20px;">
            <div class="spinner"></div>
            <p style="color: rgba(255,255,255,0.7);">Please wait...</p>
          </div>
        </div>

        <div *ngIf="step === 'invalid'">
          <h2 style="color: #ffc107; text-align: center;">⚠️ Invalid or Expired Link</h2>
          <p style="color: rgba(255,255,255,0.7); text-align: center; margin-top: 20px;">
            This reactivation link is invalid or has expired.
          </p>
          <button (click)="goToLogin()" style="background: #2D5757; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; width: 100%; margin-top: 20px;">
            Go to Login
          </button>
        </div>

        <div *ngIf="step === 'form'">
          <h2 style="color: white; text-align: center;">📝 Account Reactivation</h2>
          <p style="color: rgba(255,255,255,0.7); text-align: center; margin-bottom: 30px;">
            Please confirm your identity to reactivate your account
          </p>

          <div style="margin-bottom: 20px;">
            <label style="color: white; display: block; margin-bottom: 8px;">Email</label>
            <input type="email" [(ngModel)]="email" readonly
                   style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #2D5757; background: rgba(0,0,0,0.3); color: white;">
          </div>

          <div style="margin-bottom: 20px;">
            <label style="color: white; display: block; margin-bottom: 8px;">Confirm your identity</label>
            <textarea [(ngModel)]="reason" rows="4"
                      placeholder="Explain why this was you (e.g., I was traveling, I use VPN, etc.)"
                      style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #2D5757; background: rgba(0,0,0,0.3); color: white;"></textarea>
          </div>

          <div style="margin-bottom: 20px;">
            <label style="display: flex; align-items: center; gap: 10px; color: white; cursor: pointer;">
              <input type="checkbox" [(ngModel)]="confirmation" style="width: 20px; height: 20px;">
              I confirm that I am the owner of this account and the suspicious activity was me
            </label>
          </div>

          <button (click)="submitRequest()" 
                  [disabled]="!confirmation || !reason"
                  style="background: #28a745; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; width: 100%;">
            Submit Reactivation Request
          </button>
        </div>

        <div *ngIf="step === 'submitted'">
          <h2 style="color: #28a745; text-align: center;">✅ Request Submitted</h2>
          <p style="color: rgba(255,255,255,0.7); text-align: center; margin-top: 20px;">
            Your reactivation request has been sent to the admin. You will receive an email once your account is reactivated.
          </p>
          <button (click)="goToLogin()" style="background: #2D5757; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; width: 100%; margin-top: 20px;">
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
export class ReactivationComponent implements OnInit {
  step: string = 'validating';
  token: string = '';
  email: string = '';
  reason: string = '';
  confirmation: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'] || '';
    this.email = this.route.snapshot.queryParams['email'] || '';

    console.log('Token:', this.token);

    if (!this.token) {
      this.step = 'invalid';
      return;
    }

    this.http.get(`http://localhost:8089/api/users/reactivate/${this.token}`)
      .subscribe({
        next: (res: any) => {
          console.log('Validation response:', res);
          if (res.valid) {
            this.email = res.email || this.email;
            this.step = 'form';
          } else {
            this.step = 'invalid';
          }
        },
        error: (err) => {
          console.error('Validation error:', err);
          this.step = 'invalid';
        }
      });
  }

  submitRequest(): void {
    if (!this.confirmation || !this.reason) {
      alert('Please fill all fields and confirm');
      return;
    }

    console.log('Submitting request for:', this.email);

    // ✅ FIXED: Add responseType: 'text' to handle string response
    this.http.post('http://localhost:8089/api/users/reactivate-request', {
      email: this.email,
      reason: this.reason,
      confirmation: this.confirmation ? 'Confirmed' : 'Not confirmed'
    }, { responseType: 'text' }).subscribe({
      next: (response) => {
        console.log('Success:', response);
        this.step = 'submitted';
      },
      error: (err) => {
        console.error('Error details:', err);
        // If status is 200, it actually succeeded
        if (err.status === 200 || err.status === 201) {
          console.log('Request actually succeeded despite error');
          this.step = 'submitted';
        } else {
          alert('Failed to submit request. Please try again.');
        }
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}