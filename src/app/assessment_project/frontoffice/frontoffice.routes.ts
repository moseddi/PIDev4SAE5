import { Routes } from '@angular/router';

export const frontofficeRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/frontoffice-layout.component').then(
        (m) => m.FrontofficeLayoutComponent
      ),
    children: [
      {
        path: '',
        redirectTo: 'accueil',
        pathMatch: 'full',
      },
      {
        path: 'accueil',
        loadComponent: () =>
          import('./pages/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'certifications',
        loadComponent: () =>
          import('./pages/certifications/certifications.component').then(
            (m) => m.CertificationsComponent
          ),
      },
      {
        path: 'certifications/:id/examen',
        loadComponent: () =>
          import('./pages/examen/passer-examen.component').then(
            (m) => m.PasserExamenComponent
          ),
      },
      {
        path: 'quiz',
        loadComponent: () =>
          import('./pages/quiz/quiz-list.component').then(
            (m) => m.QuizListComponent
          ),
      },
      {
        path: 'quiz/live',
        loadComponent: () =>
          import('./pages/quiz/quiz-join.component').then(
            (m) => m.QuizJoinComponent
          ),
      },
      {
        path: 'quiz/play/:id',
        loadComponent: () =>
          import('./pages/quiz/quiz-play.component').then(
            (m) => m.QuizPlayComponent
          ),
      },
      {
        path: 'certifications/:id',
        loadComponent: () =>
          import('./pages/certifications/certification-detail.component').then(
            (m) => m.CertificationDetailComponent
          ),
      },
      {
        path: 'mes-resultats',
        loadComponent: () =>
          import('./pages/mes-resultats/mes-resultats.component').then(
            (m) => m.MesResultatsComponent
          ),
      },
      {
        path: 'mes-notes-examen',
        loadComponent: () =>
          import('./pages/mes-notes-examen/mes-notes-examen.component').then(
            (m) => m.MesNotesExamenComponent
          ),
      },
      {
        path: 'examens',
        loadComponent: () =>
          import('./pages/assessment-exam-player-list/assessment-exam-player-list.component').then(
            (m) => m.AssessmentExamPlayerListComponent
          ),
      },
      {
        path: 'examens/:id/passer',
        loadComponent: () =>
          import('./pages/passer-assessment-exam/passer-assessment-exam.component').then(
            (m) => m.PasserAssessmentExamComponent
          ),
      },
      {
        path: 'recruitment',
        loadComponent: () =>
          import('../../recruitment/recruitment.component').then(
            (m) => m.RecruitmentComponent
          ),
      },
      {
        path: 'offres-emploi',
        redirectTo: 'recruitment',
        pathMatch: 'full'
      },
      {
        path: 'mes-candidatures',
        redirectTo: 'recruitment',
        pathMatch: 'full'
      },
      {
        path: 'canaux',
        loadComponent: () =>
          import('./pages/channels/channel-student-list.component').then(
            (m) => m.ChannelStudentListComponent
          ),
      },
      {
        path: 'canaux/:id',
        loadComponent: () =>
          import('./pages/channels/channel-student-view.component').then(
            (m) => m.ChannelStudentViewComponent
          ),
      },
    ],
  },
];
