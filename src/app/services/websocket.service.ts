import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval } from 'rxjs';

declare var SockJS: any;
declare var Stomp: any;

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private stompClient: any = null;
  private isConnected = false;
  private hasLoadedInitial = false;

  private recentLoginsSubject = new BehaviorSubject<string[]>([]);
  private loginSubject = new BehaviorSubject<string>('');
  private activeSessionsSubject = new BehaviorSubject<number>(0);
  private suspiciousLoginsSubject = new BehaviorSubject<number>(0);

  private gatewayUrl = '/api/users';
  private statsUrl = '/api/users/stats';
  private wsUrl = '/ws';

  constructor(private http: HttpClient) {}

  getRecentLogins(): Observable<string[]> {
    if (!this.hasLoadedInitial) {
      this.hasLoadedInitial = true;
      this.loadLast24HoursLogins();
      interval(30000).subscribe(() => this.refreshStats());
    }
    return this.recentLoginsSubject.asObservable();
  }

  getLoginStream(): Observable<string> {
    return this.loginSubject.asObservable();
  }

  getActiveSessions(): Observable<number> {
    return this.activeSessionsSubject.asObservable();
  }

  getSuspiciousLogins(): Observable<number> {
    return this.suspiciousLoginsSubject.asObservable();
  }

  private loadLast24HoursLogins(): void {
    this.http.get<string[]>(`${this.gatewayUrl}/recent-logins-formatted`)
      .subscribe({
        next: (logins) => {
          console.log('📋 Loaded', logins.length, 'events from last 24 hours');
          const uniqueLogins = [...new Set(logins.map(l => String(l)))];
          this.recentLoginsSubject.next(uniqueLogins);
          this.refreshStats();
        },
        error: (err) => {
          console.error('Failed to fetch recent logins:', err);
          this.recentLoginsSubject.next([]);
        }
      });
  }

  private refreshStats(): void {
    this.http.get<number>(`${this.statsUrl}/active-count`)
      .subscribe({
        next: (count) => {
          console.log('📊 Active sessions:', count);
          this.activeSessionsSubject.next(count);
        },
        error: (err) => console.error('Error getting active sessions:', err)
      });

    this.http.get<number>(`${this.gatewayUrl}/logins/suspicious-count`)
      .subscribe({
        next: (count) => {
          console.log('⚠️ Suspicious logins:', count);
          this.suspiciousLoginsSubject.next(count);
        },
        error: (err) => console.error('Error getting suspicious count:', err)
      });
  }

  connect(): void {
    if (this.isConnected) {
      console.log('WebSocket already connected');
      return;
    }

    this.loadScripts(() => {
      try {
        const socket = new SockJS(this.wsUrl);
        this.stompClient = Stomp.over(socket);
        this.stompClient.debug = null;

        this.stompClient.connect({}, () => {
          console.log('✅ WebSocket connected');
          this.isConnected = true;

          this.stompClient.subscribe('/topic/logins', (message: any) => {
            if (message.body) {
              console.log('📥 New event received:', message.body);
              
              const current = this.recentLoginsSubject.getValue();
              
              // Only add if not already the first item (prevent duplicates)
              if (current.length === 0 || current[0] !== message.body) {
                const updated = [message.body, ...current].slice(0, 50);
                this.recentLoginsSubject.next(updated);
                this.loginSubject.next(message.body);
                this.refreshStats();
              } else {
                console.log('Duplicate WebSocket message ignored');
              }
            }
          });
        }, (error: any) => {
          console.error('WebSocket error:', error);
          this.isConnected = false;
          setTimeout(() => this.connect(), 3000);
        });
      } catch (error) {
        console.error('WebSocket connection error:', error);
        this.isConnected = false;
      }
    });
  }

  disconnect(): void {
    if (this.stompClient && this.isConnected) {
      this.stompClient.disconnect(() => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
      });
    }
  }

  private loadScripts(callback: () => void): void {
    if (typeof SockJS !== 'undefined' && typeof Stomp !== 'undefined') {
      callback();
      return;
    }

    const sockScript = document.createElement('script');
    sockScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/sockjs-client/1.6.1/sockjs.min.js';
    sockScript.onload = () => {
      const stompScript = document.createElement('script');
      stompScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/stomp.js/2.3.3/stomp.min.js';
      stompScript.onload = () => callback();
      document.head.appendChild(stompScript);
    };
    document.head.appendChild(sockScript);
  }
}