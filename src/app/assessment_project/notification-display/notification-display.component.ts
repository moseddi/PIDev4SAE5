import { Component, OnInit } from '@angular/core';
import { NotificationWebSocketService } from '../backoffice/services/notification-websocket.service';
import { ChannelWebSocketService } from '../backoffice/services/channel-websocket.service';
import { AppNotification } from '../backoffice/models/notification.model';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-notification-display',
    templateUrl: './notification-display.component.html',
    styleUrls: ['./notification-display.component.css'],
    standalone: true,
    imports: [CommonModule]
})
export class NotificationDisplayComponent implements OnInit {
    notifications: AppNotification[] = [];

    constructor(
        private service: NotificationWebSocketService,
        private channelWs: ChannelWebSocketService
    ) { }

    ngOnInit(): void {
        // Escuchar notificaciones de Quiz
        this.service.getQuizUpdates().subscribe(notif => {
            if (notif) this.addNotification(notif);
        });

        // Escuchar notificaciones de Career
        this.service.getCareerUpdates().subscribe(notif => {
            if (notif) this.addNotification(notif);
        });

        // Escuchar notificaciones de Certification
        this.service.getCertificationUpdates().subscribe(notif => {
            if (notif) this.addNotification(notif);
        });

        // Escuchar notificaciones de Canales (Nouveau Canal / Publication)
        this.channelWs.globalNotify$.subscribe(notif => {
            if (notif) this.addNotification(notif);
        });
    }

    private addNotification(notif: AppNotification) {
        this.notifications.unshift(notif); // Agregar al principio de la lista
        // Autohide after 10 seconds
        setTimeout(() => {
            this.notifications = this.notifications.filter(n => n !== notif);
        }, 10000);
    }
}
