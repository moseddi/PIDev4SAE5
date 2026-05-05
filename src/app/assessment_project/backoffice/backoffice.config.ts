import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { backofficeRoutes } from './backoffice.routes';
import { CertificationService } from './services/certification.service';

export const backofficeConfig: ApplicationConfig = {
  providers: [
    provideRouter(backofficeRoutes),
    provideHttpClient(),
    CertificationService
  ]
};
