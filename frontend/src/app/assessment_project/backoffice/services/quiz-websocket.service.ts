import { Injectable, OnDestroy } from '@angular/core';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class QuizWebSocketService implements OnDestroy {
    private stompClient!: Client;
    private socket!: any;
    private connected = false;
    private eventSubject = new Subject<{ type: string; payload: any }>();
    private pendingSubscriptions: number[] = [];
    private activeSubscriptions = new Map<number, any>();

    events$ = this.eventSubject.asObservable();

    constructor() {
        this.connect();
    }

    private connect() {
        const baseUrl = window.location.origin;
        // The endpoint defined in WebSocketConfig.java is /ws-quiz
        this.socket = new SockJS(`${baseUrl}/ws-quiz`);
        
        this.stompClient = new Client({
            webSocketFactory: () => this.socket,
            debug: (msg) => console.log('STOMP:', msg),
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000
        });

        this.stompClient.onConnect = (frame) => {
            console.log('Connected to Quiz WebSocket');
            this.connected = true;
            this.pendingSubscriptions.forEach(id => this.subscribeToSession(id));
            this.pendingSubscriptions = [];
        };

        this.stompClient.onStompError = (frame) => {
            console.error('STOMP error', frame);
            this.connected = false;
        };

        this.stompClient.activate();
    }

    subscribeToSession(sessionId: number): void {
        if (this.activeSubscriptions.has(sessionId)) return;

        if (!this.connected) {
            this.pendingSubscriptions.push(sessionId);
            return;
        }

        console.log(`Subscribing to quiz topic: /topic/quiz/${sessionId}`);
        const sub = this.stompClient.subscribe(`/topic/quiz/${sessionId}`, (message) => {
            const event = JSON.parse(message.body);
            this.eventSubject.next(event);
        });
        this.activeSubscriptions.set(sessionId, sub);
    }

    unsubscribeFromSession(sessionId: number): void {
        const sub = this.activeSubscriptions.get(sessionId);
        if (sub) {
            sub.unsubscribe();
            this.activeSubscriptions.delete(sessionId);
        }
    }

    ngOnDestroy(): void {
        if (this.stompClient) {
            this.stompClient.deactivate();
        }
    }
}
