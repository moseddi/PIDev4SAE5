import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, CourseNotification } from '../../../services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: CourseNotification[] = [];
  isConnected = false;
  private subscriptions: Subscription[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.connect();

    this.subscriptions.push(
      this.notificationService.notifications$.subscribe(notifications => {
        this.notifications = notifications;
      })
    );

    this.subscriptions.push(
      this.notificationService.connectionStatus$.subscribe(status => {
        this.isConnected = status;
      })
    );
  }

  clearNotifications(): void {
    this.notificationService.clearNotifications();
  }

  formatTimestamp(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
