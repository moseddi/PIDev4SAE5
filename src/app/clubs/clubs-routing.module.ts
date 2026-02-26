import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', loadComponent: () => import('./clubs-list/clubs-list.component').then(c => c.ClubsListComponent) },
  { path: 'create', loadComponent: () => import('./club-form/club-form.component').then(c => c.ClubFormComponent) },
  { path: 'edit/:id', loadComponent: () => import('./club-form/club-form.component').then(c => c.ClubFormComponent) },
  { path: ':id', loadComponent: () => import('./club-details/club-details.component').then(c => c.ClubDetailsComponent) }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClubsRoutingModule { }
