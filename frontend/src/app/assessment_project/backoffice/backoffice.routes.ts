import { Routes } from '@angular/router';

export const backofficeRoutes: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./layout/backoffice-layout.component').then(
                (m) => m.BackofficeLayoutComponent
            ),
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

            // Dashboard
            {
                path: 'dashboard',
                loadComponent: () =>
                    import('./pages/dashboard/dashboard.component').then(
                        (m) => m.DashboardComponent
                    ),
            },

            // Certifications
            {
                path: 'certifications',
                loadComponent: () =>
                    import('./pages/certifications/certification-list.component').then(
                        (m) => m.CertificationListComponent
                    ),
            },
            {
                path: 'certifications/nouveau',
                loadComponent: () =>
                    import('./pages/certifications/certification-form.component').then(
                        (m) => m.CertificationFormComponent
                    ),
            },
            {
                path: 'certifications/modifier/:id',
                loadComponent: () =>
                    import('./pages/certifications/certification-form.component').then(
                        (m) => m.CertificationFormComponent
                    ),
            },

            // Examens
            {
                path: 'exams',
                loadComponent: () =>
                    import('./pages/exams/exam-list.component').then(
                        (m) => m.ExamListComponent
                    ),
            },
            {
                path: 'exams/nouveau',
                loadComponent: () =>
                    import('./pages/exams/exam-form.component').then(
                        (m) => m.ExamFormComponent
                    ),
            },
            {
                path: 'exams/modifier/:id',
                loadComponent: () =>
                    import('./pages/exams/exam-form.component').then(
                        (m) => m.ExamFormComponent
                    ),
            },

            // Questions
            {
                path: 'questions',
                loadComponent: () =>
                    import('./pages/questions/question-list.component').then(
                        (m) => m.QuestionListComponent
                    ),
            },
            {
                path: 'questions/nouveau',
                loadComponent: () =>
                    import('./pages/questions/question-form.component').then(
                        (m) => m.QuestionFormComponent
                    ),
            },
            {
                path: 'questions/modifier/:id',
                loadComponent: () =>
                    import('./pages/questions/question-form.component').then(
                        (m) => m.QuestionFormComponent
                    ),
            },

            // Réponses
            {
                path: 'answers',
                loadComponent: () =>
                    import('./pages/answers/answer-list.component').then(
                        (m) => m.AnswerListComponent
                    ),
            },
            {
                path: 'answers/nouveau',
                loadComponent: () =>
                    import('./pages/answers/answer-form.component').then(
                        (m) => m.AnswerFormComponent
                    ),
            },
            {
                path: 'answers/modifier/:id',
                loadComponent: () =>
                    import('./pages/answers/answer-form.component').then(
                        (m) => m.AnswerFormComponent
                    ),
            },

            // Résultats
            {
                path: 'results',
                loadComponent: () =>
                    import('./pages/results/result-list.component').then(
                        (m) => m.ResultListComponent
                    ),
            },

            // Quizzes
            {
                path: 'quizzes',
                loadComponent: () =>
                    import('./pages/quizzes/quiz-list.component').then(
                        (m) => m.QuizListComponent
                    ),
            },
            {
                path: 'quizzes/nouveau',
                loadComponent: () =>
                    import('./pages/quizzes/quiz-form.component').then(
                        (m) => m.QuizFormComponent
                    ),
            },
            {
                path: 'quizzes/modifier/:id',
                loadComponent: () =>
                    import('./pages/quizzes/quiz-form.component').then(
                        (m) => m.QuizFormComponent
                    ),
            },

            // Game Sessions
            {
                path: 'game-sessions',
                loadComponent: () =>
                    import('./pages/game-sessions/session-list.component').then(
                        (m) => m.SessionListComponent
                    ),
            },
            {
                path: 'game-sessions/:id/control',
                loadComponent: () =>
                    import('./pages/game-sessions/session-control.component').then(
                        (m) => m.SessionControlComponent
                    ),
            },

            // Applications
            {
                path: 'applications',
                loadComponent: () =>
                    import('./pages/applications/application-list.component').then(
                        (m) => m.ApplicationListComponent
                    ),
            },

            // Job Offers
            {
                path: 'job-offers',
                loadComponent: () =>
                    import('./pages/job-offers/job-offer-list.component').then(
                        (m) => m.JobOfferListComponent
                    ),
            },
            {
                path: 'job-offers/nouveau',
                loadComponent: () =>
                    import('./pages/job-offers/job-offer-form.component').then(
                        (m) => m.JobOfferFormComponent
                    ),
            },
            {
                path: 'job-offers/modifier/:id',
                loadComponent: () =>
                    import('./pages/job-offers/job-offer-form.component').then(
                        (m) => m.JobOfferFormComponent
                    ),
            },

            // ── Assessment Examens (assessment-service port 8088) ──────────────
            {
                path: 'assessment-exams',
                loadComponent: () =>
                    import('./pages/assessment-exams/assessment-exam-list.component').then(
                        (m) => m.AssessmentExamListComponent
                    ),
            },
            {
                path: 'assessment-exams/nouveau',
                loadComponent: () =>
                    import('./pages/assessment-exams/assessment-exam-form.component').then(
                        (m) => m.AssessmentExamFormComponent
                    ),
            },
            {
                path: 'assessment-exams/modifier/:id',
                loadComponent: () =>
                    import('./pages/assessment-exams/assessment-exam-form.component').then(
                        (m) => m.AssessmentExamFormComponent
                    ),
            },
            {
                path: 'assessment-exams/questions/:id',
                loadComponent: () =>
                    import('./pages/assessment-exams/assessment-exam-questions.component').then(
                        (m) => m.AssessmentExamQuestionsComponent
                    ),
            },
            {
                path: 'assessment-exams/notes/:id',
                loadComponent: () =>
                    import('./pages/assessment-exams/assessment-grade-entry.component').then(
                        (m) => m.AssessmentGradeEntryComponent
                    ),
            },

            // ── Canaux & Communication ────────────────────────────────────────
            {
                path: 'admin/channels',
                loadComponent: () =>
                    import('./pages/channels/channel-admin-list.component').then(
                        (m) => m.ChannelAdminListComponent
                    ),
            },
            {
                path: 'admin/channels/:id',
                loadComponent: () =>
                    import('./pages/channels/channel-admin-detail.component').then(
                        (m) => m.ChannelAdminDetailComponent
                    ),
            },
        ],
    },
];

