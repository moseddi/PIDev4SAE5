import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface AppUser {
    id: number;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    password?: string;
    role: 'ADMIN' | 'PLAYER' | 'TUTOR';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly baseUrl = '/api/auth';
    private readonly STORAGE_KEY = 'current_user';

    constructor(private http: HttpClient) { }

    register(user: any): Observable<AppUser> {
        const payload = {
            ...user,
            confirmPassword: user.confirmPassword || user.password,
            role: user.role === 'PLAYER' ? 'STUDENT' : user.role
        };
        return this.http.post<any>(`${this.baseUrl}/register`, payload).pipe(
            tap((response: any) => {
                const mappedUser: AppUser = {
                    id: response.userId,
                    email: response.email,
                    role: response.role === 'STUDENT' ? 'PLAYER' : response.role,
                    username: response.email.split('@')[0]
                };
                this.saveUser(mappedUser);
            })
        );
    }

    login(email: string, password: string): Observable<AppUser> {
        return this.http.post<any>(`${this.baseUrl}/login`, { email, password }).pipe(
            tap((response: any) => {
                const mappedUser: AppUser = {
                    id: response.userId,
                    email: response.email,
                    role: response.role === 'STUDENT' ? 'PLAYER' : response.role,
                    username: response.email.split('@')[0]
                };
                this.saveUser(mappedUser);
                if (response.token) {
                    localStorage.setItem('auth_token', response.token);
                }
            })
        );
    }

    logout(): void {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem('auth_token');
    }

    getCurrentUser(): AppUser | null {
        try {
            // First check the assessment-specific storage key
            let stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) return JSON.parse(stored);

            // Fallback: check the main project's storage key 'user_data'
            stored = localStorage.getItem('user_data');
            if (stored) {
                const mainUser = JSON.parse(stored);
                // Map the main user structure to the AppUser interface
                return {
                    id: mainUser.userId || mainUser.id,
                    username: mainUser.username || (mainUser.email ? mainUser.email.split('@')[0] : 'User'),
                    email: mainUser.email,
                    firstName: mainUser.firstName,
                    lastName: mainUser.lastName,
                    // In assessment project, 'STUDENT' role is treated as 'PLAYER'
                    role: mainUser.role === 'STUDENT' ? 'PLAYER' : mainUser.role
                };
            }
            return null;
        } catch (e) {
            console.error('Error parsing user from localStorage', e);
            return null;
        }
    }

    getUser(): AppUser | null {
        return this.getCurrentUser();
    }

    isLoggedIn(): boolean {
        return this.getCurrentUser() !== null;
    }

    isAdmin(): boolean {
        return this.getCurrentUser()?.role === 'ADMIN';
    }

    isPlayer(): boolean {
        return this.getCurrentUser()?.role === 'PLAYER';
    }

    private saveUser(user: AppUser): void {
        const { password, ...safeUser } = user;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(safeUser));
    }
}
