import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface ChatMessage {
  sender: string;
  content: string;
  type: 'CHAT' | 'JOIN' | 'LEAVE' | 'USERS_LIST';
  timestamp: string;
  users?: string[];
}

export interface Participant {
  username: string;
  initials: string;
  isOnline: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private stompClient: Client | null = null;
  private messageSubject = new Subject<ChatMessage>();
  private connectedSubject = new Subject<boolean>();
  private participantsSubject = new BehaviorSubject<Participant[]>([]);
  private connectedUsername: string = '';
  
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
        console.log('Connected:', frame);
        this.connectedSubject.next(true);
        
        // Subscribe to the topic
        this.stompClient?.subscribe(this.TOPIC, (message) => {
          const chatMessage: ChatMessage = JSON.parse(message.body);
          this.messageSubject.next(chatMessage);
          
          // Handle JOIN messages - add participant
          if (chatMessage.type === 'JOIN') {
            this.addParticipant(chatMessage.sender);
          }
          // Handle LEAVE messages - remove participant
          else if (chatMessage.type === 'LEAVE') {
            this.removeParticipant(chatMessage.sender);
          }
          // Handle USERS_LIST - update participants list from server
          else if (chatMessage.type === 'USERS_LIST' && chatMessage.users) {
            this.updateParticipantsList(chatMessage.users);
          }
        });

        // Request list of connected users after connecting
        this.requestUsersList();
      },
      onStompError: (frame) => {
        console.error('STOMP Error:', frame);
        this.connectedSubject.next(false);
      },
      onDisconnect: () => {
        console.log('Disconnected');
        this.connectedSubject.next(false);
        this.participantsSubject.next([]);
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
    this.connectedUsername = username;
    
    // First, request the current users list
    this.requestUsersList();
    
    // Then send join message
    const message: ChatMessage = {
      sender: username,
      content: `${username} has joined the chat`,
      type: 'JOIN',
      timestamp: new Date().toISOString()
    };
    this.stompClient?.publish({
      destination: '/app/chat/addUser',
      body: JSON.stringify(message)
    });
    
    // Add self to participants
    this.addParticipant(username);
  }

  leaveChat(username: string): void {
    const message: ChatMessage = {
      sender: username,
      content: `${username} has left the chat`,
      type: 'LEAVE',
      timestamp: new Date().toISOString()
    };
    this.stompClient?.publish({
      destination: '/app/chat/removeUser',
      body: JSON.stringify(message)
    });
    
    // Remove self from participants
    this.removeParticipant(username);
  }

  // Request list of connected users from server
  private requestUsersList(): void {
    try {
      this.stompClient?.publish({
        destination: '/app/chat/getUsers',
        body: JSON.stringify({})
      });
    } catch (e) {
      console.log('Could not request users list, will sync from messages');
    }
  }

  // Update participants list from server response
  private updateParticipantsList(usernames: string[]): void {
    if (!usernames || usernames.length === 0) return;
    
    const participants: Participant[] = usernames
      .filter(u => u && u !== this.connectedUsername)
      .map(username => ({
        username,
        initials: username.charAt(0).toUpperCase(),
        isOnline: true
      }));
    
    // Update participants list
    this.participantsSubject.next(participants);
  }

  // Participant management
  private addParticipant(username: string): void {
    const currentParticipants = this.participantsSubject.getValue();
    const exists = currentParticipants.find(p => p.username === username);
    
    if (!exists && username) {
      const initials = username.charAt(0).toUpperCase();
      const newParticipant: Participant = {
        username,
        initials,
        isOnline: true
      };
      this.participantsSubject.next([...currentParticipants, newParticipant]);
    }
  }

  private removeParticipant(username: string): void {
    const currentParticipants = this.participantsSubject.getValue();
    const filtered = currentParticipants.filter(p => p.username !== username);
    this.participantsSubject.next(filtered);
  }

  getMessages(): Observable<ChatMessage> {
    return this.messageSubject.asObservable();
  }

  getConnectionStatus(): Observable<boolean> {
    return this.connectedSubject.asObservable();
  }

  getParticipants(): Observable<Participant[]> {
    return this.participantsSubject.asObservable();
  }
}
