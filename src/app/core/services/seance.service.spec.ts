import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SeanceService } from './seance.service';
import { Seance, SeanceSaveResponse } from '../../models';

describe('SeanceService', () => {
  let service: SeanceService;
  let httpMock: HttpTestingController;
  const base = 'http://localhost:8090/api/seances';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SeanceService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SeanceService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should GET all seances', () => {
    const mock: Seance[] = [];
    service.getAll().subscribe((data) => expect(data).toEqual(mock));
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('should GET seance by id', () => {
    service.getById(3).subscribe();
    const req = httpMock.expectOne(`${base}/3`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('should POST create with classeId query', () => {
    const seance = {
      dateDebut: '2026-04-10T09:00:00',
      dateFin: '2026-04-10T10:00:00',
      type: 'PRESENTIEL',
      jour: 'THURSDAY',
      salleId: 1,
    } as Seance;
    const res = { seance: {} as Seance, warnings: [] } as SeanceSaveResponse;
    service.create(seance, 2).subscribe((out) => expect(out).toEqual(res));
    const req = httpMock.expectOne(`${base}?classeId=2`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      dateDebut: seance.dateDebut,
      dateFin: seance.dateFin,
      type: seance.type,
      jour: seance.jour,
      salleId: seance.salleId,
    });
    req.flush(res);
  });

  it('should PUT update without classeId', () => {
    const seance = {
      dateDebut: '2026-04-10T09:00:00',
      dateFin: '2026-04-10T10:00:00',
      type: 'PRESENTIEL',
      jour: 'THURSDAY',
      salleId: 1,
    } as Seance;
    service.update(5, seance, null).subscribe();
    const req = httpMock.expectOne(`${base}/5`);
    expect(req.request.method).toBe('PUT');
    req.flush({ seance: {}, warnings: [] });
  });

  it('should GET occupied salles with excludeId', () => {
    service.getOccupiedSalles('a', 'b', 7).subscribe();
    const req = httpMock.expectOne(
      `${base}/salles/occupees?debut=a&fin=b&excludeId=7`
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should POST generate planning', () => {
    service.generatePlanning(4).subscribe();
    const req = httpMock.expectOne(`${base}/planning/generate/4`);
    expect(req.request.method).toBe('POST');
    req.flush([]);
  });
});
