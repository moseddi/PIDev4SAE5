import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListeCoursStudentComponent } from './liste-cours-student.component';

describe('ListeCoursStudentComponent', () => {
  let component: ListeCoursStudentComponent;
  let fixture: ComponentFixture<ListeCoursStudentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListeCoursStudentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListeCoursStudentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
