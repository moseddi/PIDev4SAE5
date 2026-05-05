import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { APP_NAVIGATION, FRONTOFFICE_NAV, FrontOfficeNavItem } from '../../app-navigation.config';
import { AuthService, AppUser } from '../../shared/services/auth.service';
import { NavbarFrontComponent } from '../../../courses/navbar-front/navbar-front.component';
import { NotificationWebSocketService } from '../../backoffice/services/notification-websocket.service';
import { AppNotification } from '../../backoffice/models/notification.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-frontoffice-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, NavbarFrontComponent],
  template: `
    <div class="frontoffice-wrapper">
      <!-- Global Main Navbar from Home -->
      <app-navbar-front></app-navbar-front>

      <!-- Page content -->
      <main class="page-content">
        <router-outlet />
      </main>

      <!-- Footer -->
      <footer class="footer">
        <p>© 2026 CertifyPro — Tous droits réservés.</p>
      </footer>
    </div>
  `,
  styles: [`
    .frontoffice-wrapper {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      font-family: 'Inter', sans-serif;
      background: linear-gradient(135deg, #F7EDE2 0%, #2D5757 100%);
      position: relative;
    }
    
    .frontoffice-wrapper::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        radial-gradient(circle at 20% 50%, rgba(45, 87, 87, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(247, 237, 226, 0.2) 0%, transparent 50%),
        radial-gradient(circle at 40% 20%, rgba(45, 87, 87, 0.05) 0%, transparent 50%);
      pointer-events: none;
      z-index: 0;
    }
    
    /* Content */
    .page-content { 
      flex: 1; 
      position: relative;
      z-index: 1;
      padding-top: 80px; /* Offset for global fixed navbar */
    }
    
    /* Footer */
    .footer {
      text-align: center;
      padding: 2rem;
      color: #2D5757;
      font-size: 0.9rem;
      border-top: 2px solid rgba(45, 87, 87, 0.1);
      background: rgba(247, 237, 226, 0.8);
      backdrop-filter: blur(10px);
      position: relative;
      z-index: 1;
    }
    .footer::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 60px;
      height: 3px;
      background: linear-gradient(135deg, #2D5757, #1a3a3a);
      border-radius: 2px;
    }
  `]
})
export class FrontofficeLayoutComponent implements OnInit, OnDestroy {
  readonly frontNav = FRONTOFFICE_NAV;
  readonly frontOfficeRoot = APP_NAVIGATION.frontOfficeRoot;
  readonly backOfficeRoot = APP_NAVIGATION.backOfficeRoot;

  showNotifMenu = false;
  unreadNotifs: AppNotification[] = [];
  private subscriptions: Subscription[] = [];

  get currentUser(): AppUser | null {
    return this.auth.getCurrentUser();
  }

  get canAccessBackoffice(): boolean {
    const role = this.currentUser?.role as string | undefined;
    return role === 'ADMIN' || role === 'TUTOR';
  }

  constructor(
    private auth: AuthService, 
    private router: Router,
    private notifSvc: NotificationWebSocketService
  ) {}

  ngOnInit(): void {
    // Listen to job offers (career) notifications
    this.subscriptions.push(
      this.notifSvc.getCareerUpdates().subscribe({
        next: (notif) => {
          if (notif) {
            this.unreadNotifs.unshift(notif);
          }
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleNotifMenu(): void {
    this.showNotifMenu = !this.showNotifMenu;
  }

  markAllAsRead(): void {
    this.unreadNotifs = [];
    this.showNotifMenu = false;
  }

  goToOffer(notif: AppNotification): void {
    // Remove individual notification
    this.unreadNotifs = this.unreadNotifs.filter(n => n !== notif);
    this.showNotifMenu = false;
    
    // Redirect to job offers page
    this.router.navigate(['/assessment/frontoffice/recruitment']);
  }

  formatTime(timestamp: string): string {
    if (!timestamp) return 'Récemment';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return timestamp;
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timestamp;
    }
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}

