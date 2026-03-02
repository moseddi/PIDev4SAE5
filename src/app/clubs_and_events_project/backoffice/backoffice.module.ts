import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BackofficeRoutingModule } from './backoffice-routing.module';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    BackofficeRoutingModule
  ]
})
export class BackofficeModule { }
