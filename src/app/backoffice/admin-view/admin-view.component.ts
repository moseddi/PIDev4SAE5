import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WebSocketService } from '../../services/websocket.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-view.component.html',
  styleUrls: ['./admin-view.component.css']
})
export class AdminViewComponent implements OnInit, OnDestroy {
  Math = Math;
  totalUsers = 1284 + 24 + 3;

  // Real-time properties
  recentLogins: string[] = [];
  activeSessions = 0;
  suspiciousLogins = 0;
  
  // Filter
  currentFilter: string = 'all';
  
  // Geolocation modal
  showMapModal: boolean = false;
  selectedIp: string = '';
  selectedCountry: string = '';
  selectedCity: string = '';
  selectedLat: string = '';
  selectedLon: string = '';
  selectedDevice: string = '';
  selectedTime: string = '';

  // KPI Cards
  kpis = [
    { icon: 'bi-people', label: 'Total Users', value: '1,284', trend: 12, color: '#2D5757', route: 'users' },
    { icon: 'bi-book', label: 'Courses', value: '156', trend: 8, color: '#17a2b8', route: 'courses' },
    { icon: 'bi-calendar-event', label: 'Events', value: '24', trend: 15, color: '#ffc107', route: 'events' },
    { icon: 'bi-chat-heart', label: 'Clubs', value: '8', trend: -5, color: '#28a745', route: 'clubs' }
  ];

  userSegments = [
    { label: 'Students', value: 1284, percent: 75, color: '#2D5757' },
    { label: 'Tutors', value: 24, percent: 15, color: '#17a2b8' },
    { label: 'Admins', value: 3, percent: 10, color: '#ffc107' }
  ];

  revenueData = [
    { day: 'Mon', value: 45, revenue: 12.5 },
    { day: 'Tue', value: 65, revenue: 18.2 },
    { day: 'Wed', value: 80, revenue: 22.4 },
    { day: 'Thu', value: 70, revenue: 19.6 },
    { day: 'Fri', value: 90, revenue: 25.2 },
    { day: 'Sat', value: 55, revenue: 15.4 },
    { day: 'Sun', value: 40, revenue: 11.2 }
  ];

  quickActions = [
    { icon: 'bi-person-plus', label: 'Add User', route: '/admin/users/new' },
    { icon: 'bi-book-plus', label: 'New Course', route: '/admin/courses/new' },
    { icon: 'bi-calendar-plus', label: 'Create Event', route: '/admin/events/new' },
    { icon: 'bi-chat-plus', label: 'Start Club', route: '/admin/clubs/new' }
  ];

  microserviceActions = [
    {
      icon: 'bi-diagram-3',
      label: 'Classes',
      description: 'CRUD classes',
      route: '/backoffice/admin/classes'
    },
    {
      icon: 'bi-calendar-week',
      label: 'Seances',
      description: 'Planning and session rules',
      route: '/backoffice/admin/seances'
    },
    {
      icon: 'bi-door-open',
      label: 'Salles',
      description: 'Rooms and capacities',
      route: '/backoffice/admin/salles'
    },
    {
      icon: 'bi-tools',
      label: 'Materials',
      description: 'Equipment and assignment',
      route: '/backoffice/admin/materiels'
    },
    {
      icon: 'bi-bell',
      label: 'Warnings',
      description: 'Advanced live alerts',
      route: '/backoffice/admin/warnings'
    }
  ];

  recentUsers = [
    { id: 1, name: 'Sarah Ben Ali', email: 'sarah@email.com', initials: 'SB', color: '#2D5757', role: 'Student', roleColor: '#28a745', status: 'Active' },
    { id: 2, name: 'Ahmed Mansour', email: 'ahmed@email.com', initials: 'AM', color: '#17a2b8', role: 'Tutor', roleColor: '#17a2b8', status: 'Active' },
    { id: 3, name: 'Fatma Chennoufi', email: 'fatma@email.com', initials: 'FC', color: '#28a745', role: 'Student', roleColor: '#28a745', status: 'Inactive' },
    { id: 4, name: 'Mohamed Karray', email: 'mohamed@email.com', initials: 'MK', color: '#ffc107', role: 'Student', roleColor: '#28a745', status: 'Active' },
    { id: 5, name: 'Leila Haddad', email: 'leila@email.com', initials: 'LH', color: '#dc3545', role: 'Tutor', roleColor: '#17a2b8', status: 'Active' }
  ];

