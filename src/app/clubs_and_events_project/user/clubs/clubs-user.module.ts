import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: '', loadComponent: () => import('./clubs-user-list/clubs-user-list.component').then(c => c.ClubsUserListComponent) }
    ])
  ]
})
export class ClubsUserModule { }
