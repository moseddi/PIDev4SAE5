import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertsLiveService } from '../../../core/services/alerts-live.service';
@Component({
  selector: 'app-alerts-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alerts-page.component.html',
  styleUrl: './alerts-page.component.css',
})
export class AlertsPageComponent implements OnInit {
  private readonly alerts = inject(AlertsLiveService);
  readonly connectionStatus$ = this.alerts.connectionStatus$;
  readonly events$ = this.alerts.events$;
  readonly unreadCount$ = this.alerts.unreadCount$;

  ngOnInit(): void {
    this.alerts.start();
  }

  formatTime(iso: string): string {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  sourceLabel(source: string | null | undefined): string {
    const normalized = (source ?? '').trim().toUpperCase();
    if (normalized === 'SESSION') return 'Session';
    if (normalized === 'MATERIAL') return 'Matériel';
    return source?.trim() || 'Alerte';
  }

  sourceIcon(source: string | null | undefined): string {
    const normalized = (source ?? '').trim().toUpperCase();
    if (normalized === 'SESSION') return 'bi-calendar-check';
    if (normalized === 'MATERIAL') return 'bi-tools';
    return 'bi-bell';
  }

  sourceClass(source: string | null | undefined): string {
    const normalized = (source ?? '').trim().toUpperCase();
    if (normalized === 'SESSION') return 'source-session';
    if (normalized === 'MATERIAL') return 'source-material';
    return 'source-default';
  }

  clearHistory(): void {
    if (!confirm('Clear all warnings history on the server?')) {
      return;
    }
    this.alerts.clearServerHistory();
  }

  isRead(eventId: string): boolean {
    return this.alerts.isRead(eventId);
  }

  markAsRead(eventId: string): void {
    this.alerts.markAsRead(eventId);
  }

  markAllAsRead(): void {
    this.alerts.markAllAsRead();
  }
}
