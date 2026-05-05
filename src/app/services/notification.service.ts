import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface CourseNotification {
  type: string;
  message: string;
  courseId: number;
  courseTitle: string;
  timestamp: number;
  read?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private client: Client | null = null;
  private notificationsSubject = new BehaviorSubject<CourseNotification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  private isConnected = false;
  private reconnectTimer: any;

  constructor(private authService: AuthService) {}

  connect(): void {
    if (this.isConnected) {
      console.log('WebSocket already connected');
      return;
    }

    console.log('Connecting to WebSocket...');

    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:5059/Cours_Service/ws'),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: (frame) => {
        console.log('Connected to WebSocket');
        this.isConnected = true;
        this.connectionStatusSubject.next(true);

        // Subscribe to course creation notifications
        this.client?.subscribe('/topic/courses', (message: IMessage) => {
          const notification: CourseNotification = JSON.parse(message.body);
          console.log('Notification received:', notification);

          const current = this.notificationsSubject.value;
          this.notificationsSubject.next([notification, ...current]);
        });
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message']);
        this.connectionStatusSubject.next(false);
      },
      onDisconnect: () => {
        console.log('Disconnected from WebSocket');
        this.isConnected = false;
        this.connectionStatusSubject.next(false);
      }
    });

    this.client.activate();
  }

  disconnect(): void {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.isConnected = false;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
  }

  addNotification(notification: CourseNotification): void {
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([notification, ...current]);
  }

  clearNotifications(): void {
    this.notificationsSubject.next([]);
  }

  getNotificationCount(): number {
    return this.notificationsSubject.value.length;
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}