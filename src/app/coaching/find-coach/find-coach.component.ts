import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { CoachingService, Seance, Reservation } from '../service/coaching.service';
import { NavbarFrontComponent } from '../../courses/navbar-front/navbar-front.component';
import { FooterFrontComponent } from '../../courses/footer-front/footer-front.component';

interface CalendarDay {
  date: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isAvailable: boolean;
  seances: Seance[];
}

@Component({
  selector: 'app-find-coach',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NavbarFrontComponent, FooterFrontComponent],
  templateUrl: './find-coach.component.html',
  styleUrls: ['./find-coach.component.css']
})
export class FindCoachComponent implements OnInit {
  coaches: any[] = [];
  selectedCoach: any = null;
  allSeances: Seance[] = [];
  loading = true;
  loadingSeances = false;
  error = '';
  successMessage = '';

  // Calendar properties
  currentDate = new Date();
  currentYear: number = 0;
  currentMonth: number = 0;
  monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                'July', 'August', 'September', 'October', 'November', 'December'];
  dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  calendarDays: CalendarDay[] = [];

  // Reservation modal
  showReservationForm = false;
  selectedSeance: Seance | null = null;
  reservation: Reservation = {
    studidname: '',
    merenumber: '',
    status: 'PENDING'
  };

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private coachingService: CoachingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentYear = this.currentDate.getFullYear();
    this.currentMonth = this.currentDate.getMonth();
    this.loadCoaches();
    this.loadAllSeances();
    
    // Pre-fill student name from logged in user
    const user = this.authService.getUser();
    if (user) {
      this.reservation.studidname = user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.email;
    }
  }

  loadCoaches(): void {
    this.userService.getUsersByRole('STUDENT').subscribe({
      next: (data) => {
        this.coaches = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading coaches:', err);
        this.error = 'Failed to load coaches';
        this.loading = false;
      }
    });
  }

  loadAllSeances(): void {
    this.coachingService.getAllSeances().subscribe({
      next: (data) => {
        this.allSeances = data || [];
        this.buildCalendar();
      },
      error: (err) => {
        console.error('Error loading seances:', err);
      }
    });
  }

  loadSeancesForCoach(tutorId: number): void {
    this.loadingSeances = true;
    this.coachingService.getAllSeances().subscribe({
      next: (data) => {
        this.allSeances = data || [];
        this.buildCalendar();
        this.loadingSeances = false;
      },
      error: (err) => {
        console.error('Error loading seances:', err);
        this.loadingSeances = false;
      }
    });
  }

  buildCalendar(): void {
    this.calendarDays = [];
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Previous month days - check if seances have reservations
    const prevMonthLastDay = new Date(this.currentYear, this.currentMonth, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const date = new Date(this.currentYear, this.currentMonth - 1, dayNum);
      const dateStr = this.formatDateStr(date);
      const seancesForDay = this.allSeances.filter(s => s.seanceDate === dateStr);
      // Available if no reservations exist for this date
      const hasReservations = seancesForDay.some(seance => (seance.reservations?.length || 0) > 0);
      
      this.calendarDays.push({
        date: dateStr,
        dayOfMonth: dayNum,
        isCurrentMonth: false,
        isToday: false,
        isAvailable: !hasReservations,
        seances: seancesForDay
      });
    }

    // Current month days - check if seances have reservations
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(this.currentYear, this.currentMonth, day);
      const dateStr = this.formatDateStr(date);
      const isToday = date.getTime() === today.getTime();
      
      // Find seances for this date
      const seancesForDay = this.allSeances.filter(s => s.seanceDate === dateStr);
      // Available only if no reservations exist for this date
      const hasReservations = seancesForDay.some(seance => (seance.reservations?.length || 0) > 0);

      this.calendarDays.push({
        date: dateStr,
        dayOfMonth: day,
        isCurrentMonth: true,
        isToday: isToday,
        isAvailable: !hasReservations,
        seances: seancesForDay
      });
    }

    // Next month days - check if seances have reservations
    const remainingDays = 42 - this.calendarDays.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(this.currentYear, this.currentMonth + 1, day);
      const dateStr = this.formatDateStr(date);
      const seancesForDay = this.allSeances.filter(s => s.seanceDate === dateStr);
      const hasReservations = seancesForDay.some(seance => (seance.reservations?.length || 0) > 0);
      
      this.calendarDays.push({
        date: dateStr,
        dayOfMonth: day,
        isCurrentMonth: false,
        isToday: false,
        isAvailable: !hasReservations,
        seances: seancesForDay
      });
    }
  }

  formatDateStr(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  previousMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.buildCalendar();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.buildCalendar();
  }

  selectCoach(coach: any): void {
    this.selectedCoach = coach;
    this.showReservationForm = false;
    this.selectedSeance = null;
    this.loadSeancesForCoach(coach.id);
  }

  goBackToCoaches(): void {
    this.selectedCoach = null;
    this.allSeances = [];
    this.calendarDays = [];
    this.showReservationForm = false;
    this.selectedSeance = null;
  }

  onDateClick(day: CalendarDay): void {
    // Open modal for any clicked date
    // If there are seances, use the first one; otherwise create a placeholder
    if (day.seances && day.seances.length > 0) {
      this.openReservationForm(day.seances[0]);
    } else {
      // Create a placeholder seance for the clicked date
      const placeholderSeance: Seance = {
        goodName: 'New Session',
        seanceDate: day.date,
        seanceTime: '10:00:00'
      };
      this.openReservationForm(placeholderSeance);
    }
  }

  openReservationForm(seance: Seance): void {
    this.selectedSeance = seance;
    this.showReservationForm = true;
    this.reservation.merenumber = seance.seanceDate;
  }

  cancelReservation(): void {
    this.showReservationForm = false;
    this.selectedSeance = null;
  }

  submitReservation(): void {
    if (!this.selectedSeance || !this.selectedSeance.id) {
      return;
    }

    this.coachingService.createReservation(this.selectedSeance.id, this.reservation).subscribe({
      next: () => {
        this.successMessage = 'Reservation submitted successfully! Waiting for coach confirmation.';
        this.showReservationForm = false;
        this.selectedSeance = null;
        // Refresh seances
        if (this.selectedCoach) {
          this.loadSeancesForCoach(this.selectedCoach.id);
        }
        setTimeout(() => {
          this.successMessage = '';
        }, 5000);
      },
      error: (err) => {
        console.error('Error creating reservation:', err);
        this.error = 'Failed to create reservation. Please try again.';
      }
    });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  formatTime(timeStr: string): string {
    return timeStr.substring(0, 5);
  }

  getAvailableDatesCount(): number {
    return this.calendarDays.filter(d => d.isAvailable).length;
  }
}
