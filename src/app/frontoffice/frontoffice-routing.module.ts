import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./frontoffice-dashboard/frontoffice-dashboard.component').then(c => c.FrontofficeDashboardComponent)
  },
  {
    path: 'clubs',
    loadComponent: () => import('../clubs/clubs-user-list/clubs-user-list.component').then(c => c.ClubsUserListComponent)
  },
  {
    path: 'events',
    loadComponent: () => import('../user/events/events-user.component').then(c => c.EventsUserComponent)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FrontofficeRoutingModule { }
