import { Injectable } from '@angular/core';
import { Client, over } from 'stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppNotification } from '../models/notification.model';


@Injectable({
    providedIn: 'root'
})
export class NotificationWebSocketService {
    private stompClient!: Client;
    private socket!: any;

    // Subjects for different Notification types
    private quizNotifications = new BehaviorSubject<AppNotification | null>(null);
    private careerNotifications = new BehaviorSubject<AppNotification | null>(null);
    private certNotifications = new BehaviorSubject<AppNotification | null>(null);

    // Keep history of unread career notifications
    private unreadCareerNotifications = new BehaviorSubject<AppNotification[]>([]);

    constructor() {
        this.connect();
    }

    private connect() {
        try {
            // Use the proxy configured in proxy.conf.json to avoid CORS and direct port calls
            const baseUrl = window.location.origin;
            // Fix fallback issues: only allow pure websockets to prevent Angular router 404 SyntaxErrors
            this.socket = new SockJS(`${baseUrl}/notification-api/ws`, null, {
                transports: ['websocket']
            });
            this.stompClient = over(this.socket);
            this.stompClient.debug = () => { }; // Silence logs in production if needed

            this.stompClient.connect({}, (frame) => {
                console.log('[NotificationWS] Connecté via Proxy: ' + frame);

                // Subscribe to central topics
                this.subscribeToTopic('/topic/quiz', this.quizNotifications);
                this.subscribeToTopic('/topic/certification', this.certNotifications);

                // Special handling for job-offers topic to map DTO to AppNotification
                this.stompClient.subscribe('/topic/job-offers', (sdkEvent) => {
                    const dto = JSON.parse(sdkEvent.body);
                    
                    // Transformation du JobOfferNotificationDTO reçu en AppNotification
                    const notification: AppNotification = {
                        sender: 'CAREER',
                        type: 'NOUVELLE_OFFRE',
                        message: `${dto.title} chez ${dto.companyName || 'une entreprise'}${dto.location ? ' (' + dto.location + ')' : ''}`,
                        timestamp: dto.createdAt || new Date().toISOString()
                    };

                    this.careerNotifications.next(notification);
                    
                    const currentUnread = this.unreadCareerNotifications.value;
                    this.unreadCareerNotifications.next([notification, ...currentUnread]);
                });
            }, (error) => {
                console.warn('[NotificationWS] Erreur/Déconnexion, tentative de reconnexion dans 5s...', error);
                setTimeout(() => this.connect(), 5000);
            });
        } catch (e) {
            console.error('[NotificationWS] Échec initialisation:', e);
            setTimeout(() => this.connect(), 5000);
        }
    }

    private subscribeToTopic(topic: string, subject: BehaviorSubject<AppNotification | null>) {
        this.stompClient.subscribe(topic, (sdkEvent) => {
            const notification: AppNotification = JSON.parse(sdkEvent.body);
            subject.next(notification);
        });
    }

    // Observables for the components
    getQuizUpdates(): Observable<AppNotification | null> {
        return this.quizNotifications.asObservable();
    }

    getCareerUpdates(): Observable<AppNotification | null> {
        return this.careerNotifications.asObservable();
    }

    getUnreadCareerUpdates(): Observable<AppNotification[]> {
        return this.unreadCareerNotifications.asObservable();
    }

    clearUnreadCareer(): void {
        this.unreadCareerNotifications.next([]);
    }

    markCareerAsRead(index: number): void {
        const current = [...this.unreadCareerNotifications.value];
        current.splice(index, 1);
        this.unreadCareerNotifications.next(current);
    }

    getCertificationUpdates(): Observable<AppNotification | null> {
        return this.certNotifications.asObservable();
    }

    // Method to send notifications (if needed from frontend)
    sendNotification(endpoint: string, notification: AppNotification) {
        this.stompClient.send(`/app/send/${endpoint}`, {}, JSON.stringify(notification));
    }
}