  upcomingEvents = [
    { id: 1, title: 'Conversation Club Meetup', day: '15', month: 'MAR', date: 'Mar 15, 2025', location: 'Tunis', isFree: true, color: '#2D5757' },
    { id: 2, title: 'Business English Seminar', day: '22', month: 'MAR', date: 'Mar 22, 2025', location: 'Sousse', isFree: false, color: '#17a2b8' },
    { id: 3, title: 'Art Club Exhibition', day: '05', month: 'APR', date: 'Apr 5, 2025', location: 'Online', isFree: false, color: '#ffc107' },
    { id: 4, title: 'Professional Workshop', day: '12', month: 'APR', date: 'Apr 12, 2025', location: 'Hammamet', isFree: true, color: '#28a745' }
  ];

  clubs = [
    { id: 1, name: 'Conversation Club', icon: 'bi-chat', members: 45, meetings: 4, color: '#2D5757' },
    { id: 2, name: 'Art Club', icon: 'bi-brush', members: 32, meetings: 2, color: '#17a2b8' },
    { id: 3, name: 'Professional Club', icon: 'bi-briefcase', members: 28, meetings: 3, color: '#ffc107' },
    { id: 4, name: 'Adults Club', icon: 'bi-people', members: 23, meetings: 2, color: '#28a745' }
  ];

  activities = [
    { title: 'New User Registration', desc: 'Sarah Ben Ali joined the platform', time: '5 min ago', user: 'Sarah Ben Ali', userInitials: 'SB', userColor: '#2D5757', color: '#2D5757' },
    { title: 'Course Enrollment', desc: '12 students enrolled in Business English', time: '25 min ago', user: 'System', userInitials: 'SY', userColor: '#17a2b8', color: '#17a2b8' },
    { title: 'Payment Processed', desc: '$2,450 received from 3 students', time: '1 hour ago', user: 'Finance', userInitials: 'FN', userColor: '#28a745', color: '#28a745' },
    { title: 'Event Created', desc: 'New event "Conversation Club" scheduled', time: '2 hours ago', user: 'Admin', userInitials: 'AD', userColor: '#ffc107', color: '#ffc107' },
    { title: 'Certificate Issued', desc: '5 students received certificates', time: '3 hours ago', user: 'System', userInitials: 'SY', userColor: '#dc3545', color: '#dc3545' }
  ];

  constructor(
    private router: Router,
    private ws: WebSocketService,
    private http: HttpClient
  ) {}

  get filteredLogins(): string[] {
    if (this.currentFilter === 'login') {
      return this.recentLogins.filter(l => l.includes('LOGIN'));
    }
    if (this.currentFilter === 'logout') {
      return this.recentLogins.filter(l => l.includes('LOGOUT'));
    }
    if (this.currentFilter === 'suspicious') {
      return this.recentLogins.filter(l => l.includes('⚠️'));
    }
    return this.recentLogins;
  }

  setFilter(filter: string): void {
    this.currentFilter = filter;
  }

  markAsSafe(loginMessage: string): void {
    // Remove the suspicious indicator from the message
    const safeMessage = loginMessage.replace('⚠️ ', '✓ Safe: ');
    
    // Update the array
    const index = this.recentLogins.indexOf(loginMessage);
    if (index !== -1) {
      this.recentLogins[index] = safeMessage;
      this.recentLogins = [...this.recentLogins];
    }
    
    // Update suspicious count
    this.suspiciousLogins = this.recentLogins.filter(l => l.includes('⚠️')).length;
    
    console.log('Marked as safe:', safeMessage);
  }

