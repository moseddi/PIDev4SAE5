import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { APP_NAVIGATION, BACKOFFICE_NAV } from '../../app-navigation.config';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-backoffice-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="backoffice-wrapper">

      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-logo">
          <div class="logo-circle">⚙️</div>
          <div>
            <span class="logo-text">AdminPanel</span>
            <span class="logo-sub">Backoffice</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <a [routerLink]="backofficeNav.main.route" routerLinkActive="active"
             [class.main]="backofficeNav.main.main" class="nav-item">
            <span class="nav-icon">{{ backofficeNav.main.icon }}</span>
            <span>{{ backofficeNav.main.label }}</span>
          </a>

          @for (group of backofficeNav.groups; track group.title) {
            <div class="nav-dropdown" [class.open]="isDropdownOpen[group.title]" (click)="toggleDropdown(group.title)">
              <div class="nav-dropdown-header">
                <span class="nav-group-title">{{ group.title }}</span>
                <span class="dropdown-arrow" [class.rotated]="isDropdownOpen[group.title]">▼</span>
              </div>
              @if (isDropdownOpen[group.title]) {
                <div class="nav-dropdown-content">
                  @for (item of group.items; track item.route) {
                    <a [routerLink]="item.route" routerLinkActive="active"
                       class="nav-item dropdown-item">
                      <span class="nav-icon">{{ item.icon }}</span>
                      <span>{{ item.label }}</span>
                      @if (item.badge) {
                        <span class="nav-badge cert-badge">{{ item.badge }}</span>
                      }
                      @if (item.liveDot) {
                        <span class="live-dot-sm"></span>
                      }
                    </a>
                  }
                </div>
              }
            </div>
          }
        </nav>

        <div class="sidebar-footer">
          <a [routerLink]="frontOfficeRoot" class="nav-item nav-link-site">
            <span class="nav-icon">🌐</span>
            <span>Voir le site</span>
          </a>
          <span class="version-tag">v1.0.0</span>
        </div>
      </aside>

      <!-- Main area -->
      <div class="main-content">
        <header class="topbar">
          <div class="topbar-left">
            <span class="topbar-logo-sm">⚙️</span>
            <nav class="topbar-breadcrumb" aria-label="fil d'Ariane">
              Backoffice
            </nav>
          </div>
          <div class="topbar-actions">
            <div class="user-chip">
              <span class="user-avatar">A</span>
              <span class="user-label">Administrateur</span>
            </div>
          </div>
        </header>

        <main class="content-area">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }
    .backoffice-wrapper { 
      display:flex; 
      min-height:100vh; 
      background: #F7EDE2; 
      font-family:'Inter',system-ui,sans-serif;
    }

    /* ── Sidebar ── */
    .sidebar {
      width: 256px; 
      flex-shrink:0;
      background: linear-gradient(180deg, #2D5757 0%, #1a3a3a 100%);
      color:#fff; 
      display:flex; 
      flex-direction:column;
      position:fixed; 
      height:100vh; 
      top:0; 
      left:0; 
      z-index:200;
      overflow-y:auto;
      box-shadow: 4px 0 20px rgba(45, 87, 87, 0.15);
    }

    .sidebar-logo {
      display:flex; 
      align-items:center; 
      gap:0.85rem;
      padding:1.5rem 1.25rem 1.25rem;
      border-bottom:1px solid rgba(247, 237, 226, 0.15);
    }
    .logo-circle {
      width:42px; 
      height:42px; 
      border-radius:12px;
      background:linear-gradient(135deg, #F7EDE2, #e8d4c0);
      display:flex; 
      align-items:center; 
      justify-content:center;
      font-size:1.25rem; 
      flex-shrink:0;
      color: #2D5757;
    }
    .logo-text { 
      display:block; 
      font-size:1rem; 
      font-weight:800; 
      letter-spacing:0.02em; 
      color: #F7EDE2;
    }
    .logo-sub { 
      display:block; 
      font-size:0.72rem; 
      color:rgba(247, 237, 226, 0.7); 
      text-transform:uppercase; 
      letter-spacing:0.08em; 
    }

    .sidebar-nav { 
      flex:1; 
      padding:1rem 0.75rem; 
      display:flex; 
      flex-direction:column; 
      gap:2px; 
    }
    .nav-group-title { 
      font-size:0.68rem; 
      font-weight:700; 
      color:rgba(247, 237, 226, 0.5); 
      letter-spacing:0.1em; 
      padding:0 0.75rem; 
      margin-top:0.25rem; 
      margin-bottom:0.25rem; 
    }
    .nav-divider { 
      height:1px; 
      background:rgba(247, 237, 226, 0.12); 
      margin:0.5rem 0; 
    }

    /* Dropdown Styles */
    .nav-dropdown {
      margin-bottom: 0.5rem;
    }
    .nav-dropdown-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.65rem 0.85rem;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s ease;
      background: rgba(247, 237, 226, 0.1);
      border: 1px solid rgba(247, 237, 226, 0.2);
    }
    .nav-dropdown-header:hover {
      background: rgba(247, 237, 226, 0.2);
      transform: translateY(-1px);
    }
    .dropdown-arrow {
      font-size: 0.7rem;
      transition: transform 0.3s ease;
      color: rgba(247, 237, 226, 0.7);
    }
    .dropdown-arrow.rotated {
      transform: rotate(180deg);
    }
    .nav-dropdown-content {
      background: rgba(247, 237, 226, 0.05);
      border-radius: 8px;
      margin-top: 0.25rem;
      padding: 0.5rem 0;
      border: 1px solid rgba(247, 237, 226, 0.1);
      animation: slideDown 0.3s ease;
    }
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .dropdown-item {
      padding: 0.5rem 0.85rem;
      margin: 0.25rem 0;
      border-radius: 8px;
      transition: all 0.2s ease;
      background: transparent;
    }
    .dropdown-item:hover {
      background: rgba(247, 237, 226, 0.15);
      transform: translateX(4px);
    }

    .nav-item {
      display:flex; 
      align-items:center; 
      gap:0.75rem;
      padding:0.65rem 0.85rem; 
      border-radius:10px;
      color:rgba(247, 237, 226, 0.8); 
      text-decoration:none;
      font-size:0.88rem; 
      font-weight:500;
      transition:all 0.18s; 
      position:relative;
    }
    .nav-item:hover { 
      background:rgba(247, 237, 226, 0.1); 
      color:#F7EDE2; 
      transform: translateX(2px);
    }
    .nav-item.active {
      background:linear-gradient(135deg, rgba(247, 237, 226, 0.2), rgba(247, 237, 226, 0.15));
      color:#F7EDE2;
      box-shadow:inset 0 0 0 1px rgba(247, 237, 226, 0.3);
    }
    .nav-item.main { 
      font-weight:600; 
    }
    .nav-icon { 
      font-size:1rem; 
      flex-shrink:0; 
      width:20px; 
      text-align:center; 
    }
    .nav-badge { 
      margin-left:auto; 
      font-size:0.65rem; 
      background:rgba(247, 237, 226, 0.2); 
      border:1px solid rgba(247, 237, 226, 0.4); 
      color:#F7EDE2; 
      padding:0.15rem 0.4rem; 
      border-radius:6px; 
      font-weight:700; 
    }
    .live-dot-sm { 
      margin-left:auto; 
      width:7px; 
      height:7px; 
      background:#10b981; 
      border-radius:50%; 
      animation:pulse 1.5s infinite; 
    }
    @keyframes pulse { 
      0%,100%{opacity:1} 
      50%{opacity:0.25} 
    }

    .sidebar-footer { 
      padding:1rem 1.25rem; 
      border-top:1px solid rgba(247, 237, 226, 0.12); 
      display:flex; 
      flex-direction:column; 
      gap:0.5rem; 
    }
    .nav-link-site { 
      margin:0 -0.85rem; 
    }
    .version-tag { 
      font-size:0.72rem; 
      color:rgba(247, 237, 226, 0.4); 
    }

    /* ── Main ── */
    .main-content { 
      flex:1; 
      margin-left:256px; 
      display:flex; 
      flex-direction:column; 
      min-height:100vh; 
    }

    .topbar {
      height:60px; 
      display:flex; 
      align-items:center;
      justify-content:space-between; 
      padding:0 1.75rem;
      background:#fff; 
      border-bottom:1px solid rgba(45, 87, 87, 0.1);
      position:sticky; 
      top:0; 
      z-index:100;
      box-shadow:0 2px 10px rgba(45, 87, 87, 0.08);
    }
    .topbar-left { 
      display:flex; 
      align-items:center; 
      gap:0.75rem; 
    }
    .topbar-logo-sm { 
      font-size:1.2rem; 
      color: #2D5757;
    }
    .topbar-breadcrumb { 
      font-size:0.85rem; 
      color: #2D5757; 
      font-weight:500; 
    }

    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .logout-btn {
      background: rgba(220, 38, 38, 0.1);
      color: #dc2626;
      border: 1px solid rgba(220, 38, 38, 0.2);
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .logout-btn:hover {
      background: rgba(220, 38, 38, 0.2);
    }

    .user-chip {
      display:flex; 
      align-items:center; 
      gap:0.6rem;
      background: #F7EDE2; 
      border:1px solid rgba(45, 87, 87, 0.2);
      padding:0.4rem 0.85rem 0.4rem 0.5rem; 
      border-radius:99px;
      transition: all 0.2s ease;
    }
    .user-chip:hover {
      box-shadow: 0 2px 8px rgba(45, 87, 87, 0.15);
    }
    .user-avatar {
      width:28px; 
      height:28px; 
      border-radius:50%;
      background:linear-gradient(135deg, #2D5757, #1a3a3a);
      color:#F7EDE2; 
      display:flex; 
      align-items:center; 
      justify-content:center;
      font-size:0.78rem; 
      font-weight:800;
    }
    .user-label { 
      font-size:0.82rem; 
      font-weight:600; 
      color: #2D5757; 
    }

    .content-area { 
      flex:1; 
      padding:1.75rem 2rem; 
      background: #F7EDE2;
    }
  `]
})
export class BackofficeLayoutComponent {
  readonly backofficeNav = BACKOFFICE_NAV;
  readonly frontOfficeRoot = APP_NAVIGATION.frontOfficeRoot;

  isDropdownOpen: { [key: string]: boolean } = {};

  constructor(private authService: AuthService, private router: Router) { }

  toggleDropdown(groupTitle: string): void {
    this.isDropdownOpen[groupTitle] = !this.isDropdownOpen[groupTitle];

    // Close other dropdowns when opening a new one
    Object.keys(this.isDropdownOpen).forEach(key => {
      if (key !== groupTitle) {
        this.isDropdownOpen[key] = false;
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
