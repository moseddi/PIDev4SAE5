import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface UserProfile {
  id?: number;
  email: string;
  firstName: string;
  lastName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  country?: string;
  role?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = 'http://localhost:8089/api/users';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Get current user profile
  getMyProfile(): Observable<UserProfile> {
    const user = this.authService.getUser();
    return this.http.get<UserProfile>(`${this.apiUrl}/${user.userId}`);
  }

  // Update user profile
  updateProfile(userId: number, profileData: Partial<UserProfile>): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/${userId}`, profileData);
  }

  // Create full profile (after registration)
  createProfile(profileData: UserProfile): Observable<UserProfile> {
    return this.http.post<UserProfile>(this.apiUrl, profileData);
  }
}