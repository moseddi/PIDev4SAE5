import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    email = '';
    password = '';
    error = '';
    loading = false;

    constructor(private auth: AuthService, private router: Router) { }

    submit(): void {
        if (!this.email || !this.password) {
            this.error = 'Veuillez remplir tous les champs.';
            return;
        }
        this.loading = true;
        this.error = '';
        this.auth.login(this.email, this.password).subscribe({
            next: (user) => {
                this.loading = false;
                if (user.role === 'ADMIN') {
                    this.router.navigate(['/backoffice/game-sessions']);
                } else {
                    this.router.navigate(['/assessment/frontoffice']);
                }
            },
            error: () => {
                this.loading = false;
                this.error = 'Email ou mot de passe incorrect.';
            }
        });
    }
}
