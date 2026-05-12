import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css']
})
export class RegisterComponent {
    username = '';
    email = '';
    password = '';
    role: 'ADMIN' | 'PLAYER' | 'TUTOR' = 'PLAYER';
    error = '';
    loading = false;

    constructor(private auth: AuthService, private router: Router) { }

    submit(): void {
        if (!this.username || !this.email || !this.password) {
            this.error = 'Veuillez remplir tous les champs.';
            return;
        }
        this.loading = true;
        this.error = '';
        this.auth.register({
            username: this.username,
            email: this.email,
            password: this.password,
            role: this.role
        }).subscribe({
            next: (user) => {
                this.loading = false;
                if (user.role === 'ADMIN') {
                    this.router.navigate(['/assessment/admin']);
                } else {
                    this.router.navigate(['/assessment/frontoffice']);
                }
            },
            error: (err) => {
                this.loading = false;
                this.error = err.error?.error || 'Erreur lors de l\'inscription.';
            }
        });
    }
}
