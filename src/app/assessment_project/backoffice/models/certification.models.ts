// ─── Enums ────────────────────────────────────────────────────────────────────

export enum Level {
    A1 = 'A1',
    A2 = 'A2',
    B1 = 'B1',
    B2 = 'B2',
    C1 = 'C1',
    C2 = 'C2',
}

// 🟢 Aligné avec l'enum Java
export enum QuestionType {
    MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
    TRUE_FALSE = 'TRUE_FALSE',
    OPEN = 'OPEN'
}


// ─── Entities ─────────────────────────────────────────────────────────────────

export interface Certification {
    id?: number;
    title: string;
    level: Level;
    description: string;
    passingScore: number;
    duration?: number;
    minScore?: number;
    questionCount?: number;
    isActive?: boolean;
    createdBy?: number;
    exams?: CertificationExam[];
}

export interface CertificationExam {
    id?: number;
    duration: number;               // minutes
    certification?: Certification;
    certificationId?: number;
    certification_id?: number;      // snake_case pour l'API
    title?: string;
    questions?: Question[];
}

export interface Question {
    id?: number;
    exam_id?: number;
    content: string;
    type: QuestionType;
    exam?: CertificationExam;
    examId?: number;
}

export interface Answer {
    id?: number;
    content: string;
    correct: boolean;
    question?: Question;
    questionId?: number;
}

export interface CertificationResult {
    id?: number;
    score: number;
    passed: boolean;
    userId: number;
    certificationId?: number;
    certification?: Certification;
    certificationExam?: { id?: number; title?: string; duration?: number };
    createdAt?: string;
}

export interface Certificate {
    id?: number;
    userId: number;
    certificateName: string;
    level: string;
    dateIssued?: string;
}

// ─── API Response wrapper ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
    data: T;
    message?: string;
    success: boolean;
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
    totalCertifications: number;
    totalExams: number;
    totalQuestions: number;
    totalResults: number;
    passRate: number;
}
