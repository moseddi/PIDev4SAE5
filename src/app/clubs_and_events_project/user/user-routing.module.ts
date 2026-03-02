import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./user-dashboard/user-dashboard.component').then(c => c.UserDashboardComponent),
    children: [
      { path: 'clubs', loadComponent: () => import('../clubs/clubs-list/clubs-list.component').then(c => c.ClubsListComponent) },
      { path: 'events', loadComponent: () => import('../events/events-list/events-list.component').then(c => c.EventsListComponent) },
      { path: 'spaces', loadComponent: () => import('../spaces/spaces-list/spaces-list.component').then(c => c.SpacesListComponent) }
    ]
  }
];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
