import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { SidebarComponent } from './shared/sidebar/sidebar.component';
import { HeaderComponent } from './shared/header/header.component';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-backoffice',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent],
  templateUrl: './backoffice.component.html',
  styleUrls: ['./backoffice.component.css']
})
export class BackofficeComponent implements OnInit {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Redirect based on user role when accessing root backoffice path
    const currentUrl = this.router.url;
    
    // Only redirect if we're exactly at /backoffice (not at a child route)
    if (currentUrl === '/backoffice') {
      const user = this.authService.getUser();
      
      if (user?.role === 'ADMIN') {
        this.router.navigate(['/backoffice/admin']);
      } else if (user?.role === 'TUTOR') {
        this.router.navigate(['/backoffice/tutor']);
      }
    }
  }
}