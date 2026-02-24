import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage, Participant } from '../../services/chat.service';
import { Subscription } from 'rxjs';
import { NavbarFrontComponent } from '../../courses/navbar-front/navbar-front.component';
import { FooterFrontComponent } from '../../courses/footer-front/footer-front.component';

interface MessageStatus {
  [key: string]: 'sending' | 'sent' | 'seen';
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarFrontComponent, FooterFrontComponent],
  template: `
    <app-navbar-front></app-navbar-front>
    
    <div class="chat-page">
      <div class="chat-container">
        <!-- Sidebar - Participants -->
        <div class="chat-sidebar">
          <div class="sidebar-header">
            <h4><i class="bi bi-people-fill"></i> Participants</h4>
            <span class="online-count">{{ participants.length }} online</span>
          </div>
          
          <div class="participants-list">
            <div 
              *ngFor="let participant of participants" 
              class="participant-item"
              [class.active]="selectedParticipant === participant.username"
              (click)="selectParticipant(participant.username)"
            >
              <div class="avatar" [class.online]="participant.isOnline">
                <img *ngIf="getAvatar(participant.username)" [src]="getAvatar(participant.username)" alt="Avatar" class="avatar-img" />
                <span *ngIf="!getAvatar(participant.username)">{{ participant.initials }}</span>
                <span class="status-dot" [class.online]="participant.isOnline"></span>
              </div>
              <div class="participant-info">
                <span class="name">{{ participant.username }}</span>
                <span class="status-text" *ngIf="participant.isOnline">Online</span>
              </div>
            </div>
            
            <div *ngIf="participants.length === 0" class="no-participants">
              <i class="bi bi-chat-square-text"></i>
              <p>No participants yet</p>
            </div>
          </div>
        </div>

        <!-- Main Chat Area -->
        <div class="chat-main">
          <!-- Chat Header -->
          <div class="chat-header">
            <div class="chat-title">
              <i class="bi bi-chat-dots-fill"></i>
              <span>Live Chat</span>
            </div>
            <div class="connection-status" [class.connected]="isConnected">
              <span class="status-indicator"></span>
              {{ isConnected ? 'Connected' : 'Disconnected' }}
            </div>
          </div>

          <!-- Login Section -->
          <div class="login-overlay" *ngIf="!isJoined">
            <div class="login-card">
              <div class="login-icon">
                <i class="bi bi-chat-square-quote"></i>
              </div>
              <h3>Welcome to Chat</h3>
              <p>Join the conversation in real-time</p>
              <div class="login-form">
                <input 
                  type="text" 
                  [(ngModel)]="username" 
                  placeholder="Enter your username..."
                  (keyup.enter)="joinChat()"
                  class="username-input"
                />
                <button (click)="joinChat()" [disabled]="!username.trim()" class="join-btn">
                  <i class="bi bi-arrow-right-circle"></i> Join
                </button>
              </div>
            </div>
          </div>

          <!-- Messages Area -->
          <div class="messages-area" *ngIf="isJoined">
            <div class="messages-container" #messagesContainer>
              <div 
                *ngFor="let msg of messages" 
                class="message-wrapper"
                [class.my-message]="msg.sender === username"
              >
                <!-- Avatar for other users -->
                <div class="message-avatar" *ngIf="msg.sender !== username">
                  <img *ngIf="getAvatar(msg.sender)" [src]="getAvatar(msg.sender)" alt="Avatar" class="avatar-img" />
                  <span *ngIf="!getAvatar(msg.sender)">{{ getInitials(msg.sender) }}</span>
                </div>
                
                <div class="message-bubble">
                  <!-- Sender name (for others) -->
                  <div class="sender-name" *ngIf="msg.sender !== username">
                    {{ msg.sender }}
                  </div>
                  
                  <!-- Message content -->
                  <div class="message-content">
                    {{ msg.content }}
                  </div>
                  
                  <!-- Message footer -->
                  <div class="message-footer">
                    <span class="timestamp">{{ formatTime(msg.timestamp) }}</span>
                    <span class="message-status" *ngIf="msg.sender === username">
                      <i class="bi" [class.bi-check]="messageStatus[msg.timestamp] === 'sent'" 
                         [class.bi-check2-all]="messageStatus[msg.timestamp] === 'seen'"
                         [class.seen]="messageStatus[msg.timestamp] === 'seen'"></i>
                    </span>
                  </div>
                </div>
              </div>

              <!-- Typing Indicator -->
              <div class="typing-indicator" *ngIf="isTyping">
                <div class="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span class="typing-text">{{ typingUser }} is typing...</span>
              </div>
            </div>

            <!-- Input Area -->
            <div class="input-area">
              <!-- Emoji Picker -->
              <div class="emoji-picker" *ngIf="showEmojis">
                <div class="emoji-categories">
                  <button *ngFor="let cat of emojiCategories" 
                          (click)="selectedCategory = cat"
                          [class.active]="selectedCategory === cat">
                    {{ cat.icon }}
                  </button>
                </div>
                <div class="emoji-grid">
                  <button *ngFor="let emoji of getEmojis()" 
                          (click)="addEmoji(emoji)"
                          class="emoji-btn">
                    {{ emoji }}
                  </button>
                </div>
              </div>

              <div class="input-row">
                <button class="emoji-toggle" (click)="toggleEmojis()">
                  <i class="bi bi-emoji-smile"></i>
                </button>
                
                <input 
                  type="text" 
                  [(ngModel)]="messageContent" 
                  placeholder="Type your message..."
                  (keyup.enter)="sendMessage()"
                  (input)="onTyping()"
                  class="message-input"
                />
                
                <button class="send-btn" (click)="sendMessage()" [disabled]="!messageContent.trim()">
                  <i class="bi bi-send-fill"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <app-footer-front></app-footer-front>
  `,
  styles: [`
    /* Reset & Base */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    .chat-page {
      min-height: calc(100vh - 200px);
      background: linear-gradient(135deg, #F7EDE2 0%, #d4c4b0 100%);
      padding: 0;
      margin-top: 70px;
    }

    .chat-container {
      display: flex;
      height: calc(100vh - 70px);
      max-width: 100%;
      background: #fff;
      box-shadow: 0 0 40px rgba(0, 0, 0, 0.1);
    }

    /* Sidebar - Using #2D5757 color */
    .chat-sidebar {
      width: 300px;
      min-width: 300px;
      background: linear-gradient(180deg, #2D5757 0%, #1a3636 100%);
      color: white;
      display: flex;
      flex-direction: column;
    }

    .sidebar-header {
      padding: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .sidebar-header h4 {
      margin: 0 0 5px 0;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .online-count {
      font-size: 0.85rem;
      opacity: 0.8;
    }

    .participants-list {
      flex: 1;
      overflow-y: auto;
      padding: 10px;
    }

    .participant-item {
      display: flex;
      align-items: center;
      padding: 12px 15px;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-bottom: 5px;
    }

    .participant-item:hover, .participant-item.active {
      background: rgba(255, 255, 255, 0.15);
    }

    .avatar {
      width: 45px;
      height: 45px;
      min-width: 45px;
      border-radius: 50%;
      background: linear-gradient(135deg, #F7EDE2 0%, #d4c4b0 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 0.9rem;
      color: #2D5757;
      position: relative;
      margin-right: 12px;
      overflow: hidden;
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar.online .status-dot {
      background: #4ade80;
    }

    .status-dot {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #94a3b8;
      border: 2px solid #1a3636;
    }

    .participant-info {
      display: flex;
      flex-direction: column;
    }

    .participant-info .name {
      font-weight: 600;
      font-size: 0.95rem;
    }

    .status-text {
      font-size: 0.75rem;
      opacity: 0.7;
    }

    .no-participants {
      text-align: center;
      padding: 40px 20px;
      opacity: 0.6;
    }

    .no-participants i {
      font-size: 3rem;
      margin-bottom: 10px;
    }

    /* Main Chat Area */
    .chat-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #F7EDE2;
    }

    .chat-header {
      padding: 15px 25px;
      background: white;
      border-bottom: 1px solid #e9ecef;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chat-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.2rem;
      font-weight: 600;
      color: #2D5757;
    }

    .chat-title i {
      color: #2D5757;
    }

    .connection-status {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      color: #dc3545;
    }

    .connection-status.connected {
      color: #28a745;
    }

    .status-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #dc3545;
    }

    .connection-status.connected .status-indicator {
      background: #28a745;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* Login Overlay - Using #2D5757 */
    .login-overlay {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #2D5757 0%, #1a3636 100%);
    }

    .login-card {
      background: white;
      padding: 50px;
      border-radius: 20px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 400px;
      width: 90%;
    }

    .login-icon {
      font-size: 4rem;
      color: #2D5757;
      margin-bottom: 20px;
    }

    .login-card h3 {
      color: #333;
      margin-bottom: 10px;
    }

    .login-card p {
      color: #666;
      margin-bottom: 30px;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .username-input {
      padding: 15px 20px;
      border: 2px solid #e9ecef;
      border-radius: 12px;
      font-size: 1rem;
      transition: all 0.3s;
    }

    .username-input:focus {
      outline: none;
      border-color: #2D5757;
    }

    .join-btn {
      padding: 15px 20px;
      background: linear-gradient(135deg, #2D5757 0%, #1a3636 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }

    .join-btn:hover:not(:disabled) {
      transform: translateY(-2px);
    }

    .join-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Messages Area */
    .messages-area {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 20px 25px;
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .message-wrapper {
      display: flex;
      align-items: flex-end;
      gap: 10px;
      max-width: 70%;
    }

    .message-wrapper.my-message {
      align-self: flex-end;
      flex-direction: row-reverse;
    }

    .message-avatar {
      width: 35px;
      height: 35px;
      min-width: 35px;
      border-radius: 50%;
      background: linear-gradient(135deg, #2D5757 0%, #1a3636 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: bold;
      color: white;
      overflow: hidden;
    }

    .message-avatar .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .message-bubble {
      padding: 12px 18px;
      border-radius: 18px;
      background: white;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
    }

    .my-message .message-bubble {
      background: linear-gradient(135deg, #2D5757 0%, #3d7a7a 100%);
      color: white;
      border-bottom-right-radius: 4px;
    }

    .message-bubble:not(.my-message .message-bubble) {
      border-bottom-left-radius: 4px;
    }

    .sender-name {
      font-size: 0.8rem;
      font-weight: 600;
      color: #2D5757;
      margin-bottom: 5px;
    }

    .my-message .sender-name {
      display: none;
    }

    .message-content {
      font-size: 0.95rem;
      line-height: 1.5;
      word-wrap: break-word;
    }

    .message-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 6px;
    }

    .timestamp {
      font-size: 0.7rem;
      opacity: 0.6;
    }

    .message-status {
      font-size: 0.8rem;
    }

    .message-status .bi-check2-all.seen {
      color: #4ade80;
    }

    /* Typing Indicator */
    .typing-indicator {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 15px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
      width: fit-content;
    }

    .typing-dots {
      display: flex;
      gap: 4px;
    }

    .typing-dots span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #2D5757;
      animation: typing 1.4s infinite;
    }

    .typing-dots span:nth-child(2) {
      animation-delay: 0.2s;
    }

    .typing-dots span:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes typing {
      0%, 100% { opacity: 0.4; transform: translateY(0); }
      50% { opacity: 1; transform: translateY(-4px); }
    }

    .typing-text {
      font-size: 0.85rem;
      color: #666;
    }

    /* Input Area */
    .input-area {
      padding: 15px 25px;
      background: white;
      border-top: 1px solid #e9ecef;
      position: relative;
    }

    .emoji-picker {
      position: absolute;
      bottom: 100%;
      left: 25px;
      background: white;
      border-radius: 15px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      padding: 15px;
      width: 320px;
      margin-bottom: 10px;
    }

    .emoji-categories {
      display: flex;
      gap: 8px;
      margin-bottom: 15px;
      border-bottom: 1px solid #e9ecef;
      padding-bottom: 10px;
    }

    .emoji-categories button {
      background: none;
      border: none;
      font-size: 1.3rem;
      cursor: pointer;
      padding: 5px 8px;
      border-radius: 8px;
      transition: background 0.2s;
    }

    .emoji-categories button:hover, .emoji-categories button.active {
      background: #F7EDE2;
    }

    .emoji-grid {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 5px;
      max-height: 200px;
      overflow-y: auto;
    }

    .emoji-btn {
      background: none;
      border: none;
      font-size: 1.3rem;
      cursor: pointer;
      padding: 5px;
      border-radius: 8px;
      transition: all 0.2s;
    }

    .emoji-btn:hover {
      background: #F7EDE2;
      transform: scale(1.2);
    }

    .input-row {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #F7EDE2;
      border-radius: 25px;
      padding: 8px 15px;
    }

    .emoji-toggle, .send-btn {
      background: none;
      border: none;
      font-size: 1.3rem;
      color: #2D5757;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .emoji-toggle:hover {
      background: #e9ecef;
    }

    .send-btn {
      background: linear-gradient(135deg, #2D5757 0%, #3d7a7a 100%);
      color: white;
    }

    .send-btn:hover:not(:disabled) {
      transform: scale(1.1);
    }

    .send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .message-input {
      flex: 1;
      border: none;
      background: none;
      padding: 10px;
      font-size: 0.95rem;
      outline: none;
    }

    /* Scrollbar */
    .messages-container::-webkit-scrollbar,
    .participants-list::-webkit-scrollbar,
    .emoji-grid::-webkit-scrollbar {
      width: 6px;
    }

    .messages-container::-webkit-scrollbar-track,
    .participants-list::-webkit-scrollbar-track,
    .emoji-grid::-webkit-scrollbar-track {
      background: transparent;
    }

    .messages-container::-webkit-scrollbar-thumb,
    .participants-list::-webkit-scrollbar-thumb,
    .emoji-grid::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 3px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .chat-sidebar {
        display: none;
      }
    }
  `]
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  // User state
  username: string = '';
  messageContent: string = '';
  messages: ChatMessage[] = [];
  isConnected: boolean = false;
  isJoined: boolean = false;

  // Participants from service
  participants: Participant[] = [];
  selectedParticipant: string = '';

  // Typing
  isTyping: boolean = false;
  typingUser: string = '';
  private typingTimeout: any;

  // Message status
  messageStatus: MessageStatus = {};

  // Emojis
  showEmojis: boolean = false;
  selectedCategory: any;

  // Avatar placeholders (in real app, these would come from a service)
  private avatarMap: { [key: string]: string } = {};

  private subscriptions: Subscription[] = [];

  // Emoji data
  emojiCategories = [
    { name: 'Sourires', icon: '😀' },
    { name: 'Gestes', icon: '👋' },
    { name: 'Cœurs', icon: '❤️' },
    { name: 'Objets', icon: '📦' },
    { name: 'Symboles', icon: '✅' }
  ];

  emojiSets: { [key: string]: string[] } = {
    '😀': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷'],
    '👋': ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷'],
    '❤️': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '😍', '🥰', '😘', '💋', '💌', '💒', '🏩', '💐', '🌹', '🥀', '🌷', '🌸', '💮', '🏵️', '🌺', '🌻', '🌼', '💐', '🌾', '🍀', '🍁', '🍂', '🍃'],
    '📦': ['📦', '📫', '📬', '📭', '📮', '📯', '📜', '📃', '📄', '📑', '🧾', '📊', '📈', '📉', '🗒️', '🗓️', '📆', '📅', '🗑️', '📇', '🗃️', '🗳️', '🗄️', '📋', '📁', '📂', '🗂️', '🗞️', '📰', '📓', '📔', '📒', '📕', '📗', '📘', '📙', '📚', '📖', '🔖', '🧷', '🔗', '📎', '🖇️', '📐', '📏', '🧮', '📌'],
    '✅': ['✅', '✔️', '☑️', '❌', '❎', '➕', '➖', '➗', '✖️', '💯', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '⬛', '⬜', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬆️', '↗️', '➡️']
  };

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
        
        // Mark as sent
        if (message.sender === this.username) {
          setTimeout(() => {
            this.messageStatus[message.timestamp] = 'sent';
            // Simulate "seen" after 2 seconds
            setTimeout(() => {
              this.messageStatus[message.timestamp] = 'seen';
            }, 2000);
          }, 500);
        }
        
        this.scrollToBottom();
      })
    );

    // Subscribe to participants
    this.subscriptions.push(
      this.chatService.getParticipants().subscribe(participants => {
        this.participants = participants;
      })
    );

    // Connect to WebSocket
    this.chatService.connect();
    
    // Initialize selected category
    this.selectedCategory = this.emojiCategories[0];
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.isJoined) {
      this.chatService.leaveChat(this.username);
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
      // Mark as sending
      const timestamp = new Date().toISOString();
      this.messageStatus[timestamp] = 'sending';
      
      this.chatService.sendMessage(this.username, this.messageContent);
      this.messageContent = '';
      this.showEmojis = false;
    }
  }

  leaveChat(): void {
    this.isJoined = false;
    this.messages = [];
    this.chatService.leaveChat(this.username);
    this.chatService.disconnect();
    this.chatService.connect();
  }

  // Participant methods
  selectParticipant(username: string): void {
    this.selectedParticipant = username;
  }

  // Get avatar (returns null if no avatar set)
  getAvatar(username: string): string | null {
    return this.avatarMap[username] || null;
  }

  // Set avatar for a user
  setAvatar(username: string, avatarUrl: string): void {
    this.avatarMap[username] = avatarUrl;
  }

  // Typing indicator
  onTyping(): void {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    this.typingTimeout = setTimeout(() => {
      // Clear typing after timeout
    }, 1000);
  }

  // Emoji methods
  toggleEmojis(): void {
    this.showEmojis = !this.showEmojis;
  }

  getEmojis(): string[] {
    return this.emojiSets[this.selectedCategory?.icon] || this.emojiSets['😀'];
  }

  addEmoji(emoji: string): void {
    this.messageContent += emoji;
  }

  // Helper methods
  getInitials(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom(): void {
    try {
      setTimeout(() => {
        if (this.messagesContainer) {
          const element = this.messagesContainer.nativeElement;
          element.scrollTop = element.scrollHeight;
        }
      }, 100);
    } catch(err) { }
  }
}
