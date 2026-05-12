import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MyApplicationsComponent } from './my-applications.component';
import { ApplicationService } from '../services/application.service';
import { NotificationWebSocketService } from '../assessment_project/backoffice/services/notification-websocket.service';
import { of, Subject } from 'rxjs';
import { ApplicationStatus } from '../models/application.models';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('MyApplicationsComponent', () => {
  let component: MyApplicationsComponent;
  let fixture: ComponentFixture<MyApplicationsComponent>;
  let applicationServiceSpy: jasmine.SpyObj<ApplicationService>;
  let notifServiceSpy: jasmine.SpyObj<NotificationWebSocketService>;

  const mockApplications = [
    { id: 1, jobOfferId: 101, status: ApplicationStatus.PENDING, createdAt: '2026-05-01' }
  ];

  beforeEach(async () => {
    const appSpy = jasmine.createSpyObj('ApplicationService', ['getMyApplications']);
    const wsSpy = jasmine.createSpyObj('NotificationWebSocketService', ['getCareerUpdates']);

    appSpy.getMyApplications.and.returnValue(of(mockApplications));
    wsSpy.getCareerUpdates.and.returnValue(new Subject());

    await TestBed.configureTestingModule({
      imports: [MyApplicationsComponent, HttpClientTestingModule],
      providers: [
        { provide: ApplicationService, useValue: appSpy },
        { provide: NotificationWebSocketService, useValue: wsSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MyApplicationsComponent);
    component = fixture.componentInstance;
    applicationServiceSpy = TestBed.inject(ApplicationService) as jasmine.SpyObj<ApplicationService>;
    notifServiceSpy = TestBed.inject(NotificationWebSocketService) as jasmine.SpyObj<NotificationWebSocketService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load applications on init', () => {
    fixture.detectChanges(); // triggers ngOnInit
    expect(applicationServiceSpy.getMyApplications).toHaveBeenCalled();
    expect(component.applications.length).toBe(1);
  });

  it('should poll for updates every 5 seconds', fakeAsync(() => {
    fixture.detectChanges(); // ngOnInit
    applicationServiceSpy.getMyApplications.calls.reset();

    tick(5000); // Wait 5 seconds
    expect(applicationServiceSpy.getMyApplications).toHaveBeenCalledTimes(1);

    tick(5000); // Wait another 5 seconds
    expect(applicationServiceSpy.getMyApplications).toHaveBeenCalledTimes(2);

    component.ngOnDestroy(); // Cleanup
  }));
});
