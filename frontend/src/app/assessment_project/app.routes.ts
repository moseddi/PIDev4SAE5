import { Routes } from '@angular/router';
import { adminGuard, playerGuard } from './shared/guards/auth.guard';
import { StudentLoginComponent } from '../student-login/student-login.component';
import { SignupComponent } from '../signup/signup.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
    },
    {
        path: 'login',
        component: StudentLoginComponent
    },
    {
        path: 'register',
        component: SignupComponent
    },
    // Quiz game routes — public, no login required (anyone can join a live game)
    {
        path: 'frontoffice/quiz/live',
        loadComponent: () =>
            import('./frontoffice/pages/quiz/quiz-join.component').then(
                (m) => m.QuizJoinComponent
            ),
    },
    {
        path: 'frontoffice/quiz/play/:id',
        loadComponent: () =>
            import('./frontoffice/pages/quiz/quiz-play.component').then(
                (m) => m.QuizPlayComponent
            ),
    },
    {
        path: 'frontoffice',
        canActivate: [playerGuard],
        loadChildren: () =>
            import('./frontoffice/frontoffice.routes').then(
                (m) => m.frontofficeRoutes
            ),
    },
    {
        path: 'backoffice',
        canActivate: [adminGuard],
        loadChildren: () =>
            import('./backoffice/backoffice.routes').then(
                (m) => m.backofficeRoutes
            ),
    },
    {
        path: '**',
        redirectTo: 'login',
    },
];