  exportSuspiciousReport(): void {
    const suspicious = this.recentLogins.filter(l => l.includes('⚠️'));
    
    if (suspicious.length === 0) {
      alert('No suspicious logins to export');
      return;
    }
    
    const csvRows = [
      ['Timestamp', 'Event Type', 'Email', 'Role', 'IP', 'Message']
    ];
    
    for (const entry of suspicious) {
      // Parse the message
      const cleanMsg = entry.replace('⚠️ ', '');
      const isLogin = cleanMsg.includes('LOGIN');
      const parts = cleanMsg.match(/(\w+):\s+(\S+)\s+\((\w+)\)\s+from\s+([\d\.]+)\s+at\s+([\d:]+)/);
      
      if (parts) {
        csvRows.push([
          parts[5],
          parts[1],
          parts[2],
          parts[3],
          parts[4],
          cleanMsg
        ]);
      } else {
        csvRows.push([new Date().toISOString(), 'UNKNOWN', '', '', '', cleanMsg]);
      }
    }
    
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suspicious_logins_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  showLocation(loginMessage: string): void {
    // Parse IP from message
    const ipMatch = loginMessage.match(/from\s+([\d\.]+)/);
    if (ipMatch) {
      this.selectedIp = ipMatch[1];
    } else {
      this.selectedIp = 'Unknown';
    }
    
    // Parse time from message
    const timeMatch = loginMessage.match(/at\s+([\d:]+)/);
    if (timeMatch) {
      this.selectedTime = timeMatch[1];
    } else {
      this.selectedTime = 'Unknown';
    }
    
    // Parse device info
    if (loginMessage.includes('Chrome')) this.selectedDevice = 'Chrome Browser';
    else if (loginMessage.includes('Firefox')) this.selectedDevice = 'Firefox Browser';
    else if (loginMessage.includes('Safari')) this.selectedDevice = 'Safari Browser';
    else this.selectedDevice = 'Unknown Device';
    
    // Get geolocation from IP
    if (this.selectedIp !== '127.0.0.1' && this.selectedIp !== 'Unknown') {
      this.http.get(`https://ipapi.co/${this.selectedIp}/json/`).subscribe({
        next: (data: any) => {
          this.selectedCountry = data.country_name || 'Unknown';
          this.selectedCity = data.city || 'Unknown';
          this.selectedLat = data.latitude;
          this.selectedLon = data.longitude;
          this.showMapModal = true;
        },
        error: () => {
          this.selectedCountry = 'Local/Unknown';
          this.selectedCity = 'Local/Unknown';
          this.showMapModal = true;
        }
      });
    } else {
      this.selectedCountry = 'Localhost (Development)';
      this.selectedCity = 'Local Machine';
      this.showMapModal = true;
    }
  }

  ngOnInit(): void {
    console.log('AdminViewComponent initialized');

    // Load recent logins from last 24 hours
    this.ws.getRecentLogins().subscribe({
      next: (logins: string[]) => {
        console.log('Recent events received:', logins.length);
        this.recentLogins = [...new Set(logins.map(l => String(l)))];
      },
      error: (err: any) => {
        console.error('Error loading events:', err);
      }
    });

    // Get active sessions count
    this.ws.getActiveSessions().subscribe({
      next: (count: number) => {
        this.activeSessions = count;
      }
    });

    // Get suspicious logins count
    this.ws.getSuspiciousLogins().subscribe({
      next: (count: number) => {
        this.suspiciousLogins = count;
      }
    });

    // Connect WebSocket for real-time updates
    this.ws.connect();

    // Listen for new real-time events
    this.ws.getLoginStream().subscribe({
      next: (event: string) => {
        if (!event) return;
        console.log('New event:', event);
        
        if (!this.recentLogins.includes(event)) {
          this.recentLogins = [event, ...this.recentLogins].slice(0, 50);
          this.suspiciousLogins = this.recentLogins.filter(l => l.includes('⚠️')).length;
        } else {
          console.log('Duplicate ignored, message already exists');
        }
      },
      error: (err: any) => {
        console.error('Error receiving event:', err);
      }
    });
  }

  ngOnDestroy(): void {
    console.log('AdminViewComponent destroyed — WebSocket stays alive');
  }

  getDashOffset(index: number): number {
    const offsets = [0, 25, 50];
    return offsets[index] || 0;
  }

  navigateTo(route: string): void {
    const target = route.startsWith('/backoffice/') ? route : `/backoffice/admin/${route}`;
    this.router.navigate([target]);
  }

  handleAction(action: any): void {
    const target = action?.route?.startsWith('/backoffice/')
      ? action.route
      : `/backoffice${action?.route ?? ''}`;
    this.router.navigate([target]);
  }

  viewUser(user: any): void {
    console.log('View user:', user);
  }

  editUser(user: any): void {
    console.log('Edit user:', user);
  }

  deleteUser(user: any): void {
    console.log('Delete user:', user);
  }

  viewEvent(event: any): void {
    console.log('View event:', event);
  }

  viewClub(club: any): void {
    console.log('View club:', club);
  }

  viewActivity(activity: any): void {
    console.log('View activity:', activity);
  }

  handleNotification(): void {
    console.log('Notifications clicked');
  }

  handleProfile(): void {
    console.log('Profile clicked');
  }
}