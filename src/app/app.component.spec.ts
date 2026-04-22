import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AppComponent } from './app.component';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { KeycloakService } from 'keycloak-angular';

describe('AppComponent', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let userServiceSpy: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken', 'getUser', 'isLoggedIn']);
    userServiceSpy = jasmine.createSpyObj('UserService', ['preloadUsers', 'clearCache', 'getAllUsers']);
    authServiceSpy.getToken.and.returnValue(null);
    authServiceSpy.getUser.and.returnValue(null);

    const keycloakSpy = jasmine.createSpyObj('KeycloakService', ['logout', 'updateToken', 'getToken', 'init']);

    await TestBed.configureTestingModule({
      imports: [AppComponent, RouterTestingModule, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: KeycloakService, useValue: keycloakSpy }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should not preload users when no token', () => {
    authServiceSpy.getToken.and.returnValue(null);
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(userServiceSpy.preloadUsers).not.toHaveBeenCalled();
  });

  it('should clear cache when token is expired', () => {
    // Create an expired JWT token
    const expiredPayload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) - 3600 }));
    authServiceSpy.getToken.and.returnValue(`header.${expiredPayload}.sig`);
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(userServiceSpy.clearCache).toHaveBeenCalled();
  });
});
