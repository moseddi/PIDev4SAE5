export interface ClubRegistration {
  IdCR: number;
  Date_Inscription: string;
  Status: string;
  User_Id: number;
  Club_Id: number;
  FullName?: string;
  Email?: string;
  Phone?: string;
  StudentId?: string;
  YearOfStudy?: string;
  Motivation?: string;
  Skills?: string;
  TermsAccepted?: boolean;
}

export interface ClubRegistrationCreateRequest {
  Status: string;
  User_Id: number;
  Club_Id: number;
  FullName?: string;
  Email?: string;
  Phone?: string;
  StudentId?: string;
  YearOfStudy?: string;
  Motivation?: string;
  Skills?: string;
  TermsAccepted?: boolean;
  Date_Inscription?: string;
}

export interface ClubRegistrationUpdateRequest {
  Status?: string;
  User_Id?: number;
  Club_Id?: number;
  FullName?: string;
  Email?: string;
  Phone?: string;
  StudentId?: string;
  YearOfStudy?: string;
  Motivation?: string;
  Skills?: string;
  TermsAccepted?: boolean;
}
