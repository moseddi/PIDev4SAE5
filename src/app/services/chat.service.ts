import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface ChatMessage {
  sender: string;
  content: string;
  type: 'CHAT' | 'JOIN' | 'LEAVE';
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private stompClient: Client | null = null;
  private messageSubject = new Subject<ChatMessage>();
  private connectedSubject = new Subject<boolean>();
  
  // URL du backend WebSocket - ADAPTER SELON VOTRE CONFIGURATION
  private readonly WS_ENDPOINT = 'http://localhost:5057/Coaching-service/ws/chat'; 
  private readonly TOPIC = '/topic/public';

  connect(): void {
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(this.WS_ENDPOINT),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: (frame) => {
        console.log('Connecté:', frame);
        this.connectedSubject.next(true);
        
        this.stompClient?.subscribe(this.TOPIC, (message) => {
          const chatMessage: ChatMessage = JSON.parse(message.body);
          this.messageSubject.next(chatMessage);
        });
      },
      onStompError: (frame) => {
        console.error('Erreur STOMP:', frame);
        this.connectedSubject.next(false);
      },
      onDisconnect: () => {
        console.log('Déconnecté');
        this.connectedSubject.next(false);
      }
    });

    this.stompClient.activate();
  }

  disconnect(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
    }
  }

  sendMessage(sender: string, content: string): void {
    const message: ChatMessage = {
      sender: sender,
      content: content,
      type: 'CHAT',
      timestamp: new Date().toISOString()
    };
    this.stompClient?.publish({
      destination: '/app/chat',
      body: JSON.stringify(message)
    });
  }

  joinChat(username: string): void {
    const message: ChatMessage = {
      sender: username,
      content: `${username} a rejoint le chat`,
      type: 'JOIN',
      timestamp: new Date().toISOString()
    };
    this.stompClient?.publish({
      destination: '/app/chat/addUser',
      body: JSON.stringify(message)
    });
  }

  getMessages(): Observable<ChatMessage> {
    return this.messageSubject.asObservable();
  }

  getConnectionStatus(): Observable<boolean> {
    return this.connectedSubject.asObservable();
  }
}
