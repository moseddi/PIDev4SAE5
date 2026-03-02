import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', loadComponent: () => import('./spaces-list/spaces-list.component').then(c => c.SpacesListComponent) },
  { path: 'create', loadComponent: () => import('./space-form/space-form.component').then(c => c.SpaceFormComponent) },
  { path: 'edit/:id', loadComponent: () => import('./space-form/space-form.component').then(c => c.SpaceFormComponent) },
  { path: ':id', loadComponent: () => import('./space-details/space-details.component').then(c => c.SpaceDetailsComponent) }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SpacesRoutingModule { }
