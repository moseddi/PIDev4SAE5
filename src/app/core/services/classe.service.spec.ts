import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ClasseService } from './classe.service';
import { Classe } from '../../models';

describe('ClasseService', () => {
  let service: ClasseService;
  let httpMock: HttpTestingController;
  const base = 'http://localhost:8090/api/classes';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ClasseService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ClasseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should GET all classes', () => {
    service.getAll().subscribe((data) => expect(data.length).toBe(0));
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should GET class by id', () => {
    service.getById(1).subscribe();
    const req = httpMock.expectOne(`${base}/1`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 1, nom: '4SAE5' } as Classe);
  });

  it('should POST create', () => {
    const c: Classe = { id: 0, nom: 'New' };
    service.create(c).subscribe();
    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(c);
    req.flush({ id: 2, nom: 'New' });
  });

  it('should DELETE', () => {
    service.delete(3).subscribe();
    const req = httpMock.expectOne(`${base}/3`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
