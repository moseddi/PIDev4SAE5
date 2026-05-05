import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppNotification } from '../models/notification.model';


@Injectable({
    providedIn: 'root'
})
export class NotificationWebSocketService {
    private stompClient!: any;
    private socket!: any;

    // Subjects for different Notification types
    private quizNotifications = new BehaviorSubject<AppNotification | null>(null);
    private careerNotifications = new BehaviorSubject<AppNotification | null>(null);
    private certNotifications = new BehaviorSubject<AppNotification | null>(null);

    constructor() {
        this.connect();
    }

    private connect() {
        try {
            // Use the proxy configured in proxy.conf.json to avoid CORS and direct port calls
            const baseUrl = window.location.origin;
            this.socket = new SockJS(`${baseUrl}/notification-api/ws`);
            this.stompClient = new Client({ webSocketFactory: () => this.socket });
            this.stompClient.debug = () => { };

            this.stompClient.onConnect = (frame: any) => {
                console.log('[NotificationWS] Connecté via Proxy: ' + frame);
                this.subscribeToTopic('/topic/quiz', this.quizNotifications);
                this.subscribeToTopic('/topic/career', this.careerNotifications);
                this.subscribeToTopic('/topic/certification', this.certNotifications);
            };
            this.stompClient.onStompError = (error: any) => {
                console.warn('[NotificationWS] Erreur/Déconnexion, tentative de reconnexion dans 5s...', error);
                setTimeout(() => this.connect(), 5000);
            };
            this.stompClient.activate();
        } catch (e) {
            console.error('[NotificationWS] Échec initialisation:', e);
            setTimeout(() => this.connect(), 5000);
        }
    }

    private subscribeToTopic(topic: string, subject: BehaviorSubject<AppNotification | null>) {
        this.stompClient.subscribe(topic, (sdkEvent: any) => {
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

    getCertificationUpdates(): Observable<AppNotification | null> {
        return this.certNotifications.asObservable();
    }

    // Method to send notifications (if needed from frontend)
    sendNotification(endpoint: string, notification: AppNotification) {
        this.stompClient.send(`/app/send/${endpoint}`, {}, JSON.stringify(notification));
    }
}
