import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification, ConfirmState } from '../../../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Success/Info/Error Toasts -->
    <div *ngIf="notification.show" 
         class="fixed top-8 right-8 z-[9999] animate-in slide-in-from-right-10 fade-in duration-500">
      <div [ngClass]="{
             'bg-[#2D5757] text-[#F7EDE2]': notification.type === 'success' || notification.type === 'info',
             'bg-red-600 text-white': notification.type === 'error'
           }"
           class="flex items-center p-6 rounded-[2rem] shadow-2xl border border-white/10 min-w-[320px] max-w-md">
        
        <!-- Icon -->
        <div class="mr-5 p-3 rounded-2xl bg-white/10 shadow-inner">
          <svg *ngIf="notification.type === 'success'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
          </svg>
          <svg *ngIf="notification.type === 'error'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          <svg *ngIf="notification.type === 'info'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>

        <!-- Content -->
        <div class="flex-1">
          <h4 class="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">
            {{ notification.type }} System
          </h4>
          <p class="text-xs font-bold uppercase tracking-widest leading-relaxed">
            {{ notification.message }}
          </p>
        </div>

        <!-- Close -->
        <button (click)="close()" class="ml-4 p-2 opacity-20 hover:opacity-100 transition-opacity">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- Confirmation Modal (Now as a Top Toast) -->
    <div *ngIf="confirmState.show" 
         class="fixed top-8 right-8 z-[10000] animate-in slide-in-from-top-10 fade-in duration-500">
      <div class="bg-white rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(45,87,87,0.3)] p-8 max-w-sm w-full border border-[#2D5757]/10">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 bg-[#F7EDE2] rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
            <svg class="w-6 h-6 text-[#2D5757]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-xs font-black text-[#2D5757] tracking-wider uppercase">Authorization Required</h3>
            <p class="text-[10px] font-bold text-[#2D5757]/40 uppercase tracking-widest leading-tight mt-1">
              {{ confirmState.message }}
            </p>
          </div>
        </div>

        <div class="flex gap-3">
          <button (click)="handleConfirm(false)" 
                  class="flex-1 py-3 border border-[#2D5757]/10 text-[#2D5757] rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-[#F7EDE2] transition-all">
            Cancel
          </button>
          <button (click)="handleConfirm(true)" 
                  class="flex-1 py-3 bg-[#2D5757] text-[#F7EDE2] rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-[#1a3a3a] transition-all shadow-lg">
            Confirm
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class NotificationComponent implements OnInit, OnDestroy {
  notification: Notification = { message: '', type: 'info', show: false };
  confirmState: ConfirmState = { message: '', show: false };
  private subscription: Subscription = new Subscription();

  constructor(private notificationService: NotificationService) { }

  ngOnInit() {
    this.subscription.add(
      this.notificationService.notification$.subscribe(notif => this.notification = notif)
    );
    this.subscription.add(
      this.notificationService.confirm$.subscribe(state => this.confirmState = state)
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  close() {
    this.notificationService.hide();
  }

  handleConfirm(value: boolean) {
    this.notificationService.handleConfirm(value);
  }
}
