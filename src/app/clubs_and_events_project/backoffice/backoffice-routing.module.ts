import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./backoffice-dashboard/backoffice-dashboard.component').then(c => c.BackofficeDashboardComponent)
  },
  {
    path: 'clubs',
    loadComponent: () => import('./clubs-management/clubs-management.component').then(c => c.ClubsManagementComponent)
  },
  {
    path: 'clubs/edit/:id',
    loadComponent: () => import('../clubs/club-form/club-form.component').then(c => c.ClubFormComponent)
  },
  {
    path: 'events',
    loadComponent: () => import('../events/events-list/events-list.component').then(c => c.EventsListComponent)
  },
  {
    path: 'events/create',
    loadComponent: () => import('../events/event-form/event-form.component').then(c => c.EventFormComponent)
  },
  {
    path: 'events/:id/edit',
    loadComponent: () => import('../events/event-form/event-form.component').then(c => c.EventFormComponent)
  },
  {
    path: 'events/:id',
    loadComponent: () => import('../events/event-details/event-details.component').then(c => c.EventDetailsComponent)
  },
  {
    path: 'spaces',
    redirectTo: '/admin-spaces',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BackofficeRoutingModule { }
