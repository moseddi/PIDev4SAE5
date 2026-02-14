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
import { CourseListComponent } from './courses/course-list/course-list.component';
import { ClassesComponent } from './backoffice/admin-view/classes/classes.component';
import { PhysicalspaceComponent } from './backoffice/admin-view/physicalspace/physicalspace.component';
export const routes: Routes = [
  { path: 'login', component: StudentLoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'home', component: HomeComponent },
  { path: 'courses', component: CourseListComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  
  { 
    path: 'backoffice', 
    component: BackofficeComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ADMIN', 'TUTOR'] }, // Only ADMIN and TUTOR can access
    children: [
      // Default route - This needs to be fixed
      { 
        path: '', 
        component: AdminViewComponent, // 👈 CHANGE THIS - can't redirect to child with different guard
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN', 'TUTOR'] }
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
        component: ClassesComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] }
      },
      { 
        path: 'admin/physicalspace', 
        component: PhysicalspaceComponent,
        canActivate: [RoleGuard],
        data: { roles: ['ADMIN'] }
      },
     
       
    ]
  }
];