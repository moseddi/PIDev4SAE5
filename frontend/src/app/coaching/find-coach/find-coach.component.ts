import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
  isAvailable: boolean;   // true = séance existe ET pas encore réservée ET pas passée
  isBooked: boolean;      // true = séance existe mais déjà réservée
  seances: Seance[];
}

@Component({
  selector: 'app-find-coach',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarFrontComponent, FooterFrontComponent],
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

    // Pre-fill student name from logged in user
    const user = this.authService.getUser();
    if (user) {
      this.reservation.studidname = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email;
    }
  }

  loadCoaches(): void {
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        this.coaches = data.filter((u: any) => u.role === 'TUTOR');
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading coaches:', err);
        this.error = 'Failed to load coaches';
        this.loading = false;
      }
    });
  }

  loadSeancesForCoach(tutorId: number) {
    this.loadingSeances = true;
    this.coachingService.getSeancesByTutor(tutorId).subscribe({
      next: (seances) => {
        this.allSeances = seances || [];
        this.loadingSeances = false;
        this.buildCalendar();
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

    const buildDay = (date: Date, isCurrentMonth: boolean): CalendarDay => {
      const dateStr = this.formatDateStr(date);
      const seancesForDay = this.allSeances.filter(s => s.seanceDate === dateStr);
      const hasSeance = seancesForDay.length > 0;
      const isBooked = seancesForDay.some(s => (s.reservations?.length || 0) > 0);
      const isPast = date.getTime() < today.getTime();
      const isToday = date.getTime() === today.getTime();

      return {
        date: dateStr,
        dayOfMonth: date.getDate(),
        isCurrentMonth,
        isToday,
        isAvailable: !isBooked && !isPast,
        isBooked: isBooked,
        seances: seancesForDay
      };
    };

    // Previous month padding
    const prevMonthLastDay = new Date(this.currentYear, this.currentMonth, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      const date = new Date(this.currentYear, this.currentMonth - 1, prevMonthLastDay - i);
      this.calendarDays.push(buildDay(date, false));
    }

    // Current month
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(this.currentYear, this.currentMonth, day);
      this.calendarDays.push(buildDay(date, true));
    }

    // Next month padding
    const remaining = 42 - this.calendarDays.length;
    for (let day = 1; day <= remaining; day++) {
      const date = new Date(this.currentYear, this.currentMonth + 1, day);
      this.calendarDays.push(buildDay(date, false));
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

  selectCoach(coach: any) {
    this.selectedCoach = coach;
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
    if (day.isBooked || !day.isAvailable) return;

    if (day.seances.length > 0) {
      this.selectedSeance = day.seances[0];
    } else {
      this.selectedSeance = {
        goodName: 'Coaching Session',
        seanceDate: day.date,
        seanceTime: '10:00'
      };
    }

    this.showReservationForm = true;
    this.reservation.merenumber = day.date;
    if (this.selectedCoach) {
      this.reservation.coachName = `${this.selectedCoach.firstName} ${this.selectedCoach.lastName}`;
    }
  }

  cancelReservation(): void {
    this.showReservationForm = false;
    this.selectedSeance = null;
  }

  submitReservation(): void {
    if (!this.selectedSeance) {
      this.error = 'No seance selected';
      return;
    }

    if (!this.selectedSeance.id) {
      const token = this.authService.getToken() || '';
      if (this.selectedSeance.seanceTime && this.selectedSeance.seanceTime.length <= 5) {
        this.selectedSeance.seanceTime += ':00';
      }
      this.coachingService.createSeanceForTutor(this.selectedCoach.email, this.selectedSeance, token)
        .subscribe({
          next: (createdSeance) => {
            if(createdSeance.id) {
               this.createReservationOnly(createdSeance.id);
            }
          },
          error: (err) => {
            console.error('Error creating seance:', err);
            this.error = 'Failed to create seance. Please try again.';
          }
        });
    } else {
      this.createReservationOnly(this.selectedSeance.id);
    }
  }

  createReservationOnly(seanceId: number): void {
    this.coachingService.createReservation(seanceId, this.reservation).subscribe({
      next: () => {
        this.successMessage = 'Reservation confirmed! Your session has been booked.';
        this.showReservationForm = false;
        this.selectedSeance = null;
        this.loadSeancesForCoach(this.selectedCoach.id);
        setTimeout(() => { this.successMessage = ''; }, 5000);
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
