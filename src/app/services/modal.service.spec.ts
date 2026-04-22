import { TestBed } from '@angular/core/testing';
import { ModalService } from './modal.service';

describe('ModalService', () => {
  let service: ModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ModalService] });
    service = TestBed.inject(ModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit false initially', (done) => {
    service.profileModal$.subscribe(val => {
      expect(val).toBeFalse();
      done();
    });
  });

  it('should emit true when openProfileModal is called', (done) => {
    const values: boolean[] = [];
    service.profileModal$.subscribe(val => values.push(val));
    service.openProfileModal();
    expect(values).toContain(true);
    done();
  });

  it('should emit false when closeProfileModal is called', (done) => {
    const values: boolean[] = [];
    service.profileModal$.subscribe(val => values.push(val));
    service.openProfileModal();
    service.closeProfileModal();
    expect(values[values.length - 1]).toBeFalse();
    done();
  });
});
