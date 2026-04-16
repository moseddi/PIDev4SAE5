 import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { StudentLoginComponent } from './student-login/student-login.component';
import { SignupComponent } from './signup/signup.component';
import { BackofficeComponent } from './backoffice/backoffice.component';
import { AdminViewComponent } from './backoffice/admin-view/admin-view.component';
import { TutorViewComponent } from './backoffice/tutor-view/tutor-view.component';
import { UsersComponent } from './backoffice/admin-view/users/users.component';
import { StatsComponent } from './backoffice/admin-view/stats/stats.component';
import { MyStudentsComponent } from './backoffice/tutor-view/my-students/my-students.component';
import { ScheduleComponent } from './backoffice/tutor-view/schedule/schedule.component';
import { RoleGuard } from './guards/role.guard';
import { EventsComponent } from './backoffice/admin-view/events/events.component';
import { ClubsComponent } from './backoffice/admin-view/clubs/clubs.component';
import { ClassesListComponent } from './features/classes/classes-list/classes-list.component';
import { PhysicalspaceComponent } from './backoffice/admin-view/physicalspace/physicalspace.component';
import { AuthGuard } from './guards/auth.guard';

import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
 import { ReactivationComponent } from './reactivation/reactivation.component';
 import { UnblockComponent } from './unblock/unblock.component';

import { FindCoachComponent } from './coaching/find-coach/find-coach.component';
import { ChatComponent } from './components/chat/chat.component';
import { NotificationsComponent } from './backoffice/admin-view/notifications/notifications.component';




import { CourseListComponent } from './courses/course-list/course-list.component';
import { ListeCoursStudentComponent } from './courses/liste-cours-student/liste-cours-student.component';

import { CourseFormComponent } from './courses/course-form/course-form.component';
import { LessonListComponent } from './courses/lesson-list/lesson-list.component';
import { LessonFormComponent } from './courses/lesson-form/lesson-form.component';

import { SeanceListComponent } from './coaching/seance-list/seance-list.component';
import { SeanceFormComponent } from './coaching/seance-form/seance-form.component';
import { ReservationListComponent } from './coaching/reservation-list/reservation-list.component';
import { ReservationFormComponent } from './coaching/reservation-form/reservation-form.component';
import { AdminReservationsComponent } from './backoffice/admin-view/admin-reservations/admin-reservations.component';
import { NavbarFrontComponent } from './courses/navbar-front/navbar-front.component';
import { ListLessonComponent } from './courses/list-lesson/list-lesson.component';
import { ListLessonStudentComponent } from './courses/list-lesson-student/list-lesson-student.component';
import { FooterFrontComponent } from './courses/footer-front/footer-front.component';
import { SeancesListComponent } from './features/seances/seances-list/seances-list.component';
import { SallesListComponent } from './features/salles/salles-list/salles-list.component';
import { MaterielsListComponent } from './features/materiels/materiels-list/materiels-list.component';
import { AlertsPageComponent } from './features/alerts/alerts-page/alerts-page.component';












export const routes: Routes = [
  { path: 'login', component: StudentLoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'home', component: HomeComponent },

  { path: 'nav', component: NavbarFrontComponent },
  { path: 'fot', component: FooterFrontComponent },

  // Student Course routes
  { path: 'cours', component: ListeCoursStudentComponent },
  { path: 'cours/:courseId/lessons', component: ListLessonStudentComponent },
  
  // Course routes
  { path: 'courses', component: CourseListComponent },
  { path: 'courses/new', component: CourseFormComponent },
  { path: 'courses/edit/:id', component: CourseFormComponent },

  // Lesson routes
  { path: 'courses/:courseId/lessons', component: LessonListComponent },
  { path: 'courses/:courseId/lessons/new', component: LessonFormComponent },
  { path: 'lessons/edit/:id', component: LessonFormComponent },

  // Coaching Seance routes
  { path: 'seances', component: SeanceListComponent },
  { path: 'seances/new', component: SeanceFormComponent },
  { path: 'seances/edit/:id', component: SeanceFormComponent },

  // Coaching Reservation routes
  { path: 'seances/:seanceId/reservations', component: ReservationListComponent },
  { path: 'seances/:seanceId/reservations/new', component: ReservationFormComponent },
  { path: 'reservations', component: ReservationListComponent },
  { path: 'reservations/edit/:id', component: ReservationFormComponent },

  // Find Coach route
  { path: 'find-coach', component: FindCoachComponent },

  // Chat route
  { path: 'chat', component: ChatComponent },


  { path: '', redirectTo: '/home', pathMatch: 'full' },
   { path: 'forgot-password', component: ForgotPasswordComponent },
   { path: 'reset-password', component: ResetPasswordComponent },
   { path: 'reactivate', component: ReactivationComponent },
     { path: 'admin/unblock/:email', component: UnblockComponent },
  { 
    path: 'backoffice', 
    component: BackofficeComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ADMIN', 'TUTOR'] },
    children: [
      { 
        path: '', 
        component: AdminViewComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'TUTOR'] }
      },
      { 
        path: 'profile-completion', 
        loadComponent: () => import('./profile-completion/profile-completion.component').then(m => m.ProfileCompletionComponent),
        canActivate: [AuthGuard]
      },
      
      // Admin only routes
      { 
        path: 'admin', 
        component: AdminViewComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] }
      },
      { 
        path: 'admin/users', 
        component: UsersComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] }
      },
      { 
        path: 'admin/stats', 
        component: StatsComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] }
      },
      { 
        path: 'admin/events', 
        component: EventsComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] }
      },
      { 
        path: 'admin/clubs', 
        component: ClubsComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] }
      },
      { 
        path: 'admin/classes', 
        component: ClassesListComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'admin/seances',
        component: SeancesListComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'admin/salles',
        component: SallesListComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'admin/materiels',
        component: MaterielsListComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'admin/warnings',
        component: AlertsPageComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'admin/physicalspace',
        component: PhysicalspaceComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] }
      },


      {
        path: 'admin/notifications',
        component: NotificationsComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] }
      },
      { 
        path: 'courses', 
        component: CourseListComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] }
      },
      { 
        path: 'courses/new', 
        component: CourseFormComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] }
      },
      {
        path: 'admin/coaching-reservations',
        component: AdminReservationsComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] }
      },

      
      // Tutor only routes
      { 
        path: 'tutor', 
        component: TutorViewComponent,
        canActivate: [RoleGuard],
        data: { roles: ['TUTOR'] }
      },
      { 
        path: 'tutor/my-students', 
        component: MyStudentsComponent,
        canActivate: [RoleGuard],
        data: { roles: ['TUTOR'] }
      },
     
      { 
        path: 'tutor/schedule', 
        component: ScheduleComponent,
        canActivate: [RoleGuard],
        data: { roles: ['TUTOR'] }
      }
    ]
  }
];