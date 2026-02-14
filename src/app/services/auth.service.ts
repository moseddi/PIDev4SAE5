import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenKey = 'auth_token';
  private userKey = 'user_data';

  constructor() {}

  login(credentials: any): Observable<any> {
    console.log('Login with:', credentials);
    
    // STATIC OBJECTS BASED ON EMAIL
    let response: any;
    
    if (credentials.email === 'admin') {
      // Admin login
      response = {
        token: 'admin-token-123',
        email: 'admin@test.com',
        role: 'ADMIN',
        userId: 1
      };
    } 
    else if (credentials.email === 'tutor') {
      // Tutor login
      response = {
        token: 'tutor-token-456',
        email: 'tutor@test.com',
        role: 'TUTOR',
        userId: 2
      };
    }
    else {
      // Student login (default)
      response = {
        token: 'student-token-789',
        email: credentials.email || 'student@test.com',
        role: 'STUDENT',
        userId: 3
      };
    }
    
    // Save to localStorage
    localStorage.setItem(this.tokenKey, response.token);
    localStorage.setItem(this.userKey, JSON.stringify(response));
    
    return of(response);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUser(): any | null {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }
}