import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BehaviorSubject } from 'rxjs';
import { AlertsPageComponent } from './alerts-page.component';
import { AlertsLiveService } from '../../../core/services/alerts-live.service';

describe('AlertsPageComponent', () => {
  let component: AlertsPageComponent;
  let fixture: ComponentFixture<AlertsPageComponent>;
  let alertsServiceSpy: jasmine.SpyObj<AlertsLiveService>;

  beforeEach(async () => {
    alertsServiceSpy = jasmine.createSpyObj('AlertsLiveService', [
      'start', 'clearServerHistory', 'isRead', 'markAsRead', 'markAllAsRead'
    ]);
    (alertsServiceSpy as any).connectionStatus$ = new BehaviorSubject('disconnected');
    (alertsServiceSpy as any).events$ = new BehaviorSubject([]);
    (alertsServiceSpy as any).unreadCount$ = new BehaviorSubject(0);
    alertsServiceSpy.isRead.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [AlertsPageComponent, HttpClientTestingModule],
      providers: [{ provide: AlertsLiveService, useValue: alertsServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(AlertsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call alerts.start on init', () => {
    expect(alertsServiceSpy.start).toHaveBeenCalled();
  });

  describe('formatTime', () => {
    it('should return empty string for empty input', () => {
      expect(component.formatTime('')).toBe('');
    });

    it('should format a valid ISO date', () => {
      const result = component.formatTime('2026-05-01T09:00:00.000Z');
      expect(result).toBeTruthy();
    });

    it('should return iso string on invalid date', () => {
      const result = component.formatTime('not-a-date');
      expect(result).toBeTruthy();
    });
  });

  describe('sourceLabel', () => {
    it('should return Session for SESSION', () => {
      expect(component.sourceLabel('SESSION')).toBe('Session');
    });

    it('should return Matériel for MATERIAL', () => {
      expect(component.sourceLabel('MATERIAL')).toBe('Matériel');
    });

    it('should return Alerte for unknown', () => {
      expect(component.sourceLabel('OTHER')).toBe('OTHER');
    });

    it('should return Alerte for null', () => {
      expect(component.sourceLabel(null)).toBe('Alerte');
    });
  });

  describe('sourceIcon', () => {
    it('should return calendar icon for SESSION', () => {
      expect(component.sourceIcon('SESSION')).toBe('bi-calendar-check');
    });

    it('should return tools icon for MATERIAL', () => {
      expect(component.sourceIcon('MATERIAL')).toBe('bi-tools');
    });

    it('should return bell icon for unknown', () => {
      expect(component.sourceIcon('OTHER')).toBe('bi-bell');
    });
  });

  describe('sourceClass', () => {
    it('should return source-session for SESSION', () => {
      expect(component.sourceClass('SESSION')).toBe('source-session');
    });

    it('should return source-material for MATERIAL', () => {
      expect(component.sourceClass('MATERIAL')).toBe('source-material');
    });

    it('should return source-default for unknown', () => {
      expect(component.sourceClass('OTHER')).toBe('source-default');
    });
  });

  describe('clearHistory', () => {
    it('should call clearServerHistory on confirm', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      component.clearHistory();
      expect(alertsServiceSpy.clearServerHistory).toHaveBeenCalled();
    });

    it('should not call clearServerHistory when cancelled', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.clearHistory();
      expect(alertsServiceSpy.clearServerHistory).not.toHaveBeenCalled();
    });
  });

  describe('isRead / markAsRead / markAllAsRead', () => {
    it('should delegate isRead to service', () => {
      alertsServiceSpy.isRead.and.returnValue(true);
      expect(component.isRead('abc')).toBeTrue();
    });

    it('should delegate markAsRead to service', () => {
      component.markAsRead('abc');
      expect(alertsServiceSpy.markAsRead).toHaveBeenCalledWith('abc');
    });

    it('should delegate markAllAsRead to service', () => {
      component.markAllAsRead();
      expect(alertsServiceSpy.markAllAsRead).toHaveBeenCalled();
    });
  });
});
