import { EventType } from './enums';

export interface Event {
  id: number;
  ID_Event?: number;
  Title: string;
  Type: EventType;
  StartDate: string;
  EndDate: string;
  Manifesto: string;
  MaxParticipants: number;
  Status?: string;
  ID_Club: number;
  EstimatedCost?: number;
}

export interface EventCreateRequest {
  Title: string;
  type: EventType;
  startDate: string;
  endDate: string;
  manifesto: string;
  maxParticipants: number;
  status?: string;
  ID_Club: number;
  estimatedCost: number;
}

export interface EventUpdateRequest {
  Title?: string;
  type?: EventType;
  startDate?: string;
  endDate?: string;
  manifesto?: string;
  maxParticipants?: number;
  status?: string;
  ID_Club?: number;
  estimatedCost?: number;
}

// Backend-compatible interfaces
export interface EventCreateRequestBackend {
  Title: string;
  Type: string;
  StartDate: string;
  EndDate: string;
  Manifesto: string;
  MaxParticipants: number;
  Status: string;
  ID_Club: number;
  EstimatedCost: number;
}

export interface EventUpdateRequestBackend {
  Title?: string;
  Type?: string;
  StartDate?: string;
  EndDate?: string;
  Manifesto?: string;
  MaxParticipants?: number;
  Status?: string;
  ID_Club?: number;
  EstimatedCost?: number;
}
