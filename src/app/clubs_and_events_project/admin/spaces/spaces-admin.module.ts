import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: '', loadComponent: () => import('../../spaces/spaces-list/spaces-list.component').then(c => c.SpacesListComponent) }
    ])
  ]
})
export class SpacesAdminModule { }
