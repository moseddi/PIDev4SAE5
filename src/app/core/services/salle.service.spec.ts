import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SalleService } from './salle.service';
import { Salle } from '../../models';

describe('SalleService', () => {
  let service: SalleService;
  let httpMock: HttpTestingController;
  const base = 'http://localhost:8088/api/salles';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SalleService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SalleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should GET all salles', () => {
    service.getAll().subscribe();
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should PUT update', () => {
    const s: Salle = { id: 1, nom: 'S1', capacite: 20, materiels: [] };
    service.update(1, s).subscribe();
    const req = httpMock.expectOne(`${base}/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(s);
  });
});
