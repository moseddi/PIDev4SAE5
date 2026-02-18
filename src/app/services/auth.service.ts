import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8089/api/auth';
  private tokenKey = 'auth_token';
  private userKey = 'user_data';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  register(userData: any): Observable<any> {
    console.log('Register URL:', `${this.apiUrl}/register`);
    console.log('Register data:', userData);
    
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  login(credentials: any): Observable<any> {
    console.log('Login URL:', `${this.apiUrl}/login`);
    console.log('Login data:', credentials);
    
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        console.log('Login response:', response);
        if (response.token) {
          localStorage.setItem(this.tokenKey, response.token);
          localStorage.setItem(this.userKey, JSON.stringify(response));
        }
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUser(): any | null {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  // ✅ NEW: Update user data in localStorage
  updateUserData(userData: any): void {
    localStorage.setItem(this.userKey, JSON.stringify(userData));
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.router.navigate(['/login']);
  }
}