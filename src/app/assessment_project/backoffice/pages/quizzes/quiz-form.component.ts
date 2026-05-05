import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { Quiz, QuizQuestion, QuizAnswer } from '../../models/quiz.models';
import { QuizService } from '../../services/quiz.service';

@Component({
  selector: 'app-quiz-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="kahoot-editor" [formGroup]="quizForm">
      <!-- HEADER -->
      <header class="kahoot-header">
        <div class="header-left">
          <div class="kahoot-logo" routerLink="/backoffice/quizzes">Kahoot!</div>
          <div class="divider"></div>
          <div class="quiz-title-input">
            <input formControlName="title" placeholder="Entrez le titre du quiz..." class="title-field" />
            <button class="settings-btn" (click)="showSettings = !showSettings">Paramètres</button>
          </div>
        </div>
        <div class="header-right">
          <div class="status-indicator">
             <span class="check-icon">✓</span> Enregistré sous : Tes brouillons
          </div>
          <button class="header-btn preview">Aperçu</button>
          <button class="header-btn exit" routerLink="/backoffice/quizzes">Quitter</button>
          <button class="header-btn save" (click)="submit()" [disabled]="submitting">
            {{ submitting ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </header>

      <!-- MAIN CONTENT -->
      <div class="editor-body">
        <!-- LEFT SIDEBAR: QUESTION LIST -->
        <aside class="left-sidebar">
          <div class="question-previews">
            <div *ngFor="let q of questions.controls; let i = index" 
                 class="q-preview-card" 
                 [class.active]="currentQuestionIndex === i"
                 (click)="selectQuestion(i)">
              <div class="q-header">
                <span class="q-idx">{{ i + 1 }} {{ q.get('type')?.value === 'tf' ? 'Vrai ou faux' : 'Quiz' }}</span>
                <div class="q-mini-actions">
                    <button class="q-mini-btn" (click)="duplicateQuestion(i, $event)">📄</button>
                    <button class="q-mini-btn" (click)="removeQuestion(i, $event)" *ngIf="questions.length > 1">🗑️</button>
                </div>
              </div>
              <div class="q-preview-canvas">
                <div class="preview-text">{{ q.get('content')?.value || 'Écris ta question' }}</div>
                <div class="preview-media-min">🖼️</div>
                <div class="preview-answers-box" [class.tf]="q.get('type')?.value === 'tf'">
                  <div class="p-ans red"></div>
                  <div class="p-ans blue"></div>
                  <div class="p-ans yellow" *ngIf="q.get('type')?.value !== 'tf'"></div>
                  <div class="p-ans green" *ngIf="q.get('type')?.value !== 'tf'"></div>
                </div>
              </div>
            </div>
          </div>
          <button class="add-q-btn" (click)="addQuestion()">+ Ajouter</button>
        </aside>

        <!-- CENTER: CANVAS -->
        <main class="editor-canvas" *ngIf="currentQuestion" [formGroup]="currentQuestionGroup">
          <div class="canvas-content">
            <!-- Question Content -->
            <div class="question-box">
              <textarea formControlName="content" placeholder="Écris ta question" class="question-textarea"></textarea>
            </div>

            <!-- Media Placeholder -->
            <div class="media-box-container">
              <div class="media-box">
                <div class="media-placeholder">
                   <div class="media-icon-stack">
                       <span class="m-icon">🖼️</span>
                       <span class="m-icon">🎬</span>
                       <span class="m-icon">🎵</span>
                   </div>
                   <div class="media-add-circle">+</div>
                   <h3>Trouve et insère un contenu multimédia</h3>
                   <div class="media-actions">
                       <span class="import-link">Importer un fichier</span> ou dépose le fichier à importer ici
                   </div>
                </div>
              </div>
            </div>

            <!-- Answers Grid -->
            <div class="answers-grid" [class.tf-mode]="currentQuestionGroup.get('type')?.value === 'tf'" formArrayName="answers">
              <!-- ANS 1: RED / TRIANGLE -->
              <div class="ans-box red" [class.empty]="!getAnswerControl(0).value && currentQuestionGroup.get('type')?.value !== 'tf'">
                <div class="ans-icon-shape triangle">▲</div>
                <input [formControlName]="0" [placeholder]="currentQuestionGroup.get('type')?.value === 'tf' ? 'Vrai' : 'Ajouter la réponse 1'" class="ans-input" [readonly]="currentQuestionGroup.get('type')?.value === 'tf'" />
                <div class="ans-status-circle" (click)="setCorrectAnswer(0)" [class.selected]="isCorrectAnswer(0)"></div>
              </div>

              <!-- ANS 2: BLUE / DIAMOND -->
              <div class="ans-box blue" [class.empty]="!getAnswerControl(1).value && currentQuestionGroup.get('type')?.value !== 'tf'">
                <div class="ans-icon-shape diamond">◆</div>
                <input [formControlName]="1" [placeholder]="currentQuestionGroup.get('type')?.value === 'tf' ? 'Faux' : 'Ajouter la réponse 2'" class="ans-input" [readonly]="currentQuestionGroup.get('type')?.value === 'tf'" />
                <div class="ans-status-circle" (click)="setCorrectAnswer(1)" [class.selected]="isCorrectAnswer(1)"></div>
              </div>

              <!-- ANS 3: YELLOW / CIRCLE (Only for Quiz mode) -->
              <ng-container *ngIf="currentQuestionGroup.get('type')?.value !== 'tf'">
                <div class="ans-box yellow" [class.empty]="!getAnswerControl(2).value">
                  <div class="ans-icon-shape circle">●</div>
                  <input [formControlName]="2" placeholder="Ajouter la réponse 3" class="ans-input" />
                  <div class="ans-status-circle" (click)="setCorrectAnswer(2)" [class.selected]="isCorrectAnswer(2)"></div>
                </div>

                <!-- ANS 4: GREEN / SQUARE (Only for Quiz mode) -->
                <div class="ans-box green" [class.empty]="!getAnswerControl(3).value">
                  <div class="ans-icon-shape square">■</div>
                  <input [formControlName]="3" placeholder="Ajouter la réponse 4" class="ans-input" />
                  <div class="ans-status-circle" (click)="setCorrectAnswer(3)" [class.selected]="isCorrectAnswer(3)"></div>
                </div>
              </ng-container>
            </div>
          </div>
        </main>

        <!-- RIGHT SIDEBAR: SETTINGS -->
        <aside class="right-sidebar" *ngIf="currentQuestion" [formGroup]="currentQuestionGroup">
          <div class="settings-panel">
            <div class="panel-header">
                <h3>Paramètres des questions</h3>
                <button class="close-panel-btn">×</button>
            </div>

            <div class="settings-group">
              <label><span class="icon">🔄</span> Type de question</label>
              <select formControlName="type" class="settings-select" (change)="handleTypeChange()">
                <option value="quiz">Quiz</option>
                <option value="tf">Vrai ou faux</option>
              </select>
            </div>

            <div class="settings-group">
              <label><span class="icon">⏱️</span> Temps imparti</label>
              <select formControlName="timeLimit" class="settings-select">
                <option [value]="5">5 secondes</option>
                <option [value]="10">10 secondes</option>
                <option [value]="20">20 secondes</option>
                <option [value]="30">30 secondes</option>
                <option [value]="60">1 minute</option>
                <option [value]="120">2 minutes</option>
              </select>
            </div>

            <div class="settings-group">
              <label><span class="icon">💡</span> Points</label>
              <select class="settings-select">
                <option>Standard</option>
                <option>Points doubles</option>
                <option>Pas de points</option>
              </select>
            </div>

            <div class="panel-bottom-actions">
              <button class="p-btn delete-btn" (click)="removeQuestion(currentQuestionIndex, $event)">Supprimer</button>
              <button class="p-btn duplicate-btn" (click)="duplicateQuestion(currentQuestionIndex, $event)">Dupliquer</button>
            </div>
          </div>
        </aside>
      </div>

      <!-- SETTINGS MODAL -->
      <div class="settings-modal" *ngIf="showSettings" (click)="showSettings = false">
        <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
                <h3>Paramètres du Quiz</h3>
                <button class="close-btn" (click)="showSettings = false">×</button>
            </div>
            <div class="modal-body">
                <div class="field">
                    <label>Description du Quiz</label>
                    <textarea formControlName="description" placeholder="Écris une brève description de ton quiz..." class="modal-textarea"></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-done" (click)="showSettings = false">Terminé</button>
            </div>
        </div>
      </div>
      
      <div class="error-toast" *ngIf="apiError">{{ apiError }}</div>
    </div>
  `,
  styles: [`
    :host {
      --kahoot-bg: #F7EDE2;
      --kahoot-purple: #2D5757;
      --kahoot-dark-purple: #1a3a3a;
      --kahoot-red: #dc2626;
      --kahoot-blue: #1368ce;
      --kahoot-yellow: #d89e00;
      --kahoot-green: #26890c;
      --kahoot-white: #ffffff;
      --header-height: 60px;
      --sidebar-width: 240px;
      --right-panel-width: 320px;
    }

    .kahoot-editor {
      position: fixed;
      inset: 0;
      display: flex;
      flex-direction: column;
      background: var(--kahoot-bg);
      font-family: 'Open Sans', 'Montserrat', sans-serif;
      overflow: hidden;
      color: #2D5757;
      z-index: 9999;
    }

    /* HEADER */
    .kahoot-header {
      height: var(--header-height);
      background: var(--kahoot-white);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      border-bottom: 2px solid rgba(45, 87, 87, 0.1);
      z-index: 1001;
      box-shadow: 0 2px 10px rgba(45, 87, 87, 0.1);
    }

    .header-left { display: flex; align-items: center; gap: 1rem; flex: 1; }
    .kahoot-logo { 
      font-size: 1.6rem; 
      font-weight: 900; 
      color: var(--kahoot-purple); 
      cursor: pointer; 
      transition: all 0.3s ease;
      text-shadow: 0 2px 4px rgba(45, 87, 87, 0.2);
    }
    .kahoot-logo:hover {
      transform: scale(1.05);
      color: var(--kahoot-dark-purple);
    }
    .divider { 
      width: 2px; 
      height: 30px; 
      background: linear-gradient(180deg, rgba(45, 87, 87, 0.3), rgba(45, 87, 87, 0.1)); 
      border-radius: 1px;
    }
    .quiz-title-input { 
      display: flex; 
      align-items: center; 
      gap: 0.75rem; 
      flex: 1; 
      max-width: 500px; 
    }
    .title-field { 
      border: 2px solid rgba(45, 87, 87, 0.2); 
      padding: 0.6rem 1rem; 
      border-radius: 8px; 
      font-size: 0.9rem; 
      flex: 1; 
      font-weight: 700; 
      background: rgba(247, 237, 226, 0.3);
      transition: all 0.3s ease;
    }
    .title-field:focus {
      border-color: var(--kahoot-purple);
      background: var(--kahoot-white);
      box-shadow: 0 0 0 4px rgba(45, 87, 87, 0.1);
      outline: none;
    }
    .settings-btn { 
      background: linear-gradient(135deg, var(--kahoot-purple), var(--kahoot-dark-purple)); 
      color: var(--kahoot-white); 
      border: none; 
      padding: 0.6rem 1rem; 
      border-radius: 8px; 
      font-weight: 700; 
      cursor: pointer; 
      font-size: 0.85rem;
      transition: all 0.3s ease;
      box-shadow: 0 3px 10px rgba(45, 87, 87, 0.2);
    }
    .settings-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(45, 87, 87, 0.3);
    }

    .header-right { display: flex; align-items: center; gap: 1rem; }
    .status-indicator { 
      font-size: 0.8rem; 
      color: var(--kahoot-purple); 
      display: flex; 
      align-items: center; 
      gap: 0.5rem; 
      font-weight: 600;
      background: rgba(45, 87, 87, 0.1);
      padding: 0.4rem 0.8rem;
      border-radius: 20px;
    }
    .check-icon { 
      color: var(--kahoot-green); 
      font-weight: bold; 
      font-size: 0.9rem;
    }
    
    .header-btn { 
      padding: 0.6rem 1.2rem; 
      border-radius: 8px; 
      font-weight: 700; 
      cursor: pointer; 
      font-size: 0.85rem; 
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }
    .header-btn.preview { 
      background: var(--kahoot-white); 
      color: var(--kahoot-purple);
      border-color: rgba(45, 87, 87, 0.2);
    }
    .header-btn.preview:hover {
      background: rgba(45, 87, 87, 0.1);
      transform: translateY(-1px);
    }
    .header-btn.exit { 
      background: rgba(220, 38, 38, 0.1); 
      color: var(--kahoot-red);
      border-color: rgba(220, 38, 38, 0.2);
    }
    .header-btn.exit:hover {
      background: rgba(220, 38, 38, 0.2);
      transform: translateY(-1px);
    }
    .header-btn.save { 
      background: linear-gradient(135deg, var(--kahoot-purple), var(--kahoot-dark-purple)); 
      color: var(--kahoot-white); 
      border: none;
      box-shadow: 0 4px 12px rgba(45, 87, 87, 0.3);
    }
    .header-btn.save:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(45, 87, 87, 0.4);
    }
    .header-btn.save:disabled { 
      opacity: 0.5; 
      cursor: not-allowed; 
      transform: none !important;
    }

    /* EDITOR BODY */
    .editor-body { 
      flex: 1; 
      display: flex; 
      overflow: hidden; 
      height: calc(100vh - var(--header-height));
      position: relative;
    }

    /* LEFT SIDEBAR */
    .left-sidebar { 
      width: var(--sidebar-width); 
      background: var(--kahoot-white); 
      border-right: 2px solid rgba(45, 87, 87, 0.1); 
      display: flex; 
      flex-direction: column; 
      overflow-y: auto; 
      padding: 1.5rem 1rem; 
      gap: 1rem; 
    }
    .question-previews { 
      display: flex; 
      flex-direction: column; 
      gap: 1rem; 
    }
    .q-preview-card { 
      border-radius: 12px; 
      border: 3px solid rgba(45, 87, 87, 0.1); 
      background: linear-gradient(135deg, rgba(247, 237, 226, 0.5), rgba(247, 237, 226, 0.2)); 
      padding: 0.8rem; 
      cursor: pointer; 
      transition: all 0.3s ease; 
      position: relative; 
      box-shadow: 0 2px 8px rgba(45, 87, 87, 0.1);
    }
    .q-preview-card.active { 
      border-color: var(--kahoot-purple); 
      background: linear-gradient(135deg, rgba(45, 87, 87, 0.1), rgba(45, 87, 87, 0.05)); 
      transform: scale(1.02);
      box-shadow: 0 4px 16px rgba(45, 87, 87, 0.2);
    }
    .q-preview-card:hover:not(.active) {
      border-color: rgba(45, 87, 87, 0.3);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(45, 87, 87, 0.15);
    }
    .q-header { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      font-size: 0.75rem; 
      font-weight: 800; 
      color: var(--kahoot-purple); 
      margin-bottom: 0.5rem; 
    }
    .q-mini-actions { 
      display: flex; 
      gap: 0.25rem; 
      opacity: 0; 
      transition: opacity 0.3s ease; 
    }
    .q-preview-card:hover .q-mini-actions { opacity: 1; }
    .q-mini-btn { 
      background: var(--kahoot-white); 
      border: 1px solid rgba(45, 87, 87, 0.2); 
      font-size: 0.7rem; 
      cursor: pointer; 
      padding: 4px 6px; 
      border-radius: 4px; 
      transition: all 0.2s ease;
    }
    .q-mini-btn:hover { 
      background: rgba(45, 87, 87, 0.1); 
      transform: scale(1.1);
    }
    
    .q-preview-canvas { 
      height: 100px; 
      background: var(--kahoot-white); 
      border: 2px solid rgba(45, 87, 87, 0.1); 
      border-radius: 8px; 
      display: flex; 
      flex-direction: column; 
      padding: 0.5rem; 
      position: relative; 
    }
    .preview-text { 
      font-size: 0.6rem; 
      font-weight: 700; 
      text-align: center; 
      color: var(--kahoot-purple); 
      margin-bottom: 0.5rem; 
      line-height: 1.2;
    }
    .preview-media-min { 
      flex: 1; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-size: 1rem; 
      opacity: 0.4; 
    }
    .preview-answers-box { 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 2px; 
      height: 20px; 
      margin-top: auto; 
    }
    .preview-answers-box.tf { 
      grid-template-columns: 1fr 1fr; 
    }
    .p-ans { 
      height: 100%; 
      border-radius: 2px; 
      opacity: 0.8; 
      transition: opacity 0.3s ease;
    }
    .p-ans:hover { opacity: 1; }
    .p-ans.red { background: var(--kahoot-red); }
    .p-ans.blue { background: var(--kahoot-blue); }
    .p-ans.yellow { background: var(--kahoot-yellow); }
    .p-ans.green { background: var(--kahoot-green); }

    .add-q-btn { 
      background: linear-gradient(135deg, var(--kahoot-purple), var(--kahoot-dark-purple)); 
      color: var(--kahoot-white); 
      border: none; 
      padding: 1rem; 
      border-radius: 12px; 
      font-weight: 800; 
      cursor: pointer; 
      width: 100%; 
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(45, 87, 87, 0.3);
      font-size: 0.9rem;
    }
    .add-q-btn:hover { 
      transform: translateY(-2px); 
      box-shadow: 0 8px 20px rgba(45, 87, 87, 0.4);
    }
    .add-q-btn:active { 
      transform: translateY(0); 
    }

    /* CENTER CANVAS */
    .editor-canvas { 
      flex: 1; 
      overflow-y: auto; 
      display: flex; 
      justify-content: center; 
      padding: 2rem 1.5rem; 
      background: radial-gradient(circle, rgba(45, 87, 87, 0.05) 1px, transparent 1px); 
      background-size: 25px 25px;
      position: relative;
      z-index: 1;
    }
    .canvas-content { 
      width: 100%; 
      max-width: 900px; 
      display: flex; 
      flex-direction: column; 
      align-items: center; 
      gap: 2rem; 
    }

    .question-box { 
      width: 100%; 
      background: var(--kahoot-white); 
      padding: 2rem; 
      border-radius: 16px; 
      box-shadow: 0 8px 25px rgba(45, 87, 87, 0.1); 
      border: 2px solid rgba(45, 87, 87, 0.1);
      transition: all 0.3s ease;
    }
    .question-box:hover {
      border-color: rgba(45, 87, 87, 0.2);
      box-shadow: 0 12px 35px rgba(45, 87, 87, 0.15);
    }
    .question-textarea { 
      width: 100%; 
      border: none; 
      font-size: 1.6rem; 
      font-weight: 800; 
      text-align: center; 
      resize: none; 
      min-height: 80px; 
      outline: none; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      color: var(--kahoot-purple);
      background: transparent;
      transition: all 0.3s ease;
    }
    .question-textarea::placeholder {
      color: rgba(45, 87, 87, 0.4);
    }
    .question-textarea:focus {
      transform: scale(1.02);
    }

    .media-box-container { 
      width: 100%; 
      display: flex; 
      justify-content: center; 
    }
    .media-box { 
      width: 100%; 
      max-width: 600px; 
      aspect-ratio: 16 / 9; 
      background: linear-gradient(135deg, rgba(45, 87, 87, 0.05), rgba(45, 87, 87, 0.02)); 
      border-radius: 12px; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      position: relative; 
      border: 3px dashed rgba(45, 87, 87, 0.2);
      transition: all 0.3s ease;
    }
    .media-box:hover {
      border-color: rgba(45, 87, 87, 0.4);
      background: linear-gradient(135deg, rgba(45, 87, 87, 0.08), rgba(45, 87, 87, 0.04));
    }
    .media-placeholder { 
      text-align: center; 
      padding: 2rem; 
      color: var(--kahoot-purple); 
      opacity: 0.7;
    }
    .media-icon-stack { 
      font-size: 2.5rem; 
      margin-bottom: 1rem; 
      display: flex; 
      justify-content: center; 
      gap: 0.75rem; 
      opacity: 0.6; 
    }
    .media-add-circle { 
      width: 60px; 
      height: 60px; 
      background: var(--kahoot-white); 
      color: var(--kahoot-purple); 
      font-size: 2.5rem; 
      border-radius: 50%; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      margin: 0 auto 1rem; 
      box-shadow: 0 4px 15px rgba(45, 87, 87, 0.2); 
      font-weight: bold; 
      cursor: pointer; 
      transition: all 0.3s ease;
      border: 3px solid var(--kahoot-purple);
    }
    .media-add-circle:hover {
      transform: scale(1.1) rotate(90deg);
      box-shadow: 0 8px 25px rgba(45, 87, 87, 0.3);
    }
    .media-placeholder h3 { 
      font-size: 1.3rem; 
      margin: 0 0 0.75rem; 
      font-weight: 700; 
      color: var(--kahoot-purple);
    }
    .media-actions { 
      font-size: 0.9rem; 
      color: var(--kahoot-purple); 
      font-weight: 600;
    }
    .import-link { 
      color: var(--kahoot-purple); 
      text-decoration: underline; 
      cursor: pointer; 
      font-weight: 700; 
      transition: all 0.3s ease;
    }
    .import-link:hover {
      color: var(--kahoot-dark-purple);
    }

    .answers-grid { 
      width: 100%; 
      display: grid; 
      grid-template-columns: 1fr 1fr; 
      gap: 1rem; 
    }
    .answers-grid.tf-mode { 
      grid-template-columns: 1fr 1fr; 
    }
    .ans-box { 
      height: 85px; 
      border-radius: 12px; 
      display: flex; 
      align-items: center; 
      padding: 0 1.2rem; 
      color: var(--kahoot-white); 
      transition: all 0.3s ease; 
      position: relative; 
      box-shadow: 0 4px 0 rgba(0,0,0,0.2); 
      cursor: pointer;
      border: 2px solid transparent;
    }
    .ans-box.empty { 
      opacity: 0.7; 
      border-style: dashed;
    }
    .ans-box:hover { 
      transform: translateY(-3px); 
      box-shadow: 0 8px 0 rgba(0,0,0,0.3); 
    }
    .ans-box.selected {
      border-color: var(--kahoot-white);
      transform: scale(1.02);
    }
    
    .ans-box.red { 
      background: linear-gradient(135deg, var(--kahoot-red), #b91c1c); 
    }
    .ans-box.blue { 
      background: linear-gradient(135deg, var(--kahoot-blue), #0ea5e9); 
    }
    .ans-box.yellow { 
      background: linear-gradient(135deg, var(--kahoot-yellow), #c4940a); 
    }
    .ans-box.green { 
      background: linear-gradient(135deg, var(--kahoot-green), #1f6b08); 
    }

    .ans-icon-shape { 
      font-size: 1.8rem; 
      width: 45px; 
      text-align: center;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
    }
    .ans-input { 
      flex: 1; 
      border: none; 
      background: transparent; 
      color: var(--kahoot-white); 
      font-size: 1.2rem; 
      font-weight: 800; 
      outline: none; 
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .ans-input::placeholder { 
      color: rgba(255,255,255,0.7); 
      font-weight: 600;
    }
    .ans-input:read-only {
      cursor: default;
      opacity: 0.9;
    }
    
    .ans-status-circle { 
      width: 35px; 
      height: 35px; 
      border: 3px solid rgba(255,255,255,0.7); 
      border-radius: 50%; 
      cursor: pointer; 
      position: relative; 
      transition: all 0.3s ease;
    }
    .ans-status-circle:hover {
      border-color: var(--kahoot-white);
      transform: scale(1.1);
    }
    .ans-status-circle.selected::after { 
      content: '✓'; 
      position: absolute; 
      inset: 0; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-weight: 900; 
      color: var(--kahoot-white); 
      font-size: 1.3rem; 
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    .ans-status-circle.selected { 
      background: var(--kahoot-green); 
      border-color: var(--kahoot-white); 
      box-shadow: 0 4px 12px rgba(38, 137, 12, 0.4);
    }

    /* RIGHT SIDEBAR */
    .right-sidebar { 
      width: var(--right-panel-width); 
      background: var(--kahoot-white); 
      border-left: 2px solid rgba(45, 87, 87, 0.1); 
      padding: 2rem; 
      overflow-y: auto; 
      position: relative;
      z-index: 10;
      flex-shrink: 0;
    }
    .settings-panel { 
      display: flex; 
      flex-direction: column; 
      gap: 2rem; 
    }
    .panel-header { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      margin-bottom: 1rem; 
    }
    .panel-header h3 { 
      font-size: 1.1rem; 
      font-weight: 800; 
      margin: 0; 
      color: var(--kahoot-purple); 
    }
    .close-panel-btn { 
      background: none; 
      border: none; 
      font-size: 1.5rem; 
      cursor: pointer; 
      opacity: 0.5; 
      color: var(--kahoot-purple);
      transition: all 0.3s ease;
    }
    .close-panel-btn:hover {
      opacity: 1;
      transform: rotate(90deg);
    }

    .settings-group { 
      margin-bottom: 1.5rem; 
    }
    .settings-group label { 
      display: block; 
      font-size: 0.85rem; 
      font-weight: 700; 
      color: var(--kahoot-purple); 
      margin-bottom: 0.75rem; 
    }
    .settings-group .icon {
      margin-right: 0.5rem;
    }
    .settings-select { 
      width: 100%; 
      padding: 0.8rem; 
      border: 2px solid rgba(45, 87, 87, 0.2); 
      border-radius: 8px; 
      font-weight: 700; 
      font-size: 0.9rem; 
      appearance: none; 
      background: rgba(247, 237, 226, 0.3);
      color: var(--kahoot-purple);
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .settings-select:focus {
      border-color: var(--kahoot-purple);
      background: var(--kahoot-white);
      box-shadow: 0 0 0 4px rgba(45, 87, 87, 0.1);
      outline: none;
    }

    .panel-bottom-actions { 
      display: flex; 
      flex-direction: column; 
      gap: 1rem; 
      margin-top: 2rem; 
    }
    .p-btn { 
      width: 100%; 
      padding: 0.8rem; 
      border-radius: 8px; 
      font-weight: 800; 
      border: none; 
      cursor: pointer; 
      font-size: 0.9rem; 
      transition: all 0.3s ease;
    }
    .delete-btn { 
      background: rgba(220, 38, 38, 0.1); 
      color: var(--kahoot-red); 
      border: 2px solid rgba(220, 38, 38, 0.2);
    }
    .delete-btn:hover { 
      background: rgba(220, 38, 38, 0.2); 
      transform: translateY(-2px);
    }
    .duplicate-btn { 
      background: rgba(45, 87, 87, 0.1); 
      color: var(--kahoot-purple); 
      border: 2px solid rgba(45, 87, 87, 0.2);
    }
    .duplicate-btn:hover { 
      background: rgba(45, 87, 87, 0.2); 
      transform: translateY(-2px);
    }

    /* MODAL */
    .settings-modal { 
      position: fixed; 
      inset: 0; 
      background: rgba(45, 87, 87, 0.6); 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      z-index: 10000; 
      backdrop-filter: blur(8px);
    }
    .modal-card { 
      background: var(--kahoot-white); 
      width: 90%; 
      max-width: 550px; 
      border-radius: 16px; 
      box-shadow: 0 20px 60px rgba(45, 87, 87, 0.3); 
      overflow: hidden; 
      border: 2px solid rgba(45, 87, 87, 0.2);
    }
    .modal-header { 
      padding: 1.5rem; 
      border-bottom: 2px solid rgba(45, 87, 87, 0.1); 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      background: linear-gradient(135deg, rgba(45, 87, 87, 0.05), rgba(45, 87, 87, 0.02));
    }
    .modal-header h3 { 
      margin: 0; 
      font-size: 1.3rem; 
      font-weight: 800; 
      color: var(--kahoot-purple); 
    }
    .close-btn { 
      background: none; 
      border: none; 
      font-size: 1.8rem; 
      cursor: pointer; 
      color: var(--kahoot-purple);
      transition: all 0.3s ease;
    }
    .close-btn:hover {
      transform: rotate(90deg);
      color: var(--kahoot-dark-purple);
    }
    .modal-body { 
      padding: 2rem; 
    }
    .modal-textarea { 
      width: 100%; 
      min-height: 140px; 
      border: 2px solid rgba(45, 87, 87, 0.2); 
      padding: 1rem; 
      border-radius: 8px; 
      font-size: 0.95rem; 
      outline: none; 
      transition: border 0.3s ease;
      background: rgba(247, 237, 226, 0.3);
      color: var(--kahoot-purple);
      font-family: inherit;
    }
    .modal-textarea:focus { 
      border-color: var(--kahoot-purple); 
      background: var(--kahoot-white);
      box-shadow: 0 0 0 4px rgba(45, 87, 87, 0.1);
    }
    .modal-footer { 
      padding: 1.5rem; 
      background: linear-gradient(135deg, rgba(45, 87, 87, 0.05), rgba(45, 87, 87, 0.02)); 
      display: flex; 
      justify-content: flex-end; 
    }
    .btn-done { 
      background: linear-gradient(135deg, var(--kahoot-purple), var(--kahoot-dark-purple)); 
      color: var(--kahoot-white); 
      border: none; 
      padding: 0.8rem 2.5rem; 
      border-radius: 8px; 
      font-weight: 800; 
      cursor: pointer; 
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(45, 87, 87, 0.3);
    }
    .btn-done:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(45, 87, 87, 0.4);
    }

    .error-toast { 
      position: fixed; 
      bottom: 2rem; 
      left: 50%; 
      transform: translateX(-50%); 
      background: linear-gradient(135deg, var(--kahoot-red), #b91c1c); 
      color: var(--kahoot-white); 
      padding: 1rem 2rem; 
      border-radius: 50px; 
      font-weight: 700; 
      box-shadow: 0 10px 30px rgba(220, 38, 38, 0.4); 
      z-index: 10001; 
      font-size: 0.95rem;
      border: 2px solid rgba(255, 255, 255, 0.2);
    }
  `]
})
export class QuizFormComponent implements OnInit {
  quizForm!: FormGroup;
  isEdit = false;
  submitting = false;
  apiError = '';
  currentQuestionIndex = 0;
  showSettings = false;

  constructor(
    private fb: FormBuilder,
    private quizService: QuizService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  get f() { return this.quizForm.controls; }
  get questions() { return this.quizForm.get('questions') as FormArray; }
  get currentQuestionGroup() { return this.questions.at(this.currentQuestionIndex) as FormGroup; }
  get currentQuestion() { return this.questions.at(this.currentQuestionIndex); }

  ngOnInit(): void {
    this.quizForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      questions: this.fb.array([])
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.loadQuiz(+id);
    } else {
      this.addQuestion();
    }
  }

  loadQuiz(id: number): void {
    this.quizService.getQuizById(id).subscribe({
      next: (quiz) => {
        this.quizForm.patchValue({
          title: quiz.title,
          description: quiz.description
        });
        if (quiz.questions && quiz.questions.length > 0) {
          quiz.questions.forEach(q => this.addQuestion(q));
          this.currentQuestionIndex = 0;
        } else {
          this.addQuestion();
        }
      },
      error: () => this.addQuestion()
    });
  }

  addQuestion(q?: QuizQuestion): void {
    const isTF = q?.answers?.length === 2;
    const questionGroup = this.fb.group({
      id: [q?.id],
      type: [isTF ? 'tf' : 'quiz'],
      content: [q?.content || ''],
      timeLimit: [q?.timeLimit || 20],
      answers: this.fb.array([
        this.fb.control(q?.answers?.[0]?.content || (isTF ? 'Vrai' : '')),
        this.fb.control(q?.answers?.[1]?.content || (isTF ? 'Faux' : '')),
        this.fb.control(q?.answers?.[2]?.content || ''),
        this.fb.control(q?.answers?.[3]?.content || '')
      ]),
      correctAnswer: [q?.answers?.findIndex(a => a.isCorrect) !== -1 ? q?.answers?.findIndex(a => a.isCorrect) : 0]
    });
    this.questions.push(questionGroup);
    this.currentQuestionIndex = this.questions.length - 1;
  }

  handleTypeChange(): void {
    const type = this.currentQuestionGroup.get('type')?.value;
    const answers = this.currentQuestionGroup.get('answers') as FormArray;

    if (type === 'tf') {
      answers.at(0).setValue('Vrai');
      answers.at(1).setValue('Faux');
      answers.at(2).setValue('');
      answers.at(3).setValue('');
      if (this.currentQuestionGroup.get('correctAnswer')?.value > 1) {
        this.currentQuestionGroup.patchValue({ correctAnswer: 0 });
      }
    }
  }

  selectQuestion(index: number): void {
    this.currentQuestionIndex = index;
  }

  getAnswerControl(index: number): any {
    return (this.currentQuestionGroup.get('answers') as FormArray).at(index);
  }

  setCorrectAnswer(index: number): void {
    this.currentQuestionGroup.patchValue({ correctAnswer: index });
  }

  isCorrectAnswer(index: number): boolean {
    return this.currentQuestionGroup.get('correctAnswer')?.value === index;
  }

  removeQuestion(index: number, event: Event): void {
    event.stopPropagation();
    this.questions.removeAt(index);
    if (this.currentQuestionIndex >= this.questions.length) {
      this.currentQuestionIndex = this.questions.length - 1;
    }
    if (this.questions.length === 0) {
      this.addQuestion();
    }
  }

  duplicateQuestion(index: number, event: Event): void {
    event.stopPropagation();
    const original = this.questions.at(index).value;
    const duplicate = { ...original, id: undefined };
    this.addQuestion(duplicate);
  }

  submit(): void {
    if (this.quizForm.invalid) {
      this.apiError = 'Titre du quiz requis.';
      setTimeout(() => this.apiError = '', 3000);
      return;
    }

    this.submitting = true;
    const formValue = this.quizForm.value;

    const transformedQuestions = formValue.questions.map((q: any) => {
      const isTF = q.type === 'tf';
      const numAnswers = isTF ? 2 : 4;

      const answers: QuizAnswer[] = [];
      for (let i = 0; i < numAnswers; i++) {
        answers.push({
          content: q.answers[i] || (isTF ? (i === 0 ? 'Vrai' : 'Faux') : `Option ${i + 1}`),
          isCorrect: q.correctAnswer === i,
          question: {} as QuizQuestion
        });
      }

      return {
        id: q.id,
        content: q.content || 'Question sans libellé',
        timeLimit: parseInt(q.timeLimit, 10),
        answers: answers
      } as QuizQuestion;
    });

    const quizPayload: Quiz = {
      id: this.isEdit ? +this.route.snapshot.paramMap.get('id')! : undefined,
      title: formValue.title || 'Nouveau Quiz',
      description: formValue.description || '',
      createdBy: 1,
      questions: transformedQuestions
    };

    const id = this.route.snapshot.paramMap.get('id');
    const request = id
      ? this.quizService.updateQuiz(+id, quizPayload)
      : this.quizService.createQuiz(quizPayload);

    request.subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/backoffice/quizzes']);
      },
      error: (err) => {
        this.submitting = false;
        this.apiError = 'Erreur: ' + (err.message || 'Serveur indisponible');
        setTimeout(() => this.apiError = '', 4000);
      }
    });
  }
}
