import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, switchMap, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = 'http://localhost:8089/api/users';

  private cachedUsers: any[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 30000;

  private isPreloading = false;
  private preloadDone = false;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  public preloadUsers(): void {
    if (this.isPreloading || this.isCacheValid()) {
      console.log('⏭️ Preload skipped — already loading or cache valid');
      return;
    }

    const token = this.authService.getToken();
    if (!token || this.isTokenExpired(token)) {
      console.warn('⚠️ Cannot preload — no valid token');
      return;
    }

    this.isPreloading = true;
    console.log('🚀 Preloading users in background...');

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.get<any[]>(this.apiUrl, { headers }).subscribe({
      next: (users) => {
        this.cachedUsers = users;
        this.cacheTimestamp = Date.now();
        this.isPreloading = false;
        this.preloadDone = true;
        console.log('✅ Users preloaded:', users.length);
      },
      error: (err) => {
        this.isPreloading = false;
        console.warn('⚠️ Preload failed — will load on demand. Status:', err.status);
      }
    });
  }

  private getFreshHeaders(): Observable<HttpHeaders> {
  const token = this.authService.getToken();
  
  if (!token) {
    console.log('No token found');
    return throwError(() => ({ status: 401, message: 'SESSION_EXPIRED' }));
  }

  // ✅ Don't try to refresh here - let the error handler handle it
  return of(new HttpHeaders().set('Authorization', `Bearer ${token}`));
}
  private isTokenExpired(token: string | null): boolean {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000;
      const now = Date.now();
      return now >= expiry;
    } catch (e) {
      return true;
    }
  }

  private isCacheValid(): boolean {
    return (
      this.cachedUsers !== null &&
      Date.now() - this.cacheTimestamp < this.CACHE_DURATION
    );
  }

  clearCache(): void {
    this.cachedUsers = null;
    this.cacheTimestamp = 0;
    this.preloadDone = false;
    this.isPreloading = false;
    console.log('🗑️ User cache cleared');
  }

  getAllUsers(): Observable<any[]> {
    if (this.isCacheValid()) {
      console.log('⚡ Returning cached users instantly');
      return of(this.cachedUsers!);
    }

    return this.getFreshHeaders().pipe(
      switchMap(headers =>
        this.http.get<any[]>(this.apiUrl, { headers }).pipe(
          tap(users => {
            this.cachedUsers = users;
            this.cacheTimestamp = Date.now();
            this.preloadDone = true;
            console.log('📦 Users cached:', users.length);
          })
        )
      ),
      catchError((error) => {
        console.error('Error loading users:', error);
        
        if (error.status === 401 || error.message === 'SESSION_EXPIRED') {
          return throwError(() => ({ status: 401, message: 'SESSION_EXPIRED' }));
        }
        
        if (this.cachedUsers) {
          console.log('⚠️ Using stale cache as fallback');
          return of(this.cachedUsers);
        }
        
        return throwError(() => error);
      })
    );
  }

  getUserById(id: number): Observable<any> {
    return this.getFreshHeaders().pipe(
      switchMap(headers => this.http.get<any>(`${this.apiUrl}/${id}`, { headers })),
      catchError((error) => {
        if (error.status === 401) return throwError(() => ({ status: 401, message: 'SESSION_EXPIRED' }));
        return throwError(() => error);
      })
    );
  }

  getUserByEmail(email: string): Observable<any> {
    return this.getFreshHeaders().pipe(
      switchMap(headers => this.http.get<any>(`${this.apiUrl}/email/${email}`, { headers })),
      catchError((error) => {
        if (error.status === 401) return throwError(() => ({ status: 401, message: 'SESSION_EXPIRED' }));
        return throwError(() => error);
      })
    );
  }

  createUser(userData: any): Observable<any> {
    return this.getFreshHeaders().pipe(
      switchMap(headers => this.http.post<any>(this.apiUrl, userData, { headers }).pipe(tap(() => this.clearCache()))),
      catchError((error) => {
        if (error.status === 401) return throwError(() => ({ status: 401, message: 'SESSION_EXPIRED' }));
        return throwError(() => error);
      })
    );
  }

  updateUser(id: number, userData: any): Observable<any> {
    return this.getFreshHeaders().pipe(
      switchMap(headers => this.http.put<any>(`${this.apiUrl}/${id}`, userData, { headers }).pipe(tap(() => this.clearCache()))),
      catchError((error) => {
        if (error.status === 401) return throwError(() => ({ status: 401, message: 'SESSION_EXPIRED' }));
        return throwError(() => error);
      })
    );
  }

  updateUserByEmail(email: string, userData: any): Observable<any> {
    return this.getFreshHeaders().pipe(
      switchMap(headers => this.http.put<any>(`${this.apiUrl}/profile/${email}`, userData, { headers }).pipe(tap(() => this.clearCache()))),
      catchError((error) => {
        if (error.status === 401) return throwError(() => ({ status: 401, message: 'SESSION_EXPIRED' }));
        return throwError(() => error);
      })
    );
  }

  deleteUser(id: number): Observable<void> {
    return this.getFreshHeaders().pipe(
      switchMap(headers => this.http.delete<void>(`${this.apiUrl}/${id}`, { headers }).pipe(tap(() => this.clearCache()))),
      catchError((error) => {
        if (error.status === 401) return throwError(() => ({ status: 401, message: 'SESSION_EXPIRED' }));
        return throwError(() => error);
      })
    );
  }

  forceLogout(email: string): Observable<string> {
    return this.getFreshHeaders().pipe(
      switchMap(headers => this.http.post<string>(`${this.apiUrl}/force-logout/${email}`, {}, { headers })),
      catchError((error) => {
        if (error.status === 401) return throwError(() => ({ status: 401, message: 'SESSION_EXPIRED' }));
        return throwError(() => error);
      })
    );
  }

  getUsersByRole(role: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/role/${role}`, { headers: this.getHeaders() });
  }
}