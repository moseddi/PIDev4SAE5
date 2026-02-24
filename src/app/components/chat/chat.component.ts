import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-container">
      <div class="chat-header">
        <h3>💬 Chat en Temps Réel</h3>
        <span class="connection-status" [class.connected]="isConnected">
          {{ isConnected ? '● Connecté' : '○ Déconnecté' }}
        </span>
      </div>

      <!-- Login Section -->
      <div class="login-section" *ngIf="!isJoined">
        <input 
          type="text" 
          [(ngModel)]="username" 
          placeholder="Entrez votre pseudo..."
          (keyup.enter)="joinChat()"
          class="username-input"
        />
        <button (click)="joinChat()" [disabled]="!username.trim()" class="join-btn">
          Rejoindre le chat
        </button>
      </div>

      <!-- Chat Section -->
      <div class="chat-section" *ngIf="isJoined">
        <div class="messages-container" #messagesContainer>
          <div 
            *ngFor="let msg of messages" 
            class="message"
            [class.my-message]="msg.sender === username"
            [class.join-message]="msg.type === 'JOIN'"
            [class.leave-message]="msg.type === 'LEAVE'"
          >
            <span class="message-sender">{{ msg.sender }}</span>
            <span class="message-content">{{ msg.content }}</span>
            <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
          </div>
        </div>

        <div class="input-section">
          <input 
            type="text" 
            [(ngModel)]="messageContent" 
            placeholder="Tapez votre message..."
            (keyup.enter)="sendMessage()"
            class="message-input"
          />
          <button (click)="sendMessage()" [disabled]="!messageContent.trim()" class="send-btn">
            Envoyer
          </button>
          <button (click)="leaveChat()" class="leave-btn">
            Quitter
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-container {
      max-width: 600px;
      margin: 20px auto;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .chat-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chat-header h3 {
      margin: 0;
      font-size: 1.2rem;
    }

    .connection-status {
      font-size: 0.85rem;
      opacity: 0.8;
    }

    .connection-status.connected {
      color: #90EE90;
    }

    .login-section {
      padding: 30px;
      text-align: center;
    }

    .username-input {
      padding: 12px 15px;
      border: 2px solid #ddd;
      border-radius: 8px;
      width: 70%;
      font-size: 1rem;
      margin-right: 10px;
      transition: border-color 0.3s;
    }

    .username-input:focus {
      outline: none;
      border-color: #667eea;
    }

    .join-btn, .send-btn {
      padding: 12px 20px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      transition: background 0.3s;
    }

    .join-btn:hover, .send-btn:hover {
      background: #5568d3;
    }

    .join-btn:disabled, .send-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .chat-section {
      display: flex;
      flex-direction: column;
      height: 400px;
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 15px;
      background: #f9f9f9;
    }

    .message {
      margin-bottom: 12px;
      padding: 10px 14px;
      border-radius: 12px;
      max-width: 75%;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .message:not(.my-message) {
      background: #e9e9e9;
      margin-right: auto;
    }

    .my-message {
      background: #667eea;
      color: white;
      margin-left: auto;
    }

    .join-message, .leave-message {
      background: #f0f0f0;
      color: #888;
      font-style: italic;
      text-align: center;
      max-width: 100%;
    }

    .message-sender {
      font-weight: bold;
      font-size: 0.85rem;
      display: block;
      margin-bottom: 4px;
    }

    .my-message .message-sender {
      color: rgba(255, 255, 255, 0.8);
    }

    .message-content {
      display: block;
      word-wrap: break-word;
    }

    .message-time {
      font-size: 0.7rem;
      opacity: 0.7;
      display: block;
      text-align: right;
      margin-top: 4px;
    }

    .input-section {
      display: flex;
      padding: 15px;
      background: white;
      border-top: 1px solid #eee;
      gap: 10px;
    }

    .message-input {
      flex: 1;
      padding: 12px 15px;
      border: 2px solid #ddd;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s;
    }

    .message-input:focus {
      outline: none;
      border-color: #667eea;
    }

    .leave-btn {
      padding: 12px 15px;
      background: #ff6b6b;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      transition: background 0.3s;
    }

    .leave-btn:hover {
      background: #ee5a5a;
    }
  `]
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  username: string = '';
  messageContent: string = '';
  messages: ChatMessage[] = [];
  isConnected: boolean = false;
  isJoined: boolean = false;

  private subscriptions: Subscription[] = [];

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    // Subscribe to connection status
    this.subscriptions.push(
      this.chatService.getConnectionStatus().subscribe(connected => {
        this.isConnected = connected;
      })
    );

    // Subscribe to messages
    this.subscriptions.push(
      this.chatService.getMessages().subscribe(message => {
        this.messages.push(message);
        this.scrollToBottom();
      })
    );

    // Connect to WebSocket
    this.chatService.connect();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.isJoined) {
      this.chatService.disconnect();
    }
  }

  joinChat(): void {
    if (this.username.trim()) {
      this.isJoined = true;
      this.chatService.joinChat(this.username);
    }
  }

  sendMessage(): void {
    if (this.messageContent.trim() && this.username) {
      this.chatService.sendMessage(this.username, this.messageContent);
      this.messageContent = '';
    }
  }

  leaveChat(): void {
    this.isJoined = false;
    this.messages = [];
    this.chatService.disconnect();
    this.chatService.connect();
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    }, 100);
  }
}
