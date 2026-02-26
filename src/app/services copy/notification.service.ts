import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
    message: string;
    type: 'success' | 'error' | 'info';
    show: boolean;
}

export interface ConfirmState {
    message: string;
    show: boolean;
    resolve?: (value: boolean) => void;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private notificationSubject = new BehaviorSubject<Notification>({
        message: '',
        type: 'info',
        show: false
    });

    private confirmSubject = new BehaviorSubject<ConfirmState>({
        message: '',
        show: false
    });

    notification$: Observable<Notification> = this.notificationSubject.asObservable();
    confirm$: Observable<ConfirmState> = this.confirmSubject.asObservable();

    show(message: string, type: 'success' | 'error' | 'info' = 'info') {
        this.notificationSubject.next({ message, type, show: true });

        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hide();
        }, 5000);
    }

    confirm(message: string): Promise<boolean> {
        return new Promise((resolve) => {
            this.confirmSubject.next({
                message,
                show: true,
                resolve
            });
        });
    }

    handleConfirm(value: boolean) {
        const current = this.confirmSubject.value;
        if (current.resolve) {
            current.resolve(value);
        }
        this.confirmSubject.next({ message: '', show: false });
    }

    success(message: string) {
        this.show(message, 'success');
    }

    error(message: string) {
        this.show(message, 'error');
    }

    info(message: string) {
        this.show(message, 'info');
    }

    hide() {
        this.notificationSubject.next({
            ...this.notificationSubject.value,
            show: false
        });
    }
}
