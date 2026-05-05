
import { ApplicationConfig, APP_INITIALIZER, provideZoneChangeDetection } from '@angular/core';


import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { KeycloakService } from 'keycloak-angular';

import { routes } from './app.routes';
import { AuthService } from './services/auth.service';
import { initializeKeycloak } from './config/keycloak-init';  // Your init file

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    KeycloakService,
    AuthService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService]
    }
  ]
};
