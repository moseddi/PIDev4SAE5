import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-view.component.html',
  styleUrls: ['./admin-view.component.css']
})
export class AdminViewComponent {
  Math = Math;
  totalUsers = 1284 + 24 + 3;

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

  constructor(private router: Router) {}

  getDashOffset(index: number): number {
    const offsets = [0, 25, 50];
    return offsets[index] || 0;
  }

  navigateTo(route: string): void {
    console.log('Navigate to:', route);
  }

  handleAction(action: any): void {
    console.log('Action:', action.label);
  }

  viewUser(user: any): void {
    console.log('View user:', user);
  }

  editUser(user: any): void {
    console.log('Edit user:', user);
    event?.stopPropagation();
  }

  deleteUser(user: any): void {
    console.log('Delete user:', user);
    event?.stopPropagation();
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