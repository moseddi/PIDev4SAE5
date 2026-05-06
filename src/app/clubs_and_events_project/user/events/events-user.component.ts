import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EventService, RecommendedEvent, RecommendationResponse } from '../../services/event.service';
import { Event } from '../../models/event.model';
import { AuthService } from '../../../services/auth.service';

@Component({
    selector: 'app-events-user',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './events-user.component.html',
    styleUrls: ['./events-user.component.css']
})
export class EventsUserComponent implements OnInit {
    events: Event[] = [];
    filteredEvents: Event[] = [];
    searchTerm: string = '';
    selectedCategory: string = 'all';
    categories: string[] = ['all', 'Workshop', 'Seminar', 'Conference', 'Competition', 'Other'];

    isLoading: boolean = false;
    error: string | null = null;
    user: any = null;

    // ── ML Recommendations ────────────────────────────────────────────────
    recommendations: RecommendedEvent[] = [];
    recommendationInfo: RecommendationResponse | null = null;
    isLoadingRecommendations: boolean = false;
    showRecommendations: boolean = true;

    // Registration Modal State
    showRegistrationModal: boolean = false;
    selectedEventForRegistration: Event | null = null;
    registrationSuccess: boolean = false;
    registrationError: string | null = null;

    registrationForm: any = {
        userName: '',
        userEmail: '',
        gender: '',
        level: '',
        discoverySource: '',
        paymentMethod: '',
        reason: '',
        hobbies: '',
        specialty: '',
        age: null,
        participationMode: 'PRESENTIAL',
        seatNumber: ''
    };

    // Seat Modal State
    showSeatModal: boolean = false;
    selectedSeat: string | null = null;
    rows: string[] = ['A', 'B', 'C', 'D', 'E'];
    cols: number[] = [1, 2, 3, 4, 5, 6, 7, 8];
    reservedSeats: string[] = ['A1', 'B5', 'C3'];

    constructor(
        private eventService: EventService,
        private router: Router,
        private authService: AuthService,
    ) { }

    ngOnInit(): void {
        this.user = this.authService.getUser();
        console.log('EventsUserComponent User:', this.user);
        
        if (this.user) {
            this.registrationForm.userName = `${this.user.firstName || ''} ${this.user.lastName || ''}`.trim();
            this.registrationForm.userEmail = this.user.email;
            // Set userId for registration form
            this.registrationForm.userId = this.user.id || this.user.userId || this.user.ID_User;
        }
        this.loadEvents();
    }

    loadEvents(): void {
        this.isLoading = true;
        this.error = null;
        this.eventService.getEvents().subscribe({
            next: (data) => {
                this.events = data;
                this.applyFilters();
                this.isLoading = false;
                // Load recommendations after events are fetched
                this.loadRecommendations();
            },
            error: (err) => {
                console.error('Error loading events:', err);
                this.error = 'Failed to load events. Please check your connection.';
                this.isLoading = false;
            }
        });
    }

    /**
     * Load personalized recommendations from the ML API.
     * Adapted from notebook Objective 3: Système de Recommandation.
     * Sends user profile + all events to the Python FastAPI service.
     */
    loadRecommendations(): void {
        if (!this.events || this.events.length === 0) return;

        const userId = this.user?.id || this.user?.userId || this.user?.ID_User || 1;
        this.isLoadingRecommendations = true;

        // Step 1: Fetch the latest registrations from the server to have real-time data
        this.eventService.getUserRegistrations(userId).subscribe({
            next: (registrations) => {
                // Step 2: Extract event types from the real registration history
                const registeredTypes = registrations
                    .map((r: any) => r.type || r.Type || r.eventType || '')
                    .filter((t: string) => t.length > 0);
                
                const registeredClubIds = Array.isArray(this.user?.clubIds) ? this.user.clubIds : [];

                // Step 3: Map current events for the ML payload
                const eventsPayload = this.events.map((e: any) => ({
                    id: e.ID_Event || e.id || 0,
                    title: e.Title || e.title || '',
                    type: e.Type || e.type || 'Other',
                    status: e.Status || e.status || 'PLANNED',
                    maxParticipants: e.MaxParticipants || e.maxParticipants || 100,
                    currentParticipants: e.CurrentParticipants || e.currentParticipants || 0,
                    clubId: e.ID_Club || e.clubId || null,
                    estimatedCost: e.EstimatedCost || e.estimatedCost || 0,
                }));

                const request = {
                    user: {
                        userId: userId,
                        specialty: this.registrationForm.specialty || this.user?.specialty || 'OTHER',
                        registeredEventTypes: registeredTypes,
                        registeredClubIds: registeredClubIds,
                        totalRegistrations: registrations.length,
                    },
                    events: eventsPayload,
                    topN: 4
                };

                // Step 4: Call the Recommendation Engine (Python or Fallback)
                this.eventService.getRecommendations(request).subscribe({
                    next: (response) => {
                        this.recommendationInfo = response;
                        this.recommendations = response.recommendations;
                        this.isLoadingRecommendations = false;
                    },
                    error: (err) => {
                        console.error('Recommendation API error:', err);
                        this.isLoadingRecommendations = false;
                    }
                });
            },
            error: (err) => {
                console.error('Error fetching user history for recommendations:', err);
                this.isLoadingRecommendations = false;
            }
        });
    }

