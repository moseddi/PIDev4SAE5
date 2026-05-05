import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JobOffer, ApplicationRequest } from '../models/application.models';
import { ApplicationService } from '../services/application.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { NotificationWebSocketService } from '../assessment_project/backoffice/services/notification-websocket.service';
import { AppNotification } from '../assessment_project/backoffice/models/notification.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-job-offers-public',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">

      <!-- Toast -->
      @if (toast) {
        <div class="toast" [class.toast-success]="toast.type === 'success'" [class.toast-error]="toast.type === 'error'">
          <span class="toast-icon">{{ toast.type === 'success' ? '✅' : '❌' }}</span>
          {{ toast.message }}
        </div>
      }

      <!-- Hero Banner -->
      <div class="hero-banner">
        <div class="hero-content">
          <span class="hero-tag">💼 Opportunités de carrière</span>
          <h1 class="hero-title">Trouvez l'offre qui <span class="accent">vous correspond</span></h1>
          <p class="hero-sub">{{ offers.length }} offre{{ offers.length > 1 ? 's' : '' }} active{{ offers.length > 1 ? 's' : '' }} disponible{{ offers.length > 1 ? 's' : '' }}</p>
        </div>
        <div class="hero-right">
          @if (isLoggedIn) {
            <div class="header-actions">
              <button class="nav-btn-top" (click)="onViewApplications.emit()">
                 📩 Mes Candidatures
              </button>
              
              <!-- Notification Bell Icon next to button -->
              <div class="notif-wrapper">
                <button class="btn-notif" (click)="toggleNotifMenu()">
                  🔔
                  <span *ngIf="unreadNotifs.length > 0" class="notif-badge">{{ unreadNotifs.length }}</span>
                </button>
                
                <!-- Full screen transparent overlay for click-outside -->
                <div *ngIf="showNotifMenu" class="notif-overlay" (click)="showNotifMenu = false"></div>

                <!-- Dropdown -->
                <div class="notif-dropdown" *ngIf="showNotifMenu">
                  <div class="notif-dropdown-header">
                    <h4>Notifications</h4>
                    <button *ngIf="unreadNotifs.length > 0" (click)="markAllAsRead()">Tout marquer lu</button>
                  </div>
                  <div class="notif-dropdown-body">
                    <div *ngIf="unreadNotifs.length === 0" class="notif-empty">
                      Aucune nouvelle notification.
                    </div>
                    <div *ngFor="let n of unreadNotifs" class="notif-item" (click)="readNotif(n)">
                      <div class="notif-item-icon">💼</div>
                      <div class="notif-item-content">
                        <strong>{{ n.sender }}</strong>
                        <p>{{ n.message }}</p>
                        <span class="notif-time">{{ formatTime(n.timestamp) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Loading -->
      @if (loading) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Chargement des offres...</p>
        </div>
      }

      <!-- Empty state -->
      @if (!loading && offers.length === 0) {
        <div class="empty-state">
          <span class="empty-icon">🔍</span>
          <h3>Aucune offre disponible pour le moment</h3>
          <p>Revenez bientôt pour découvrir de nouvelles opportunités.</p>
        </div>
      }

      <!-- Offers Grid -->
      @if (!loading && offers.length > 0) {
        <div class="offers-grid">
          @for (job of offers; track job.id) {
            <div class="offer-card">
              <!-- Card Top -->
              <div class="card-top">
                <div class="company-row">
                  <div class="company-logo">{{ getInitials(job.companyName) }}</div>
                  <div>
                    <div class="company-name">{{ job.companyName || 'Entreprise' }}</div>
                    @if (job.location) {
                      <div class="location">📍 {{ job.location }}</div>
                    }
                  </div>
                </div>
                @if (job.requiredLevel) {
                  <span class="level-chip" [class]="'level-' + job.requiredLevel.toLowerCase()">
                    {{ getLevelLabel(job.requiredLevel) }}
                  </span>
                }
              </div>

              <!-- Title & Desc -->
              <h3 class="job-title">{{ job.title }}</h3>
              <p class="job-desc">{{ job.description }}</p>

              <!-- Tags -->
              <div class="tags-row">
                @if (job.contractType) {
                  <span class="tag tag-contract">📋 {{ job.contractType }}</span>
                }
                @if (job.salary) {
                  <span class="tag tag-salary">💰 {{ job.salary | number }} /an</span>
                }
                @if (job.expirationDate) {
                  <span class="tag tag-date">⏳ Exp: {{ job.expirationDate }}</span>
                }
              </div>

              <!-- Footer -->
              <div class="card-footer">
                @if (job.publicationDate) {
                  <span class="pub-date">📅 Publié le {{ job.publicationDate }}</span>
                }
                <button class="btn-apply" (click)="openApply(job)">
                  Postuler →
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Apply Modal -->
      @if (showModal && selectedJob) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <button class="modal-close" (click)="closeModal()">✕</button>

            @if (submitted) {
              <div class="success-state">
                <div class="success-icon">🎉</div>
                <h3>Candidature envoyée !</h3>
                <p>Nous avons bien reçu votre candidature pour <strong>{{ selectedJob.title }}</strong>.</p>
                <button class="btn-back-modal" (click)="closeModal()">Fermer</button>
              </div>
            } @else {
              <div class="modal-header">
                <div class="modal-job-info">
                  <span class="modal-tag">📩 Postuler</span>
                  <h2>{{ selectedJob.title }}</h2>
                  <p>{{ selectedJob.companyName }}{{ selectedJob.location ? ' — ' + selectedJob.location : '' }}</p>
                </div>
              </div>

              <form class="apply-form" #applyRef="ngForm" (ngSubmit)="submitApplication(applyRef.valid)">
                <!-- Bio -->
                <div class="form-group" [class.has-error]="bioField.touched && bioField.invalid">
                  <label for="bio">
                    <span class="lbl-icon">📖</span>
                    Bio <span class="req">*</span>
                  </label>
                  <textarea
                    id="bio" name="bio"
                    #bioField="ngModel"
                    [(ngModel)]="applyForm.bio"
                    required minlength="20"
                    placeholder="Présentez-vous : votre parcours, votre passion..."
                    rows="4" class="form-input"></textarea>
                  @if (bioField.touched && bioField.errors?.['required']) {
                    <span class="error-msg">La bio est requise.</span>
                  }
                  @if (bioField.touched && bioField.errors?.['minlength']) {
                    <span class="error-msg">La bio doit comporter au moins 20 caractères.</span>
                  }
                </div>

                <!-- Spécialité -->
                <div class="form-group" [class.has-error]="specField.touched && specField.invalid">
                  <label for="specialty">
                    <span class="lbl-icon">🎯</span>
                    Spécialité <span class="req">*</span>
                  </label>
                  <input
                    type="text" id="specialty" name="specialty"
                    #specField="ngModel"
                    [(ngModel)]="applyForm.specialty"
                    required
                    placeholder="Ex: Développement Full-Stack, Data Science..."
                    class="form-input">
                  @if (specField.touched && specField.errors?.['required']) {
                    <span class="error-msg">La spécialité est requise.</span>
                  }
                </div>

                <!-- Expérience -->
                <div class="form-group" [class.has-error]="expField.touched && expField.invalid">
                  <label for="experience">
                    <span class="lbl-icon">⏳</span>
                    Expérience <span class="req">*</span>
                  </label>
                  <select
                    id="experience" name="experience"
                    #expField="ngModel"
                    [(ngModel)]="applyForm.experience"
                    required
                    class="form-input">
                    <option value="">— Sélectionnez votre expérience —</option>
                    <option value="Moins d'1 an">Moins d'1 an</option>
                    <option value="1-2 ans">1 – 2 ans</option>
                    <option value="3-5 ans">3 – 5 ans</option>
                    <option value="5-10 ans">5 – 10 ans</option>
                    <option value="Plus de 10 ans">Plus de 10 ans</option>
                  </select>
                  @if (expField.touched && expField.errors?.['required']) {
                    <span class="error-msg">L'expérience est requise.</span>
                  }
                </div>

                @if (errorMsg) {
                  <div class="error-banner">⚠️ {{ errorMsg }}</div>
                }

                <div class="modal-actions">
                  <button type="button" class="btn-cancel-modal" (click)="closeModal()">Annuler</button>
                  <button type="submit" class="btn-submit" [disabled]="submitting">
                    @if (submitting) { <span class="btn-spin"></span> Envoi... }
                    @else { 🚀 Envoyer ma candidature }
                  </button>
                </div>
              </form>
            }
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { box-sizing: border-box; }
    .page { font-family: 'Inter', system-ui, sans-serif; padding: 0; min-height: 100vh; }

    /* Toast */
    .toast { position: fixed; top: 1.5rem; right: 1.5rem; z-index: 10001; display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.5rem; border-radius: 14px; font-weight: 600; font-size: 0.9rem; box-shadow: 0 20px 40px rgba(0,0,0,0.15); animation: slideIn 0.3s ease; }
    .toast-success { background: linear-gradient(135deg, #10b981, #059669); color: white; }
    .toast-error { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; }
    .toast-icon { font-size: 1.1rem; }
    @keyframes slideIn { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

    /* ── Hero ────────────────────────────────────────── */
    .hero-banner {
      background: linear-gradient(135deg, #2D5757 0%, #1a3a3a 100%);
      padding: 4rem 2.5rem 3rem;
      display: flex; align-items: center; justify-content: space-between; gap: 2rem;
      position: relative; overflow: hidden;
    }
    .hero-banner::after {
      content: ''; position: absolute; right: -80px; top: -80px;
      width: 320px; height: 320px; border-radius: 50%;
      background: rgba(255,255,255,0.05);
    }
    .hero-tag { display: inline-block; background: rgba(255,255,255,0.15); color: #F7EDE2; padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.85rem; font-weight: 700; margin-bottom: 1rem; }
    .hero-title { font-size: 2.6rem; font-weight: 900; color: white; margin: 0 0 0.75rem; line-height: 1.2; }
    .accent { color: #a7d7a7; }
    .hero-sub { color: rgba(255,255,255,0.7); font-size: 1rem; margin: 0; }
    .hero-right { display: flex; flex-direction: column; align-items: flex-end; gap: 1.5rem; z-index: 1; }
    .nav-btn-top { background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.3); padding: 0.6rem 1.2rem; border-radius: 12px; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.3s; backdrop-filter: blur(8px); }
    .nav-btn-top:hover { background: white; color: #2D5757; transform: translateY(-2px); }
    .hero-deco { display: flex; gap: 1rem; }
    .deco-card { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border-radius: 16px; padding: 1.25rem 1.5rem; color: white; text-align: center; border: 1px solid rgba(255,255,255,0.15); }
    .deco-card span { font-size: 2rem; display: block; margin-bottom: 0.3rem; }
    .deco-card p { margin: 0; font-weight: 700; font-size: 0.85rem; }

    /* ── Loading / Empty ─────────────────────────────── */
    .loading { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 5rem; color: #64748b; }
    .spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #2D5757; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { text-align: center; padding: 5rem 2rem; }
    .empty-icon { font-size: 3.5rem; display: block; margin-bottom: 1rem; }
    .empty-state h3 { font-size: 1.3rem; font-weight: 700; color: #1e293b; margin: 0 0 0.5rem; }
    .empty-state p { color: #64748b; }

    /* ── Grid ────────────────────────────────────────── */
    .offers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.75rem; padding: 2.5rem; max-width: 1400px; margin: 0 auto; }

    /* ── Card ────────────────────────────────────────── */
    .offer-card {
      background: white; border-radius: 20px; padding: 1.75rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      display: flex; flex-direction: column; gap: 0.85rem;
      transition: all 0.3s ease;
    }
    .offer-card:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(45,87,87,0.12); border-color: #a7d7a7; }

    .card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
    .company-row { display: flex; align-items: center; gap: 0.75rem; }
    .company-logo { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #2D5757, #1a3a3a); color: white; font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .company-name { font-weight: 700; color: #1e293b; font-size: 0.9rem; }
    .location { font-size: 0.78rem; color: #64748b; margin-top: 0.1rem; }

    .level-chip { padding: 0.3rem 0.75rem; border-radius: 8px; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.04em; white-space: nowrap; }
    .level-beginner     { background: #dcfce7; color: #166534; }
    .level-intermediate { background: #fef9c3; color: #854d0e; }
    .level-advanced     { background: #ffedd5; color: #9a3412; }
    .level-expert       { background: #fee2e2; color: #991b1b; }

    .job-title { font-size: 1.2rem; font-weight: 800; color: #1e293b; margin: 0; line-height: 1.3; }
    .job-desc { color: #475569; font-size: 0.9rem; line-height: 1.6; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; flex: 1; }

    .tags-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .tag { padding: 0.25rem 0.65rem; border-radius: 8px; font-size: 0.75rem; font-weight: 600; }
    .tag-contract { background: #eff6ff; color: #1d4ed8; }
    .tag-salary   { background: #f0fdf4; color: #15803d; }
    .tag-date     { background: #fff7ed; color: #c2410c; }

    .card-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 0.75rem; border-top: 1px solid #f1f5f9; margin-top: auto; }
    .pub-date { font-size: 0.75rem; color: #94a3b8; }
    .btn-apply { background: linear-gradient(135deg, #2D5757, #1a3a3a); color: white; border: none; padding: 0.65rem 1.5rem; border-radius: 10px; font-weight: 700; font-size: 0.88rem; cursor: pointer; transition: all 0.2s; position: relative; z-index: 999 !important; pointer-events: auto !important; }
    .btn-apply:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(45,87,87,0.4); }

    /* ── Modal ───────────────────────────────────────── */
    .modal-overlay { position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; background: rgba(0,0,0,0.75) !important; backdrop-filter: blur(8px) !important; z-index: 99998 !important; display: flex !important; align-items: center !important; justify-content: center !important; padding: 1.5rem; animation: fadeIn 0.3s ease; visibility: visible !important; opacity: 1 !important; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .modal { background: #ffffff !important; border-radius: 24px; width: 100%; max-width: 560px; padding: 2.25rem; position: relative !important; box-shadow: 0 40px 100px rgba(0,0,0,0.5); animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); max-height: 90vh; overflow-y: auto; z-index: 99999 !important; display: block !important; visibility: visible !important; opacity: 1 !important; }
    @keyframes slideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .modal-close { position: absolute; top: 1.25rem; right: 1.25rem; background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; font-size: 0.9rem; color: #64748b; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .modal-close:hover { background: #fee2e2; color: #ef4444; }

    .modal-tag { display: inline-block; background: #eff6ff; color: #1d4ed8; padding: 0.3rem 0.75rem; border-radius: 8px; font-size: 0.78rem; font-weight: 700; margin-bottom: 0.5rem; }
    .modal-header h2 { font-size: 1.4rem; font-weight: 800; color: #1e293b; margin: 0 0 0.3rem; }
    .modal-header p { color: #64748b; font-size: 0.9rem; margin: 0 0 1.5rem; }

    .apply-form { display: flex; flex-direction: column; gap: 1.1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
    .form-group label { font-size: 0.85rem; font-weight: 700; color: #334155; display: flex; align-items: center; gap: 0.4rem; }
    .lbl-icon { font-size: 1rem; }
    .req { color: #ef4444; }
    .form-input { padding: 0.85rem 1rem; border-radius: 10px; border: 1.5px solid #e2e8f0; background: #f8fafc; font-size: 0.95rem; color: #1e293b; font-family: inherit; width: 100%; transition: all 0.2s; }
    .form-input:focus { outline: none; border-color: #2D5757; background: white; box-shadow: 0 0 0 4px rgba(45,87,87,0.1); }
    textarea.form-input { resize: vertical; min-height: 110px; }
    .has-error .form-input { border-color: #fca5a5; background: #fff5f5; }
    .error-msg { font-size: 0.78rem; color: #ef4444; font-weight: 600; }
    .error-banner { background: #fff5f5; border: 1px solid #fecaca; border-radius: 10px; padding: 0.75rem 1rem; font-size: 0.85rem; color: #b91c1c; font-weight: 600; }

    .modal-actions { display: flex; gap: 0.75rem; justify-content: flex-end; padding-top: 0.5rem; }
    .btn-cancel-modal { background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.75rem 1.5rem; border-radius: 10px; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.2s; }
    .btn-cancel-modal:hover { background: #f1f5f9; }
    .btn-submit { background: linear-gradient(135deg, #2D5757, #1a3a3a); color: white; border: none; padding: 0.75rem 1.75rem; border-radius: 10px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.25s; box-shadow: 0 4px 12px rgba(45,87,87,0.3); }
    .btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(45,87,87,0.4); }
    .btn-submit:disabled { background: #94a3b8; box-shadow: none; cursor: not-allowed; }
    .btn-spin { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; }

    .btn-notif { 
      background: rgba(255,255,255,0.15); 
      backdrop-filter: blur(10px); 
      border-radius: 12px; 
      width: 48px; 
      height: 48px; 
      border: 1px solid rgba(255,255,255,0.2); 
      color: white; 
      font-size: 1.4rem; 
      cursor: pointer; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      position: relative; 
      transition: all 0.3s; 
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    .btn-notif:hover { background: rgba(255,255,255,0.25); transform: translateY(-2px); }
    .notif-badge { position: absolute; top: -5px; right: -5px; background: #ef4444; color: white; font-size: 0.65rem; font-weight: 800; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #1a3a3a; }
    .notif-overlay { position: fixed; inset: 0; z-index: 1000; cursor: default; }
    .notif-dropdown { 
      position: absolute; 
      top: calc(100% + 15px); 
      right: 0; 
      width: 280px; 
      background: white; 
      border-radius: 16px; 
      box-shadow: 0 10px 40px rgba(0,0,0,0.15); 
      overflow: hidden; 
      z-index: 1001; 
      animation: slideUp 0.3s ease; 
      color: #1e293b; 
      text-align: left;
      border: 1px solid rgba(0,0,0,0.05);
    }
    .notif-dropdown-header { 
      padding: 14px 20px; 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      background: #f8fafc; 
    }
    .notif-dropdown-header h4 { 
      margin: 0; 
      font-size: 0.9rem; 
      font-weight: 700; 
      color: #334155;
    }
    .notif-dropdown-header button { 
      background: none; 
      border: none; 
      font-size: 0.7rem; 
      color: #2D5757; 
      font-weight: 700; 
      cursor: pointer; 
    }
    .notif-dropdown-body { 
      max-height: 300px; 
      overflow-y: auto; 
    }
    .notif-empty { 
      padding: 3rem 1.5rem; 
      text-align: center; 
      color: #94a3b8; 
      font-size: 0.85rem; 
      font-weight: 500;
    }
    .notif-item { 
      padding: 12px 16px; 
      border-top: 1px solid #f1f5f9; 
      display: flex; 
      gap: 12px; 
      cursor: pointer; 
    }
    .notif-item:hover { background: #f8fafc; }
    .notif-item-icon { width: 32px; height: 32px; background: #dcfce7; color: #166534; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; }
    .notif-item-content { flex: 1; }
    .notif-item-content strong { display: block; font-size: 0.8rem; margin-bottom: 2px; }
    .notif-item-content p { margin: 0 0 4px 0; font-size: 0.75rem; color: #64748b; line-height: 1.3; }
    .notif-time { font-size: 0.65rem; color: #94a3b8; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }

    .success-state { text-align: center; padding: 2rem 1rem; }
    .success-icon { font-size: 3.5rem; display: block; margin-bottom: 1rem; }
    .success-state h3 { font-size: 1.4rem; font-weight: 800; color: #1e293b; margin: 0 0 0.5rem; }
    .success-state p { color: #64748b; margin: 0 0 1.5rem; }
    .btn-back-modal { background: linear-gradient(135deg, #2D5757, #1a3a3a); color: white; border: none; padding: 0.75rem 2rem; border-radius: 10px; font-weight: 700; cursor: pointer; }

    @media (max-width: 640px) {
      .hero-banner { flex-direction: column; padding: 2rem 1.5rem; }
      .hero-title { font-size: 1.9rem; }
      .hero-deco { display: none; }
      .offers-grid { grid-template-columns: 1fr; padding: 1.5rem; }
    }
  `]
})
export class JobOffersPublicComponent implements OnInit {
  @Output() onViewApplications = new EventEmitter<void>();
  isLoggedIn = false;
  offers: JobOffer[] = [];
  loading = true;

  showModal = false;
  selectedJob: JobOffer | null = null;
  submitted = false;
  submitting = false;
  errorMsg = '';

  toast: { message: string; type: 'success' | 'error' } | null = null;

  showNotifMenu = false;
  unreadNotifs: AppNotification[] = [];
  private subs: Subscription[] = [];

  applyForm: { bio: string; specialty: string; experience: string } = {
    bio: '', specialty: '', experience: ''
  };

  constructor(
    private svc: ApplicationService,
    private auth: AuthService,
    private router: Router,
    private notifSvc: NotificationWebSocketService
  ) {
    this.isLoggedIn = this.auth.isLoggedIn();
  }

  ngOnInit(): void {
    this.svc.getActiveJobs().subscribe({
      next: (data: JobOffer[]) => { this.offers = data; this.loading = false; },
      error: () => { this.offers = []; this.loading = false; }
    });

    // Listen to job notifications
    this.subs.push(
      this.notifSvc.getCareerUpdates().subscribe(n => {
        if (n) this.unreadNotifs.unshift(n);
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  toggleNotifMenu(): void {
    this.showNotifMenu = !this.showNotifMenu;
  }

  markAllAsRead(): void {
    this.unreadNotifs = [];
    this.showNotifMenu = false;
  }

  readNotif(n: AppNotification): void {
    this.unreadNotifs = this.unreadNotifs.filter(notif => notif !== n);
    this.showNotifMenu = false;
  }

  formatTime(timestamp: string): string {
    if (!timestamp) return 'Récemment';
    const d = new Date(timestamp);
    return isNaN(d.getTime()) ? timestamp : d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  getInitials(name?: string): string {
    if (!name) return 'C';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  getLevelLabel(level: string): string {
    const map: Record<string, string> = {
      BEGINNER: 'Débutant', INTERMEDIATE: 'Intermédiaire',
      ADVANCED: 'Avancé', EXPERT: 'Expert'
    };
    return map[level] ?? level;
  }

  openApply(job: JobOffer): void {
    console.log('[DEBUG] Clic sur Postuler pour:', job.title);
    if (!this.auth.isLoggedIn()) {
      console.warn('[DEBUG] Redirection login car non connecté');
      this.router.navigate(['/login']);
      return;
    }
    this.selectedJob = job;
    this.submitted = false;
    this.submitting = false;
    this.errorMsg = '';
    this.applyForm = { bio: '', specialty: '', experience: '' };
    this.showModal = true;
    console.log('[DEBUG] showModal mis à true');
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedJob = null;
  }

  submitApplication(valid: boolean | null): void {
    if (!valid || !this.selectedJob?.id) return;
    this.submitting = true;
    this.errorMsg = '';

    const request: ApplicationRequest = {
      bio: this.applyForm.bio,
      specialty: this.applyForm.specialty,
      experience: this.applyForm.experience,
      jobOfferId: this.selectedJob.id
    };

    this.svc.applyToJob(request).subscribe({
      next: () => {
        this.submitting = false;
        this.submitted = true;
        this.showToast('Candidature envoyée avec succès !', 'success');
      },
      error: (err: any) => {
        this.submitting = false;
        if (err.status === 409) {
          this.errorMsg = err.error?.message || 'Vous avez déjà postulé à cette offre.';
        } else {
          this.errorMsg = 'Erreur lors de l\'envoi. Veuillez réessayer.';
        }
        this.showToast(this.errorMsg, 'error');
      }
    });
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toast = { message, type };
    setTimeout(() => this.toast = null, 4000);
  }
}
