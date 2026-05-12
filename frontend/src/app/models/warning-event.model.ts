/** Matches backend WarningEventDto (JSON). */
export interface WarningEvent {
  id: string;
  timestamp: string;
  source: string;
  severity: string;
  messages: string[];
  seanceId?: number | null;
}
