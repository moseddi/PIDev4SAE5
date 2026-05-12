import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/environment';
import { WarningEvent } from '../../models';

/**
 * Loads recent alerts via REST (classe-seance), then subscribes to /topic/warnings on:
 * - classe-seance (SockJS + STOMP)
 * - salles-materiels (same topic; material CRUD warnings originate there)
 */
@Injectable({ providedIn: 'root' })
export class AlertsLiveService {
  private client: Client | null = null;
  private materielClient: Client | null = null;
  private loadSub: Subscription | null = null;
  /** Live feeds started once (layout). */
  private liveFeedStarted = false;
  private readonly readStorageKey = 'warnings.read.ids.v1';
  private readonly readIds = new Set<string>(this.loadReadIds());

  readonly connectionStatus$ = new BehaviorSubject<'disconnected' | 'connecting' | 'connected'>('disconnected');
  readonly events$ = new BehaviorSubject<WarningEvent[]>([]);
  readonly unreadCount$ = new BehaviorSubject<number>(0);

  constructor(private http: HttpClient) {}

  /**
   * Loads history from REST (always). Starts SockJS/STOMP to classe-seance and salles-materiels.
   */
  start(): void {
    this.refreshHistoryFromServer();
    if (this.liveFeedStarted) {
      return;
    }
    this.liveFeedStarted = true;
    this.connectClasseSeanceWebSocket();
    this.connectSallesMaterielsWebSocket();
  }

  /** Re-fetches server history only (e.g. after reconnect). */
  refreshHistoryFromServer(): void {
    this.loadSub?.unsubscribe();
    this.loadSub = this.http.get<WarningEvent[]>(`${environment.apiClasseSeance}/api/warnings`).subscribe({
      next: (list) => this.setEvents(list ?? []),
      error: () => this.setEvents([]),
    });
  }

  stopLiveFeed(): void {
    this.liveFeedStarted = false;
    this.loadSub?.unsubscribe();
    this.loadSub = null;
    this.disconnect();
  }

  clearServerHistory(): void {
    this.http.delete<{ cleared: boolean }>(`${environment.apiClasseSeance}/api/warnings`).subscribe({
      next: () => this.setEvents([]),
    });
  }

  isRead(eventId: string): boolean {
    return this.readIds.has(eventId);
  }

  markAsRead(eventId: string): void {
    if (!eventId || this.readIds.has(eventId)) {
      return;
    }
    this.readIds.add(eventId);
    this.persistReadIds();
    this.recomputeUnreadCount();
  }

  markAllAsRead(): void {
    let changed = false;
    for (const ev of this.events$.value) {
      if (!this.readIds.has(ev.id)) {
        this.readIds.add(ev.id);
        changed = true;
      }
    }
    if (changed) {
      this.persistReadIds();
      this.recomputeUnreadCount();
    }
  }

  /**
   * Push warnings via classe-seance HTTP ingest (e.g. legacy callers). Prefer server-side publish from salles-materiels when possible.
   */
  ingestExternalWarnings(source: string, messages: string[] | undefined | null): void {
    if (!messages?.length) {
      return;
    }
    this.http
      .post<{ accepted: boolean }>(`${environment.apiClasseSeance}/api/warnings/ingest`, {
        source,
        messages,
      })
      .subscribe({ error: () => {} });
  }

  private connectClasseSeanceWebSocket(): void {
    this.disconnectClasseSeance();
    this.connectionStatus$.next('connecting');

    const wsUrl = `${environment.apiClasseSeance}/ws`;
    const client = new Client({
      reconnectDelay: 5000,
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,
      webSocketFactory: () => new SockJS(wsUrl) as unknown as WebSocket,
    });

    client.onConnect = () => {
      this.connectionStatus$.next('connected');
      client.subscribe('/topic/warnings', (message: IMessage) => {
        try {
          const ev = JSON.parse(message.body) as WarningEvent;
          this.prependEvent(ev);
        } catch {
          /* ignore */
        }
      });
    };

    client.onStompError = () => this.connectionStatus$.next('disconnected');
    client.onWebSocketClose = () => this.connectionStatus$.next('disconnected');

    try {
      client.activate();
      this.client = client;
    } catch {
      this.connectionStatus$.next('disconnected');
      this.liveFeedStarted = false;
    }
  }

