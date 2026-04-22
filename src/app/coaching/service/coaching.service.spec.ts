import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CoachingService, Seance, Reservation } from './coaching.service';

describe('CoachingService', () => {
  let service: CoachingService;
  let httpMock: HttpTestingController;

  const mockSeance: Seance = { id: 1, goodName: 'Session 1', seanceDate: '2026-05-01', seanceTime: '10:00:00' };
  const mockReservation: Reservation = { id: 1, studidname: 'John Doe', merenumber: '2026-05-01', status: 'PENDING' };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CoachingService]
    });
    service = TestBed.inject(CoachingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Seances', () => {
    it('should GET all seances', () => {
      service.getAllSeances().subscribe(seances => expect(seances.length).toBe(1));
      const req = httpMock.expectOne(`${service.apiUrl}/api/seances`);
      expect(req.request.method).toBe('GET');
      req.flush([mockSeance]);
    });

    it('should GET seance by id', () => {
      service.getSeanceById(1).subscribe(s => expect(s.id).toBe(1));
      const req = httpMock.expectOne(`${service.apiUrl}/api/seances/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSeance);
    });

    it('should POST to create seance', () => {
      const newSeance: Seance = { goodName: 'New Session', seanceDate: '2026-06-01', seanceTime: '09:00:00' };
      service.createSeance(newSeance).subscribe();
      const req = httpMock.expectOne(`${service.apiUrl}/api/seances`);
      expect(req.request.method).toBe('POST');
      req.flush({ id: 2, ...newSeance });
    });

    it('should PUT to update seance', () => {
      service.updateSeance(1, mockSeance).subscribe();
      const req = httpMock.expectOne(`${service.apiUrl}/api/seances/1`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockSeance);
    });

    it('should DELETE seance', () => {
      service.deleteSeance(1).subscribe();
      const req = httpMock.expectOne(`${service.apiUrl}/api/seances/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should GET seances by tutor', () => {
      service.getSeancesByTutor(5).subscribe();
      const req = httpMock.expectOne(`${service.apiUrl}/api/seances/tutor/5`);
      expect(req.request.method).toBe('GET');
      req.flush([mockSeance]);
    });
  });

  describe('Reservations', () => {
    it('should GET all reservations', () => {
      service.getAllReservations().subscribe(r => expect(r.length).toBe(1));
      const req = httpMock.expectOne(`${service.apiUrl}/api/reservations`);
      expect(req.request.method).toBe('GET');
      req.flush([mockReservation]);
    });

    it('should GET reservation by id', () => {
      service.getReservationById(1).subscribe(r => expect(r.id).toBe(1));
      const req = httpMock.expectOne(`${service.apiUrl}/api/reservations/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockReservation);
    });

    it('should GET reservations by seance', () => {
      service.getReservationsBySeance(1).subscribe();
      const req = httpMock.expectOne(`${service.apiUrl}/api/seances/1/reservations`);
      expect(req.request.method).toBe('GET');
      req.flush([mockReservation]);
    });

    it('should POST to create reservation', () => {
      service.createReservation(1, mockReservation).subscribe();
      const req = httpMock.expectOne(`${service.apiUrl}/api/seances/1/reservations`);
      expect(req.request.method).toBe('POST');
      req.flush({ id: 2, ...mockReservation });
    });

    it('should PUT to update reservation', () => {
      service.updateReservation(1, mockReservation).subscribe();
      const req = httpMock.expectOne(`${service.apiUrl}/api/reservations/1`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockReservation);
    });

    it('should DELETE reservation', () => {
      service.deleteReservation(1).subscribe();
      const req = httpMock.expectOne(`${service.apiUrl}/api/reservations/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
