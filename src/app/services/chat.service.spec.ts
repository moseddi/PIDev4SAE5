import { TestBed } from '@angular/core/testing';
import { ChatService, ChatMessage, Participant } from './chat.service';

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ChatService] });
    service = TestBed.inject(ChatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return an observable for messages', () => {
    expect(service.getMessages()).toBeTruthy();
  });

  it('should return an observable for connection status', () => {
    expect(service.getConnectionStatus()).toBeTruthy();
  });

  it('should return an observable for participants', (done) => {
    service.getParticipants().subscribe(participants => {
      expect(Array.isArray(participants)).toBeTrue();
      done();
    });
  });

  it('should start with empty participants list', (done) => {
    service.getParticipants().subscribe(participants => {
      expect(participants.length).toBe(0);
      done();
    });
  });
});
