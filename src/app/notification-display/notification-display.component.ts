import { Component, OnInit } from '@angular/core';
import { NotificationWebSocketService } from '../backoffice/services/notification-websocket.service';
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

    constructor(private service: NotificationWebSocketService) { }

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
    }

    private addNotification(notif: AppNotification) {
        this.notifications.unshift(notif);
        // Autohide after 8 seconds
        setTimeout(() => {
            const index = this.notifications.indexOf(notif);
            if (index > -1) {
                this.notifications.splice(index, 1);
            }
        }, 8000);
    }

    getTitle(sender: string): string {
        switch (sender) {
            case 'QUIZ': return 'Nouveau Quiz !';
            case 'CAREER': return 'Nouvelle Offre d\'Emploi !';
            case 'CERTIFICATION': return 'Mise à jour Certification';
            default: return 'Notification';
        }
    }

    formatTime(timestamp: string): string {
        if (!timestamp) return 'À l\'instant';
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return timestamp;
            return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        } catch {
            return timestamp;
        }
    }
}
