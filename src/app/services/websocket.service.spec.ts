import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { WebSocketService } from './websocket.service';

describe('WebSocketService', () => {
  let service: WebSocketService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [WebSocketService]
    });
    service = TestBed.inject(WebSocketService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return observable for login stream', () => {
    expect(service.getLoginStream()).toBeTruthy();
  });

  it('should return observable for active sessions', (done) => {
    service.getActiveSessions().subscribe(count => {
      expect(typeof count).toBe('number');
      done();
    });
  });

  it('should return observable for suspicious logins', (done) => {
    service.getSuspiciousLogins().subscribe(count => {
      expect(typeof count).toBe('number');
      done();
    });
  });

  it('should load recent logins and trigger HTTP call', () => {
    service.getRecentLogins().subscribe();
    const req = httpMock.expectOne(r => r.url.includes('recent-logins-formatted'));
    expect(req.request.method).toBe('GET');
    req.flush(['LOGIN: user@test.com at 10:00']);
    httpMock.expectOne(r => r.url.includes('active-count')).flush(5);
    httpMock.expectOne(r => r.url.includes('suspicious-count')).flush(1);
  });
});
