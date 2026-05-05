import { KeycloakService } from 'keycloak-angular';

export function initializeKeycloak(keycloak: KeycloakService) {
  return () =>
    keycloak.init({
      config: {
        url: 'http://localhost:6083',
        realm: 'myapp2',
        clientId: 'angular-app'
      },
      initOptions: {
        onLoad: 'check-sso',
        checkLoginIframe: false
        // REMOVE silentCheckSsoRedirectUri completely
      },
      enableBearerInterceptor: false,
      bearerExcludedUrls: ['/assets']
    });
}