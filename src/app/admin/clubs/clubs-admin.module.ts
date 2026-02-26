import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: '', loadComponent: () => import('../../clubs/clubs-list/clubs-list.component').then(c => c.ClubsListComponent) }
    ])
  ]
})
export class ClubsAdminModule { }
