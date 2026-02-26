import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', loadComponent: () => import('./events-list/events-list.component').then(c => c.EventsListComponent) },
  { path: 'create', loadComponent: () => import('./event-form/event-form.component').then(c => c.EventFormComponent) },
  { path: 'edit/:id', loadComponent: () => import('./event-form/event-form.component').then(c => c.EventFormComponent) },
  { path: ':id', loadComponent: () => import('./event-details/event-details.component').then(c => c.EventDetailsComponent) }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EventsRoutingModule { }