    /**
     * Find the full Event object by ID for navigating to recommended event.
     */
    getEventById(id: number): Event | undefined {
        return this.events.find((e: any) => (e.ID_Event || e.id) === id);
    }

    /**
     * Navigate to a recommended event — either register or view details.
     */
    openRecommendedEvent(rec: RecommendedEvent): void {
        const event = this.getEventById(rec.eventId);
        if (event) {
            this.register(event);
        }
    }

    applyFilters(): void {
        this.filteredEvents = this.events.filter(event => {
            const title = event.Title || (event as any).title || '';
            const manifesto = event.Manifesto || (event as any).description || '';
            const type = event.Type || (event as any).type || '';

            const matchesSearch = title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                manifesto.toLowerCase().includes(this.searchTerm.toLowerCase());
            const matchesCategory = this.selectedCategory === 'all' || type === this.selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }

    onSearch(): void {
        this.applyFilters();
    }

    filterByCategory(category: string): void {
        this.selectedCategory = category;
        this.applyFilters();
    }

    isRegistered(event: Event): boolean {
        return false;
    }

    register(event: Event): void {
        if (!this.user) {
            alert('Please login to register for events.');
            return;
        }
        this.selectedEventForRegistration = event;
        this.showRegistrationModal = true;
        this.registrationSuccess = false;
        this.isWaitlisted = false;
        this.registrationError = null;
    }

    isWaitlisted: boolean = false;

    closeRegistrationModal(): void {
        this.showRegistrationModal = false;
        this.selectedEventForRegistration = null;
        this.isWaitlisted = false;
    }

    submitRegistration(): void {
        if (!this.selectedEventForRegistration) return;

        const eventId = this.selectedEventForRegistration.ID_Event || (this.selectedEventForRegistration as any).id;
        this.registrationError = null;

        this.eventService.registerForEvent(eventId, this.registrationForm).subscribe({
            next: (res: any) => {
                const status = (res.status || res.Status || 'CONFIRMED').toString().toUpperCase();
                this.isWaitlisted = (status === 'WAITLISTED');
                this.registrationSuccess = true;

                setTimeout(() => {
                    this.closeRegistrationModal();
                    this.loadEvents();
                }, 2000);
            },
            error: (err) => {
                this.registrationError = err.error?.message || 'Registration failed. Please try again.';
            }
        });
    }

    // Seat Logic
    openSeatModal(): void {
        this.showSeatModal = true;
        this.selectedSeat = this.registrationForm.seatNumber;
    }

    closeSeatModal(): void {
        this.showSeatModal = false;
    }

    selectSeat(seatCode: string): void {
        if (this.reservedSeats.includes(seatCode)) return;
        this.selectedSeat = seatCode;
    }

    confirmSeat(): void {
        if (this.selectedSeat) {
            this.registrationForm.seatNumber = this.selectedSeat;
            this.closeSeatModal();
        }
    }

    getSeatClasses(row: string, col: number): string {
        const seatCode = row + col;
        const base = "w-6 h-6 rounded-md flex items-center justify-center transition-all ";

        if (this.reservedSeats.includes(seatCode)) {
            return base + "bg-red-200 text-red-500 cursor-not-allowed";
        }
        if (this.selectedSeat === seatCode) {
            return base + "bg-[#2D5757] text-[#F7EDE2] shadow-lg scale-110";
        }
        return base + "bg-white border border-[#2D5757]/10 text-[#2D5757]/20 hover:border-[#2D5757]/30 hover:bg-[#2D5757]/5";
    }

    viewDetails(event: Event): void {
        const id = event.ID_Event || (event as any).id;
        this.router.navigate(['/frontoffice/events', id]);
    }

    goBack(): void {
        this.router.navigate(['/frontoffice']);
    }

    /** Score bar color based on recommendation percentage */
    getScoreBarColor(percentage: number): string {
        if (percentage >= 85) return 'bg-emerald-500';
        if (percentage >= 70) return 'bg-teal-500';
        if (percentage >= 55) return 'bg-blue-500';
        return 'bg-indigo-400';
    }

    /** Badge color class */
    getBadgeColor(badge: string): string {
        if (badge.includes('Top Pick'))       return 'bg-amber-100 text-amber-700 border-amber-200';
        if (badge.includes('Trending'))       return 'bg-rose-100 text-rose-700 border-rose-200';
        if (badge.includes('Perfect Match'))  return 'bg-violet-100 text-violet-700 border-violet-200';
        return 'bg-sky-100 text-sky-700 border-sky-200';
    }
}
