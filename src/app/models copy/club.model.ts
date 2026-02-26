import { CategoryClub } from './enums';

export interface Club {
  ID_Club: number;
  name: string;
  Status: string;
  CreationDate: string;
  Email_Contact: string;
  Category: CategoryClub;
  budget: number;
}

export interface ClubCreateRequest {
  name: string;
  Status: string;
  Email_Contact: string;
  Category: CategoryClub;
  budget: number;
}

export interface ClubUpdateRequest {
  name?: string;
  Status?: string;
  Email_Contact?: string;
  Category?: CategoryClub;
  budget?: number;
}

// Backend-compatible interfaces with correct field names
export interface ClubCreateRequestBackend {
  name: string;
  Status: string;
  Email_Contact: string;
  Category: string;
  budget: number;
}

export interface ClubUpdateRequestBackend {
  name?: string;
  Status?: string;
  Email_Contact?: string;
  Category?: string;
  budget?: number;
}
