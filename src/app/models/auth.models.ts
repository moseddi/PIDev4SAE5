export enum Role {
  STUDENT = 'STUDENT',
  TUTOR = 'TUTOR',
  ADMIN = 'ADMIN'
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  role?: Role;
}

export interface AuthResponse {
  token: string;
  email: string;
  role: Role;
  userId: number;
  message?: string;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName?: string;
  phoneNumber?: string;
  role: Role;
  password: string;
  createdBy?: string;
}

 export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;    // ← ADD THIS
  address?: string;        // ← ADD THIS
  city?: string;           // ← ADD THIS
  country?: string;        // ← ADD THIS
  role?: Role;
  active?: boolean;
}

export interface UserProfileDTO {
  id: number;
  email: string;
  firstName: string;
  lastName?: string;
  phoneNumber?: string;
  role: Role;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  accountCreatedAt?: string;
  lastActivityAt?: string;
  active: boolean;
  loginCount?: number;
  createdBy?: string;
}