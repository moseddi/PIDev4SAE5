import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">

      <!-- Header -->
      <div class="dash-header">
        <div>
          <h2 class="dash-title">Tableau de bord</h2>
          <p class="dash-sub">Bienvenue dans l'interface d'administration</p>
        </div>
      </div>

      <!-- Quick Stats / Actions -->
      <div class="dash-grid">
        <div class="dash-card">
          <div class="card-icon">📋</div>
          <div class="card-info">
             <h4>Examens / Tests</h4>
             <p>Gestion des sujets PDF & questions</p>
             <a routerLink="/backoffice/assessment-exams" class="dash-btn">Gérer</a>
          </div>
        </div>

        <div class="dash-card">
          <div class="card-icon">📊</div>
          <div class="card-info">
             <h4>Évals / Notes</h4>
             <p>Saisie des scores & certificats</p>
             <a routerLink="/backoffice/assessment-exams" class="dash-btn">Accéder</a>
          </div>
        </div>

        <div class="dash-card">
          <div class="card-icon">🕹️</div>
          <div class="card-info">
             <h4>Mode Jeu</h4>
             <p>Quizzes & sessions en direct</p>
             <a routerLink="/backoffice/quizzes" class="dash-btn">Ouvrir</a>
          </div>
        </div>
      </div>

      <!-- Welcome box -->
      <div class="welcome-box">
        <div class="welcome-icon">👋</div>
        <h3>Bienvenue, Administrateur</h3>
        <p>Utilisez le menu latéral ou les cartes ci-dessus pour gérer les différentes sections.</p>
      </div>

    </div>
  `,
  styles: [`
    .dashboard { }
    .dash-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;
    }
    .dash-title { 
      font-size: 1.6rem; 
      font-weight: 800; 
      color: #2D5757; 
      margin: 0 0 0.25rem; 
    }
    .dash-sub { 
      color: #2D5757; 
      margin: 0; 
      font-size: 0.95rem; 
      opacity: 0.8;
    }
    
    .dash-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .dash-card {
      background: #fff;
      border-radius: 20px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      box-shadow: 0 4px 15px rgba(45, 87, 87, 0.05);
      border: 1px solid rgba(45, 87, 87, 0.08);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .dash-card:hover { 
      transform: translateY(-4px); 
      box-shadow: 0 12px 25px rgba(45, 87, 87, 0.1); 
    }
    .card-icon { 
      font-size: 2.25rem; 
      color: #2D5757;
      background: #F7EDE2;
      width: 64px; height: 64px;
      display: flex; align-items: center; justify-content: center;
      border-radius: 16px; 
    }
    .card-info h4 { margin: 0 0 0.25rem; font-size: 1.1rem; color: #2D5757; }
    .card-info p { margin: 0 0 0.75rem; font-size: 0.85rem; color: #64748b; font-weight: 500; }
    .dash-btn { 
      display: inline-block;
      padding: 0.45rem 1rem;
      background: #2D5757; color: #F7EDE2;
      text-decoration: none; border-radius: 8px;
      font-size: 0.85rem; font-weight: 700;
      transition: background 0.2s;
    }
    .dash-btn:hover { background: #1a3a3a; }

    .welcome-box {
      background: #fff;
      border-radius: 24px;
      padding: 4rem 2rem;
      text-align: center;
      box-shadow: 0 4px 20px rgba(45, 87, 87, 0.05);
      border: 1px solid rgba(45, 87, 87, 0.08);
      margin-top: 1rem;
    }
    .welcome-icon {
      font-size: 4rem;
      margin-bottom: 1.5rem;
    }
    .welcome-box h3 {
      font-size: 1.5rem;
      color: #2D5757;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }
    .welcome-box p {
      color: #2D5757;
      opacity: 0.7;
      max-width: 400px;
      margin: 0 auto;
    }
  `]
})
export class DashboardComponent implements OnInit {
  loading = false;

  constructor() { }

  ngOnInit(): void {
  }
}
