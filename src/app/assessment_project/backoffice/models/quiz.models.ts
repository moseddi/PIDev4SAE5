export enum GameStatus {
    // Backend values (quiz-service)
    WAITING = 'WAITING',
    STARTED = 'STARTED',
    FINISHED = 'FINISHED',
    // Legacy aliases
    PLANNING = 'PLANNING',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

export interface Quiz {
    id?: number;
    title: string;
    description: string;
    createdBy: number;
    questions?: QuizQuestion[];
    sessions?: GameSession[];
}

export interface QuizQuestion {
    id?: number;
    content: string;
    timeLimit: number;
    quiz: Quiz;
    quizId?: number;
    options?: string;
    answers?: QuizAnswer[];
}

export interface QuizAnswer {
    id?: number;
    content: string;
    isCorrect: boolean;
    question: QuizQuestion;
    questionId?: number;
}

export interface GameSession {
    id?: number;
    startTime: string;
    status: GameStatus;
    quiz: Quiz;
    quizId?: number;
    gamePin?: string;
    currentQuestionIndex?: number;
    scores?: Score[];
}

export interface Score {
    id?: number;
    points: number;
    userId: number;
    username?: string;
    session: GameSession;
    sessionId?: number;
    questionIndex?: number;
}
