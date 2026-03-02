import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: '', loadComponent: () => import('../../events/events-list/events-list.component').then(c => c.EventsListComponent) }
    ])
  ]
})
export class EventsAdminModule { }
