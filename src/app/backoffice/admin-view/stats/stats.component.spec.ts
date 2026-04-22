import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { StatsComponent } from './stats.component';

const mockDashboard = {
  totalUsers: 100,
  activeUsersLastMonth: 50,
  newUsersThisWeek: 10,
  retentionRate: 75,
  loginsPerDay: { '2026-04-01': 5, '2026-04-02': 8 },
  loginsPerHour: {},
  usersByRole: { ADMIN: 3, TUTOR: 10, STUDENT: 87 },
  mostActiveUsers: [],
  recentLogins: [{ city: 'Tunis', role: 'STUDENT' }],
  usersByCity: {}
};

function flushStats(httpMock: HttpTestingController, advancedStats: any = {}) {
  httpMock.expectOne(r => r.url.includes('dashboard')).flush(mockDashboard);
  httpMock.expectOne(r => r.url.includes('advanced-stats')).flush(advancedStats);
  httpMock.expectOne(r => r.url.includes('daily-activity')).flush([]);
  httpMock.expectOne(r => r.url.includes('weekday-activity')).flush({});
}

describe('StatsComponent', () => {
  let component: StatsComponent;
  let fixture: ComponentFixture<StatsComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatsComponent, HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(StatsComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    fixture.detectChanges();
    flushStats(httpMock);
    expect(component).toBeTruthy();
  });

  it('should set loading to false after data loads', () => {
    fixture.detectChanges();
    flushStats(httpMock);
    expect(component.loading).toBeFalse();
  });

  it('should set error message on dashboard load failure', () => {
    fixture.detectChanges();
    httpMock.expectOne(r => r.url.includes('dashboard')).flush(
      { message: 'Error' }, { status: 500, statusText: 'Server Error' }
    );
    expect(component.error).toBeTruthy();
    expect(component.loading).toBeFalse();
  });

  it('should return admin count', () => {
    fixture.detectChanges();
    flushStats(httpMock);
    expect(component.adminCount).toBe(3);
  });

  it('should return tutor count', () => {
    fixture.detectChanges();
    flushStats(httpMock);
    expect(component.tutorCount).toBe(10);
  });

  it('should return student count', () => {
    fixture.detectChanges();
    flushStats(httpMock);
    expect(component.studentCount).toBe(87);
  });

  it('should return total logins from advancedStats', () => {
    fixture.detectChanges();
    flushStats(httpMock, { totalLogins: 200, avgLoginsPerUser: 2 });
    expect(component.totalLogins).toBe(200);
  });

  it('should return green for high retention', () => {
    fixture.detectChanges();
    flushStats(httpMock);
    expect(component.getRetentionColor(80)).toBe('#28a745');
  });

  it('should return yellow for medium retention', () => {
    fixture.detectChanges();
    flushStats(httpMock);
    expect(component.getRetentionColor(50)).toBe('#ffc107');
  });

  it('should return red for low retention', () => {
    fixture.detectChanges();
    flushStats(httpMock);
    expect(component.getRetentionColor(20)).toBe('#dc3545');
  });

  it('should update selectedPeriod', () => {
    fixture.detectChanges();
    flushStats(httpMock);
    component.changePeriod('month');
    expect(component.selectedPeriod).toBe('month');
  });

  it('should reset role and city filters', () => {
    fixture.detectChanges();
    flushStats(httpMock);
    component.filterRole = 'ADMIN';
    component.filterCity = 'Tunis';
    component.resetFilters();
    expect(component.filterRole).toBe('all');
    expect(component.filterCity).toBe('all');
  });
});
