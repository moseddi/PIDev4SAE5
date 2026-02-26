import { SpaceType } from './enums';

export interface PhysicalSpace {
  IdPhysicalSpace: number;
  Code: string;
  Name: string;
  Type: SpaceType;
  Capacity: number;
  Location: string;
  Max_Participants: number;
  Status: string;
  Equipment: string[];
}

export interface PhysicalSpaceCreateRequest {
  Code: string;
  Name: string;
  Type: SpaceType;
  Capacity: number;
  Location: string;
  Max_Participants: number;
  Status: string;
  Equipment: string[];
}

export interface PhysicalSpaceUpdateRequest {
  Code?: string;
  Name?: string;
  Type?: SpaceType;
  Capacity?: number;
  Location?: string;
  Max_Participants?: number;
  Status?: string;
  Equipment?: string[];
}
