import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { ClassesCalendarComponent } from './classes-calendar.component';
import { SeanceService } from '../../../core/services/seance.service';
import { ClasseService } from '../../../core/services/classe.service';

describe('ClassesCalendarComponent', () => {
  let component: ClassesCalendarComponent;
  let fixture: ComponentFixture<ClassesCalendarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassesCalendarComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { params: of({ id: '1' }) },
        },
        {
          provide: ClasseService,
          useValue: { getById: () => of({ id: 1, nom: 'Test' }) },
        },
        {
          provide: SeanceService,
          useValue: { getByClasseId: () => of([]) },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClassesCalendarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
