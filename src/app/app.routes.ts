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
export const routes: Routes = [
  { path: 'login', component: StudentLoginComponent },
   { path: 'signup', component: SignupComponent },
  { path: 'home', component: HomeComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { 
    path: 'backoffice', 
    component: BackofficeComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ADMIN', 'TUTOR'] }, // Only ADMIN and TUTOR can access
    children: [
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
      },
      
      // Default redirect based on role will be handled in component
      { path: '', redirectTo: 'admin', pathMatch: 'full' }
    ]
  }
];