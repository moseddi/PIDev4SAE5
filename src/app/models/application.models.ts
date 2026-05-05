// Correspond exactement à l'enum Level du backend
export type Level = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';

export enum ApplicationStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED'
}

export interface JobOffer {
    id?: number;
    title: string;
    description: string;
    requiredLevel?: Level;
    active: boolean;
    companyName?: string;
    location?: string;
    contractType?: string;
    salary?: number;
    status?: string;
    publicationDate?: string;   // LocalDate → ISO string "YYYY-MM-DD"
    expirationDate?: string;
    createdBy?: number;
}

// Correspond au ApplicationResponseDTO du backend
export interface Application {
    id: number;
    userId: number;
    bio: string;
    specialty: string;
    experience: string;
    status: ApplicationStatus;
    createdAt?: string;          // LocalDateTime → ISO string
    jobOffer?: JobOffer;
    jobOfferId?: number;
    jobOfferTitle?: string;
}

// Correspond au ApplicationRequestDTO du backend
export interface ApplicationRequest {
    bio: string;
    specialty: string;
    experience: string;
    jobOfferId: number;
}
