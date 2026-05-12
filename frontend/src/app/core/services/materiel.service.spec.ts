import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MaterielService } from './materiel.service';

describe('MaterielService', () => {
  let service: MaterielService;
  let httpMock: HttpTestingController;
  const api = 'http://localhost:8088/api/materiels';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MaterielService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MaterielService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should POST create with salleId query', () => {
    service
      .create('M', 'DISPONIBLE', 5, 1, 100, 2)
      .subscribe();
    const req = httpMock.expectOne(`${api}?salleId=2`);
    expect(req.request.method).toBe('POST');
    req.flush({
      materiel: { id: 1, nom: 'M' },
      warnings: [],
    });
  });
});
