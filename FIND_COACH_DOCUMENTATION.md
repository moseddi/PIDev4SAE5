# Find Coach - Documentation Technique

## Table des Matières
1. [Architecture Générale](#architecture-générale)
2. [Flux Utilisateur](#flux-utilisateur)
3. [Composants et Fichiers](#composants-et-fichiers)
4. [API et Services](#api-et-services)
5. [Logique du Calendrier](#logique-du-calendrier)
6. [Modale de Réservation](#modale-de-réservation)

---

## Architecture Générale

### Route
- **URL**: `/find-coach`
- **Fichier de configuration**: `src/app/app.routes.ts`
- **Composant**: `FindCoachComponent`

### Dépendances
- `UserService`: Récupère les utilisateurs avec le rôle TUTOR
- `CoachingService`: Gère les séances et réservations
- `AuthService`: Authentification et informations utilisateur

---

## Flux Utilisateur

### 1. Affichage de la liste des Coachs
```
Page /find-coach → Chargement des utilisateurs → Filtrage par rôle TUTOR → Affichage grille
```

### 2. Sélection d'un Coach
```
Clic sur coach → loadSeancesForCoach(tutorId) → buildCalendar() → Affichage calendrier
```

### 3. Réservation
```
Clic sur date disponible → Ouverture modale → Formulaire pré-rempli → Soumission → Confirmation
```

---

## Composants et Fichiers

### 1. find-coach.component.ts
**Emplacement**: `src/app/coaching/find-coach/find-coach.component.ts`

#### Interfaces
```typescript
interface CalendarDay {
  date: string;           // Format: YYYY-MM-DD
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isAvailable: boolean;
  seances: Seance[];
}
```

#### Propriétés Principales
```typescript
coaches: any[]           // Liste des coachs (rôle TUTOR)
selectedCoach: any       // Coach actuellement sélectionné
allSeances: Seance[]    // Séances du coach sélectionné
calendarDays: CalendarDay[]  // Jours du calendrier

// Propriétés du calendrier
currentYear: number      // Année actuelle
currentMonth: number     // Mois actuel (0-11)
monthNames: string[]     // Noms des mois
dayNames: string[]       // Noms des jours (Sun-Sat)

// Modale de réservation
showReservationForm: boolean
selectedSeance: Seance | null
reservation: Reservation
```

#### Méthodes Principales

| Méthode | Description |
|---------|-------------|
| `loadCoaches()` | Charge tous les utilisateurs et filtre par rôle TUTOR |
| `loadSeancesForCoach(tutorId)` | Charge les séances d'un coach spécifique |
| `buildCalendar()` | Génère les jours du calendrier avec disponibilité |
| `selectCoach(coach)` | Sélectionne un coach et charge son calendrier |
| `goBackToCoaches()` | Revient à la liste des coaches |
| `onDateClick(day)` | Ouvre la modale de réservation pour une date |
| `openReservationForm(seance)` | Affiche le formulaire de réservation |
| `submitReservation()` | Soumet la réservation |
| `previousMonth()` | Mois précédent |
| `nextMonth()` | Mois suivant |
| `formatDate()` | Formate la date pour l'affichage |
| `formatTime()` | Formate l'heure (HH:mm) |

---

### 2. find-coach.component.html
**Emplacement**: `src/app/coaching/find-coach/find-coach.component.html`

#### Structure
```
├── Header (titre dynamique selon selectedCoach)
├── Loading spinner
├── Coaches Grid (visible si !selectedCoach)
│   └── Coach cards avec avatar, info, bouton
├── Calendar Section (visible si selectedCoach)
│   ├── Calendar header (mois/année, navigation)
│   ├── Calendar grid (7 colonnes)
│   │   └── Calendar days (cliquables si disponibles)
│   ├── Legend
│   └── No available dates message
└── Reservation Modal
    ├── Summary (coach, session, date, heure)
    └── Form (nom, date, boutons)
```

---

### 3. find-coach.component.css
**Emplacement**: `src/app/coaching/find-coach/find-coach.component.css`

#### Styles clés

| Classe | Description |
|--------|-------------|
| `.coaches-container` | Conteneur principal |
| `.coach-card` | Carte d'affichage d'un coach |
| `.calendar-section` | Section du calendrier |
| `.calendar-grid` | Grille 7x6 du calendrier |
| `.calendar-day` | Jour du calendrier |
| `.calendar-day.available` | Jour disponible (cliquable) |
| `.calendar-day.unavailable` | Jour non disponible |
| `.calendar-day.past` | Jour passé |
| `.calendar-day.today` | Jour actuel |
| `.modal-overlay` | Fond de la modale |
| `.modal-content` | Contenu de la modale |

---

### 4. coaching.service.ts
**Emplacement**: `src/app/coaching/service/coaching.service.ts`

#### Interfaces
```typescript
interface Seance {
  id?: number;
  goodName: string;
  seanceDate: string;      // "YYYY-MM-DD"
  seanceTime: string;       // "HH:mm:ss"
  reservations?: Reservation[];
}

interface Reservation {
  id?: number;
  studidname: string;
  merenumber: string;      // "YYYY-MM-DD"
  status: string;
  seance?: Seance;
}
```

#### Méthodes API

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `getAllSeances()` | GET `/api/seances` | Toutes les séances |
| `getSeanceById(id)` | GET `/api/seances/{id}` | Séance par ID |
| `getSeancesByTutor(tutorId)` | GET `/api/seances/tutor/{tutorId}` | Séances par coach |
| `createSeance(seance)` | POST `/api/seances` | Créer séance |
| `getAllReservations()` | GET `/api/reservations` | Toutes les réservations |
| `createReservation(seanceId, reservation)` | POST `/api/seances/{id}/reservations` | Créer réservation |

**API URL**: `http://localhost:8089/Coaching-service`

---

## Logique du Calendrier

### Règles de Disponibilité

Une date est **disponible** si et seulement si :
1. ✅ Il existe une séance pour cette date (`hasSeance`)
2. ✅ La séance n'a pas de réservation (`!hasReservations`)
3. ✅ La date n'est pas dans le passé (`!isPastDate`)

### Code de la Logique (buildCalendar)

```typescript
const today = new Date();
today.setHours(0, 0, 0, 0);

const date = new Date(currentYear, currentMonth, day);
const dateStr = formatDateStr(date);
const seancesForDay = allSeances.filter(s => s.seanceDate === dateStr);

const hasSeance = seancesForDay.length > 0;
const hasReservations = seancesForDay.some(seance => (seance.reservations?.length || 0) > 0);
const isPastDate = date.getTime() < today.getTime();

const isAvailable = hasSeance && !hasReservations && !isPastDate;
```

### Navigation entre Mois
- `previousMonth()`: Décrémente le mois,-wrap à décembre si janvier
- `nextMonth()`: Incrémente le mois,wrap à janvier si décembre
- Chaque navigation appelle `buildCalendar()`

---

## Modale de Réservation

### Ouverture
Déclenchée par `onDateClick(day)` quand:
- `day.isAvailable === true`
- `day.seances.length > 0`

### Pré-remplissage
- **Coach**: `selectedCoach.firstName + selectedCoach.lastName`
- **Date**: `selectedSeance.seanceDate` → `reservation.merenumber`
- **Nom étudiant**: `authService.getUser()` (depuis le contexte d'authentification)

### Formulaire
```html
<form>
  <!-- Nom (pré-rempli depuis l'utilisateur connecté) -->
  <input [(ngModel)]="reservation.studidname" name="studidname">
  
  <!-- Date (pré-remplie depuis la sélection) -->
  <input [(ngModel)]="reservation.merenumber" name="merenumber">
  
  <!-- Boutons -->
  <button type="submit">Confirmer la réservation</button>
  <button type="button" (click)="cancelReservation()">Annuler</button>
</form>
```

### Soumission
```typescript
submitReservation() {
  if (!selectedSeance?.id) return;
  
  coachingService.createReservation(selectedSeance.id, reservation)
    .subscribe({
      next: () => {
        successMessage = 'Réservation créée avec succès!';
        showReservationForm = false;
        loadSeancesForCoach(selectedCoach.id); // Rafraîchir
      },
      error: (err) => {
        error = 'Échec de la réservation';
      }
    });
}
```

---

## Points d'Intégration

### Navbar (Find Coach Link)
**Fichier**: `src/app/courses/navbar-front/navbar-front.component.html`
```html
<li><a routerLink="/find-coach"><i class="bi bi-person-search"></i> Find Coach</a></li>
```

### Routes
**Fichier**: `src/app/app.routes.ts`
```typescript
{ path: 'find-coach', component: FindCoachComponent }
```

---

## États du Calendrier

| État | Couleur | Cliquable | Description |
|------|---------|-----------|-------------|
| Available | Vert (#d4edda) | ✅ Oui | Séance sans réservation |
| Unavailable | Gris (#e9ecef) | ❌ Non | Pas de séance OU réservations |
| Today | Vert foncé (#2D5757) | - | Jour actuel |
| Other month | Gris clair | ❌ Non | Jours hors du mois actuel |
| Past | Gris très clair (#f5f5f5) | ❌ Non | Dates passées |

---

## Messages et Notifications

### Succès
```
"Reservation submitted successfully! Waiting for coach confirmation."
```
- Auto-dismiss après 5 secondes

### Erreur
```
"Failed to load coaches"
"Failed to create reservation. Please try again."
```

---

## Débogage

### Console Logs
- `console.error('Error loading coaches:', err)`
- `console.error('Error loading seances:', err)`
- `console.error('Error creating reservation:', err)`

### Vérifications
1. Backend API accessible sur `localhost:8089`
2. Utilisateurs avec rôle `TUTOR` existent
3. Séances créées pour les tutors
4. Headers d'authentification présents (si requis)

---

## Dépendances Externes

| Package | Utilisation |
|---------|-------------|
| Angular CommonModule | Directives ngIf, ngFor |
| Angular FormsModule | Formulaires réactifs |
| Angular RouterLink | Navigation |
| Bootstrap Icons | Icônes (bi-) |
| HttpClient | Appels API |