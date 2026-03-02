import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { UserRoutingModule } from './user-routing.module';
import { UserDashboardComponent } from './user-dashboard/user-dashboard.component';
import { ClubsListComponent } from '../clubs/clubs-list/clubs-list.component';
import { EventsListComponent } from '../events/events-list/events-list.component';
import { SpacesListComponent } from '../spaces/spaces-list/spaces-list.component';

@NgModule({
  declarations: [
    UserDashboardComponent,
    EventsListComponent,
    SpacesListComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    UserRoutingModule,
    ClubsListComponent
  ]
})
export class UserModule { }
