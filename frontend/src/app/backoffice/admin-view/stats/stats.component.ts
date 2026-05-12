 import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit, AfterViewInit {
  
  @ViewChild('lineChartCanvas') lineChartCanvas!: ElementRef;
  @ViewChild('barChartCanvas') barChartCanvas!: ElementRef;
  @ViewChild('pieChartCanvas') pieChartCanvas!: ElementRef;
  
  stats: any = {
    totalUsers: 0,
    activeUsersLastMonth: 0,
    newUsersThisWeek: 0,
    retentionRate: 0,
    loginsPerDay: {},
    loginsPerHour: {},
    usersByRole: {},
    mostActiveUsers: [],
    recentLogins: [],
    usersByCity: {}
  };
  
  advancedStats: any = {};
  dailyActivity: any[] = [];
  recentActivity: any[] = [];
  weekdayActivity: any = {};
  
  loading = true;
  error = '';
  selectedPeriod: 'day' | 'week' | 'month' = 'week';
  
  filterRole: string = 'all';
  filterCity: string = 'all';
  uniqueCities: string[] = [];
  
  private lineChart: any;
  private barChart: any;
  private pieChart: any;
  
  constructor(private http: HttpClient) {}
  
  ngOnInit() {
    this.loadAllStats();
  }
  
  ngAfterViewInit() {}
  
  loadAllStats() {
    this.loading = true;
    
    const baseUrl = 'http://localhost:8082/api/users/stats';
    
    this.http.get(`${baseUrl}/dashboard`).subscribe({
      next: (data: any) => {
        this.stats = data;
        this.recentActivity = data.recentLogins || [];
        this.uniqueCities = [...new Set(this.recentActivity.map(u => u.city).filter(c => c))];
        this.loadAdditionalStats(baseUrl);
        setTimeout(() => this.createCharts(), 200);
      },
      error: (err) => {
        this.error = 'Impossible de charger les statistiques';
        this.loading = false;
      }
    });
  }
  
  loadAdditionalStats(baseUrl: string) {
    this.http.get(`${baseUrl}/advanced-stats`).subscribe({
      next: (data) => this.advancedStats = data
    });
    
    this.http.get(`${baseUrl}/daily-activity`).subscribe({
      next: (data) => this.dailyActivity = data as any[]
    });
    
    this.http.get(`${baseUrl}/weekday-activity`).subscribe({
      next: (data) => {
        this.weekdayActivity = data;
        this.loading = false;
      }
    });
  }
  
  createCharts() {
    this.createLineChart();
    this.createBarChart();
    this.createPieChart();
  }
  
  createLineChart() {
    if (!this.lineChartCanvas) return;
    
    const ctx = this.lineChartCanvas.nativeElement.getContext('2d');
    const entries = Object.entries(this.stats.loginsPerDay || {});
    
    if (this.lineChart) this.lineChart.destroy();
    
    this.lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: entries.map((e: any) => this.formatShortDate(e[0])),
        datasets: [{
          label: 'Connexions',
          data: entries.map((e: any) => e[1] as number),
          borderColor: '#2D5757',
          backgroundColor: 'rgba(45, 87, 87, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { backgroundColor: '#2D5757' }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: '#e8d9cc' } },
          x: { grid: { display: false } }
        }
      }
    });
  }
  
  createBarChart() {
    if (!this.barChartCanvas) return;
    
    const ctx = this.barChartCanvas.nativeElement.getContext('2d');
    const hours = Array.from({length: 24}, (_, i) => i + 'h');
    const data = Object.values(this.stats.loginsPerHour || {});
    
    if (this.barChart) this.barChart.destroy();
    
    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: hours,
        datasets: [{
          label: 'Connexions',
          data: data as number[],
          backgroundColor: '#2D5757',
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#e8d9cc' } }
        }
      }
    });
  }
  
  createPieChart() {
    if (!this.pieChartCanvas) return;
    
    const ctx = this.pieChartCanvas.nativeElement.getContext('2d');
    const labels = Object.keys(this.stats.usersByRole || {});
    const data = Object.values(this.stats.usersByRole || {});
    
    if (this.pieChart) this.pieChart.destroy();
    
    this.pieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data as number[],
          backgroundColor: ['#2D5757', '#1e3d3d', '#4a7a7a', '#6b8e8e', '#8fb1b1'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#2D5757' } }
        }
      }
    });
  }
  
  get filteredActivity() {
    return this.recentActivity.filter(u => {
      if (this.filterRole !== 'all' && u.role !== this.filterRole) return false;
      if (this.filterCity !== 'all' && u.city !== this.filterCity) return false;
      return true;
    });
  }
  
  get adminCount(): number {
    return this.stats.usersByRole?.ADMIN || 0;
  }
  
  get tutorCount(): number {
    return this.stats.usersByRole?.TUTOR || 0;
  }
  
  get studentCount(): number {
    return this.stats.usersByRole?.STUDENT || 0;
  }
  
  get totalLogins(): number {
    return this.advancedStats.totalLogins || 0;
  }
  
  get avgLogins(): number {
    return this.advancedStats.avgLoginsPerUser || 0;
  }
  
  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  formatShortDate(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  }
  
  getRetentionColor(rate: number): string {
    if (rate >= 70) return '#28a745';
    if (rate >= 40) return '#ffc107';
    return '#dc3545';
  }
  
  changePeriod(period: 'day' | 'week' | 'month') {
    this.selectedPeriod = period;
    // Ici tu pourrais recharger avec la période
  }
  
  applyFilters() {
    // Déjà géré par le getter
  }
  
  resetFilters() {
    this.filterRole = 'all';
    this.filterCity = 'all';
  }
  
  refresh() {
    this.loadAllStats();
  }
  
  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }
}