import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BackendDiagnosticService, DiagnosticResult } from '../services/backend-diagnostic.service';

@Component({
  selector: 'app-backend-diagnostic',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="diagnostic-container">
      <div class="diagnostic-header">
        <h2>🔍 Diagnostic Backend</h2>
        <p>Test de connexion avec le backend ({{ baseUrl }})</p>
        <button class="btn-diagnose" (click)="runDiagnostic()" [disabled]="diagnosing">
          {{ diagnosing ? '🔄 Diagnostic en cours...' : '🔍 Lancer le diagnostic' }}
        </button>
      </div>

      <div class="diagnostic-results" *ngIf="results.length > 0">
        <h3>Résultats du diagnostic</h3>
        <div class="result-item" *ngFor="let result of results" [class]="'result-' + result.status">
          <div class="result-header">
            <span class="result-icon">{{ getResultIcon(result.status) }}</span>
            <span class="result-endpoint">{{ result.endpoint }}</span>
            <span class="result-status">{{ result.status.toUpperCase() }}</span>
          </div>
          <div class="result-message">{{ result.message }}</div>
          <div class="result-details" *ngIf="result.details">
            <pre>{{ result.details | json }}</pre>
          </div>
        </div>
      </div>

      <div class="troubleshooting" *ngIf="suggestions.length > 0">
        <h3>💡 Suggestions de résolution</h3>
        <div class="suggestion-list">
          <div class="suggestion-item" *ngFor="let suggestion of suggestions" [innerHTML]="suggestion"></div>
        </div>
      </div>

      <div class="quick-actions">
        <h3>⚡ Actions rapides</h3>
        <div class="action-buttons">
          <button class="btn-action" (click)="testConnection()">🔗 Tester la connexion</button>
          <button class="btn-action" (click)="checkCORS()">🌐 Vérifier CORS</button>
          <button class="btn-action" (click)="showMockData()">🎭 Utiliser les données mock</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .diagnostic-container {
      max-width: 900px;
      margin: 2rem auto;
      padding: 2.5rem;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 25px;
      box-shadow: 0 15px 40px rgba(45, 87, 87, 0.15);
      border: 2px solid rgba(45, 87, 87, 0.1);
    }

    .diagnostic-header {
      text-align: center;
      margin-bottom: 2.5rem;
    }

    .diagnostic-header h2 {
      color: #2D5757;
      margin: 0 0 1rem;
      font-size: 2rem;
      font-weight: 900;
      background: linear-gradient(135deg, #2D5757, #1a3a3a);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .diagnostic-header p {
      color: #2D5757;
      opacity: 0.8;
      margin: 0 0 1.5rem;
      font-family: 'Courier New', monospace;
      background: rgba(247, 237, 226, 0.5);
      padding: 1rem;
      border-radius: 12px;
      font-size: 0.9rem;
      border: 2px solid rgba(45, 87, 87, 0.1);
    }

    .btn-diagnose {
      padding: 1rem 2.5rem;
      background: linear-gradient(135deg, #2D5757, #1a3a3a);
      color: #F7EDE2;
      border: none;
      border-radius: 15px;
      font-weight: 700;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 6px 20px rgba(45, 87, 87, 0.3);
    }

    .btn-diagnose:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(45, 87, 87, 0.4);
    }

    .btn-diagnose:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .diagnostic-results {
      margin-bottom: 2.5rem;
    }

    .diagnostic-results h3 {
      color: #2D5757;
      margin: 0 0 1.5rem;
      font-size: 1.4rem;
      font-weight: 800;
    }

    .result-item {
      margin-bottom: 1rem;
      padding: 1.5rem;
      border-radius: 15px;
      border: 2px solid;
      transition: all 0.3s ease;
    }

    .result-success {
      background: rgba(38, 137, 12, 0.1);
      border-color: rgba(38, 137, 12, 0.2);
    }

    .result-error {
      background: rgba(220, 38, 38, 0.1);
      border-color: rgba(220, 38, 38, 0.2);
    }

    .result-warning {
      background: rgba(216, 158, 0, 0.1);
      border-color: rgba(216, 158, 0, 0.2);
    }

    .result-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }

    .result-icon {
      font-size: 1.5rem;
      font-weight: bold;
    }

    .result-endpoint {
      font-family: 'Courier New', monospace;
      font-weight: 600;
      color: #2D5757;
      flex: 1;
    }

    .result-status {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .result-success .result-status {
      background: #26890c;
      color: white;
    }

    .result-error .result-status {
      background: #dc2626;
      color: white;
    }

    .result-warning .result-status {
      background: #d89e00;
      color: white;
    }

    .result-message {
      color: #2D5757;
      margin-bottom: 1rem;
      font-weight: 600;
    }

    .result-details {
      background: rgba(247, 237, 226, 0.3);
      padding: 1rem;
      border-radius: 10px;
      border: 2px solid rgba(45, 87, 87, 0.1);
    }

    .result-details pre {
      margin: 0;
      font-family: 'Courier New', monospace;
      font-size: 0.85rem;
      color: #2D5757;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .troubleshooting {
      margin-bottom: 2.5rem;
    }

    .troubleshooting h3 {
      color: #2D5757;
      margin: 0 0 1.5rem;
      font-size: 1.4rem;
      font-weight: 800;
    }

    .suggestion-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .suggestion-item {
      padding: 1.25rem;
      background: rgba(247, 237, 226, 0.3);
      border-radius: 15px;
      border: 2px solid rgba(45, 87, 87, 0.1);
      color: #2D5757;
      font-weight: 600;
      line-height: 1.5;
    }

    .quick-actions h3 {
      color: #2D5757;
      margin: 0 0 1.5rem;
      font-size: 1.4rem;
      font-weight: 800;
    }

    .action-buttons {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .btn-action {
      padding: 1rem 1.5rem;
      background: rgba(45, 87, 87, 0.1);
      color: #2D5757;
      border: 2px solid rgba(45, 87, 87, 0.2);
      border-radius: 15px;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .btn-action:hover {
      background: rgba(45, 87, 87, 0.2);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(45, 87, 87, 0.15);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .diagnostic-container {
        margin: 1rem;
        padding: 1.5rem;
      }

      .diagnostic-header h2 {
        font-size: 1.6rem;
      }

      .diagnostic-header p {
        font-size: 0.8rem;
        padding: 0.75rem;
      }

      .btn-diagnose {
        padding: 0.875rem 2rem;
        font-size: 0.9rem;
      }

      .result-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .result-endpoint {
        font-size: 0.85rem;
      }

      .action-buttons {
        grid-template-columns: 1fr;
      }

      .btn-action {
        padding: 0.875rem 1rem;
      }
    }
  `]
})
export class BackendDiagnosticComponent implements OnInit {
  diagnosing = false;
  results: DiagnosticResult[] = [];
  suggestions: string[] = [];
  baseUrl = 'http://localhost:8080/api';

  constructor(private diagnosticService: BackendDiagnosticService) {}

  ngOnInit(): void {
    this.loadSuggestions();
  }

  async runDiagnostic(): Promise<void> {
    this.diagnosing = true;
    this.results = [];
    this.suggestions = [];

    try {
      const results = await this.diagnosticService.runFullDiagnostic();
      this.results = results;
      this.generateSuggestions(results);
    } catch (error) {
      console.error('Diagnostic failed:', error);
      this.results = [{
        endpoint: 'Global',
        status: 'error',
        message: 'Le diagnostic a échoué',
        details: error as any
      }];
    } finally {
      this.diagnosing = false;
    }
  }

  async testConnection(): Promise<void> {
    try {
      const result = await this.diagnosticService.testConnection();
      this.results = [result];
    } catch (error) {
      this.results = [{
        endpoint: 'Connection',
        status: 'error',
        message: 'Impossible de se connecter au backend',
        details: error as any
      }];
    }
  }

  async checkCORS(): Promise<void> {
    try {
      const result = await this.diagnosticService.checkCORS();
      this.results = [result];
    } catch (error) {
      this.results = [{
        endpoint: 'CORS',
        status: 'error',
        message: 'Problème de configuration CORS',
        details: error as any
      }];
    }
  }

  showMockData(): void {
    this.results = [{
      endpoint: 'Mock Data',
      status: 'success',
      message: 'Utilisation des données mock activée',
      details: { message: 'Les données de démonstration sont maintenant utilisées' }
    }];
  }

  getResultIcon(status: string): string {
    switch (status) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return '❓';
    }
  }

  private generateSuggestions(results: DiagnosticResult[]): void {
    const errorResults = results.filter(r => r.status === 'error');
    
    if (errorResults.length > 0) {
      this.suggestions.push('Vérifiez que le serveur backend est en cours d\'exécution');
      this.suggestions.push('Assurez-vous que l\'URL du backend est correcte');
      this.suggestions.push('Vérifiez votre connexion réseau');
      this.suggestions.push('Consultez la console du navigateur pour plus de détails');
    }

    const corsErrors = errorResults.filter(r => r.endpoint.includes('CORS'));
    if (corsErrors.length > 0) {
      this.suggestions.push('Configurez correctement CORS sur le serveur backend');
      this.suggestions.push('Ajoutez votre domaine à la liste des origines autorisées');
    }
  }

  private loadSuggestions(): void {
    this.suggestions = [
      'Assurez-vous que le serveur backend est démarré',
      'Vérifiez que le port 8080 est accessible',
      'Consultez les logs du serveur pour d\'éventuelles erreurs'
    ];
  }
}
