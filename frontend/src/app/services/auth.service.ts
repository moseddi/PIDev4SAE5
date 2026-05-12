import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { ForgotPasswordRequest, ForgotPasswordResponse } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/auth';
  private tokenKey = 'auth_token';
  private userKey = 'user_data';

  constructor(
    private http: HttpClient,
    private router: Router,
    private keycloak: KeycloakService
  ) {}

  register(userData: any): Observable<any> {
    console.log('Register URL:', `${this.apiUrl}/register`);
    console.log('Register data:', userData);
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  login(credentials: any): Observable<any> {
    console.log('Login called with credentials:', credentials.email);
    
    return new Observable(observer => {
      this.http.post(`${this.apiUrl}/login`, credentials).subscribe({
        next: (response: any) => {
          console.log('Login response from backend:', response);
          
          if (response.token) {
            localStorage.setItem(this.tokenKey, response.token);
            localStorage.setItem(this.userKey, JSON.stringify(response));
            
            observer.next(response);
            observer.complete();
          }
        },
        error: (error) => {
          console.error('Login failed:', error);
          observer.error(error);
        }
      });
    });
  }

  async initKeycloak(): Promise<boolean> {
    try {
      const authenticated = await this.keycloak.init({
        config: {
          url: 'http://localhost:6083',
          realm: 'myapp',
          clientId: 'angular-app'
        },
        initOptions: {
          onLoad: 'check-sso',
          checkLoginIframe: false,
          silentCheckSsoRedirectUri: window.location.origin + '/assets/silent-check-sso.html'
        },
        enableBearerInterceptor: false,
        bearerExcludedUrls: []
      });
      
      console.log('Keycloak initialized, authenticated:', authenticated);
      return authenticated;
    } catch (error) {
      console.error('Keycloak init failed', error);
      return false;
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const currentToken = this.getToken();
      if (!currentToken) {
        console.warn('No token to refresh');
        return false;
      }

      if (!this.isTokenExpired(currentToken)) {
        console.log('Token still valid, no refresh needed');
        return true;
      }

      console.log('Token expired, attempting refresh...');
      const refreshed = await this.keycloak.updateToken(30);
      
      if (refreshed) {
        const newToken = await this.keycloak.getToken();
        if (newToken) {
          localStorage.setItem(this.tokenKey, newToken);
          console.log('✅ Token refreshed successfully');
          return true;
        }
      }
      
      console.error('❌ Token refresh failed');
      return false;
      
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      return false;
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      const now = Date.now();
      const buffer = 60000;
      return now + buffer >= expiry;
    } catch {
      return true;
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUser(): any | null {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  updateUserData(userData: any): void {
    localStorage.setItem(this.userKey, JSON.stringify(userData));
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  forgotPassword(email: string): Observable<ForgotPasswordResponse> {
    console.log('🔑 Forgot password requested for:', email);
    const request: ForgotPasswordRequest = { email };
    return this.http.post<ForgotPasswordResponse>(
      `${this.apiUrl}/forgot-password`, 
      request
    ).pipe(
      tap(response => {
        console.log('📧 Forgot password response:', response);
      })
    );
  }

  resetPassword(data: { token: string, newPassword: string, confirmPassword: string }): Observable<any> {
    console.log('🔑 Resetting password with token:', data.token);
    return this.http.post(`${this.apiUrl}/reset-password`, data);
  }

  validateResetToken(token: string): Observable<any> {
    console.log('🔍 Validating token:', token);
    return this.http.get(`${this.apiUrl}/validate-reset-token`, {
      params: { token }
    });
  }

  // ✅ NEW METHOD: Call backend logout endpoint
  logoutUser(email: string, logoutType: string = 'VOLUNTARY'): Observable<any> {
    console.log('🚪 Calling logout endpoint for:', email, 'type:', logoutType);
    return this.http.post(`${this.apiUrl}/logout`, null, {
      params: {
        email: email,
        logoutType: logoutType
      }
    });
  }

  // ✅ MODIFIED: Call backend logout before clearing local storage
  logout(): void {
    const user = this.getUser();
    const email = user?.email;
    
    if (email) {
      console.log('🚪 Logging out user:', email);
      this.logoutUser(email, 'VOLUNTARY').subscribe({
        next: (response) => {
          console.log('✅ Backend logout successful:', response);
          localStorage.clear();
          this.keycloak.logout(window.location.origin).catch(() => {
            this.router.navigate(['/login']);
          });
        },
        error: (err) => {
          console.error('❌ Backend logout failed:', err);
          localStorage.clear();
          this.keycloak.logout(window.location.origin).catch(() => {
            this.router.navigate(['/login']);
          });
        }
      });
    } else {
      console.warn('No user email found for logout');
      localStorage.clear();
      this.keycloak.logout(window.location.origin).catch(() => {
        this.router.navigate(['/login']);
      });
    }
  }
}