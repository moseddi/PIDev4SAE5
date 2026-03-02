import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FrontofficeRoutingModule } from './frontoffice-routing.module';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FrontofficeRoutingModule
  ]
})
export class FrontofficeModule { }