  /** Second STOMP connection to salles-materiels (material warnings). */
  private connectSallesMaterielsWebSocket(): void {
    this.disconnectMateriel();
    const wsUrl = `${environment.apiSallesMateriels}/ws`;
    const client = new Client({
      reconnectDelay: 8000,
      heartbeatIncoming: 0,
      heartbeatOutgoing: 0,
      webSocketFactory: () => new SockJS(wsUrl) as unknown as WebSocket,
    });

    client.onConnect = () => {
      client.subscribe('/topic/warnings', (message: IMessage) => {
        try {
          const ev = JSON.parse(message.body) as WarningEvent;
          this.prependEvent(ev);
        } catch {
          /* ignore */
        }
      });
    };

    try {
      client.activate();
      this.materielClient = client;
    } catch {
      /* optional feed */
    }
  }

  private prependEvent(ev: WarningEvent): void {
    const current = this.events$.value;
    if (current.some((e) => e.id === ev.id)) {
      return;
    }
    if (this.isNearDuplicateMaterialWarning(ev, current)) {
      return;
    }
    this.setEvents([ev, ...current]);
  }

  /** Same MATERIAL payload often arrives from salles-materiels WS then classe-seance WS after server ingest. */
  private isNearDuplicateMaterialWarning(ev: WarningEvent, current: WarningEvent[]): boolean {
    if (ev.source !== 'MATERIAL') {
      return false;
    }
    const sig = JSON.stringify(ev.messages ?? []);
    const tNew = Date.parse(ev.timestamp);
    if (Number.isNaN(tNew)) {
      return false;
    }
    return current.slice(0, 20).some((e) => {
      if (e.source !== 'MATERIAL') {
        return false;
      }
      const tOld = Date.parse(e.timestamp);
      if (Number.isNaN(tOld)) {
        return false;
      }
      return JSON.stringify(e.messages ?? []) === sig && Math.abs(tNew - tOld) < 10000;
    });
  }

  private setEvents(nextEvents: WarningEvent[]): void {
    this.events$.next(nextEvents);
    this.pruneReadIds(nextEvents);
    this.recomputeUnreadCount();
  }

  private recomputeUnreadCount(): void {
    const unread = this.events$.value.reduce((acc, e) => acc + (this.readIds.has(e.id) ? 0 : 1), 0);
    this.unreadCount$.next(unread);
  }

  private pruneReadIds(events: WarningEvent[]): void {
    const ids = new Set(events.map((e) => e.id));
    let changed = false;
    for (const id of Array.from(this.readIds)) {
      if (!ids.has(id)) {
        this.readIds.delete(id);
        changed = true;
      }
    }
    if (changed) {
      this.persistReadIds();
    }
  }

  private loadReadIds(): string[] {
    try {
      const raw = localStorage.getItem(this.readStorageKey);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];
      return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
    } catch {
      return [];
    }
  }

  private persistReadIds(): void {
    try {
      localStorage.setItem(this.readStorageKey, JSON.stringify(Array.from(this.readIds)));
    } catch {
      /* ignore storage quota / private mode errors */
    }
  }

  private disconnectClasseSeance(): void {
    if (this.client) {
      try {
        this.client.deactivate();
      } catch {
        /* ignore */
      }
      this.client = null;
    }
  }

  private disconnectMateriel(): void {
    if (this.materielClient) {
      try {
        this.materielClient.deactivate();
      } catch {
        /* ignore */
      }
      this.materielClient = null;
    }
  }

  private disconnect(): void {
    this.disconnectClasseSeance();
    this.disconnectMateriel();
    this.connectionStatus$.next('disconnected');
  }
}
