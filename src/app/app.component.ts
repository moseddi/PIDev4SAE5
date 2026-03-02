import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationComponent } from './clubs_and_events_project/shared/components/notification/notification.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NotificationComponent],
  template: '<router-outlet></router-outlet><app-notification></app-notification>'
})
export class AppComponent {
  title: any;
}