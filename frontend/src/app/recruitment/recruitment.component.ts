import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobOffersPublicComponent } from '../job-offers/job-offers-public.component';
import { MyApplicationsComponent } from '../my-applications/my-applications.component';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-recruitment',
  standalone: true,
  imports: [CommonModule, JobOffersPublicComponent, MyApplicationsComponent],
  template: `
    <div class="recruitment-container">
      <!-- On affiche les offres d'emploi par défaut -->
      @if (view === 'offers') {
        <app-job-offers-public (onViewApplications)="setView('applications')"></app-job-offers-public>
      }

      <!-- On affiche mes candidatures -->
      @if (view === 'applications') {
        <app-my-applications (onViewOffers)="setView('offers')"></app-my-applications>
      }
    </div>
  `,
  styles: [`
    .recruitment-container {
      min-height: 100vh;
      background: #f8fafc;
    }
  `]
})
export class RecruitmentComponent {
  view: 'offers' | 'applications' = 'offers';
  isLoggedIn = false;

  constructor(private auth: AuthService) {
    this.isLoggedIn = this.auth.isLoggedIn();
  }

  setView(v: 'offers' | 'applications') {
    this.view = v;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
