/**
 * Configuration centralisée de la navigation entre frontoffice et backoffice.
 * Modifier ces chemins ici pour changer les liens dans toute l'application.
 */
export const APP_NAVIGATION = {
  /** Racine du site public (frontoffice) */
  frontOfficeRoot: '/assessment/frontoffice',
  /** Racine de l'administration (backoffice) */
  backOfficeRoot: '/backoffice',
} as const;

/** Entrée de menu backoffice (sidebar) */
export interface BackOfficeNavItem {
  route: string;
  label: string;
  icon: string;
  badge?: string;
  liveDot?: boolean;
  main?: boolean;
}

/** Groupe de menu backoffice */
export interface BackOfficeNavGroup {
  title: string;
  items: BackOfficeNavItem[];
}

/** Configuration du menu backoffice (routes absolues pour une navigation fiable) */
export const BACKOFFICE_NAV: { main: BackOfficeNavItem; groups: BackOfficeNavGroup[] } = {
  main: {
    route: '/backoffice/dashboard',
    label: 'Tableau de bord',
    icon: '🏠',
    main: true,
  },

  groups: [
    {
      title: 'GESTION SCOLAIRE',
      items: [
        { route: '/backoffice/admin/users', label: 'Utilisateurs', icon: 'bi-people' },
        { route: '/backoffice/admin/classes', label: 'Classes', icon: 'bi-door-open' },
        { route: '/backoffice/admin/seances', label: 'Séances', icon: 'bi-clock' },
        { route: '/backoffice/admin/coaching-reservations', label: 'Réservations Coaching', icon: 'bi-calendar-check' },
      ],
    },
    {
      title: 'INFRASTRUCTURE',
      items: [
        { route: '/backoffice/admin/salles', label: 'Salles', icon: 'bi-building' },
        { route: '/backoffice/admin/materiels', label: 'Matériels', icon: 'bi-laptop' },
        { route: '/backoffice/admin/physicalspace', label: 'Espace Physique', icon: 'bi-geo-alt' },
      ],
    },
    {
      title: 'VIE ÉTUDIANTE',
      items: [
        { route: '/backoffice/admin/events', label: 'Événements', icon: 'bi-calendar-event' },
        { route: '/backoffice/admin/clubs', label: 'Clubs', icon: 'bi-chat-heart' },
      ],
    },
    {
      title: 'SYSTÈME',
      items: [
        { route: '/backoffice/admin/stats', label: 'Statistiques', icon: 'bi-graph-up' },
        { route: '/backoffice/admin/notifications', label: 'Notifications', icon: 'bi-bell' },
        { route: '/backoffice/admin/warnings', label: 'Alertes & Warnings', icon: 'bi-exclamation-triangle' },
      ],
    },
    {
      title: '🎮 MODE JEU',
      items: [
        { route: '/backoffice/quizzes', label: 'Quizzes', icon: '🕹️' },
        { route: '/backoffice/game-sessions', label: 'Sessions Direct', icon: '📡' },
      ],
    },
    {
      title: '💼 RECRUTEMENT',
      items: [
        { route: '/backoffice/job-offers', label: 'Offres d\'Emploi', icon: '💼' },
        { route: '/backoffice/applications', label: 'Candidatures', icon: '📩' },
      ],
    },
    {
      title: '📝 EXAMENS & ÉVALS',
      items: [
        { route: '/backoffice/assessment-exams', label: 'Examens / Tests', icon: '📋', badge: 'PDF' },
      ],
    },
    {
      title: '📡 CANAUX & COMMUNICATION',
      items: [
        { route: '/backoffice/admin/channels', label: 'Gestion des Canaux', icon: '📡' },
      ],
    },
  ],
};


/** Entrée de menu frontoffice (navbar) */
export interface FrontOfficeNavItem {
  route: string;
  label: string;
}

/** Configuration du menu frontoffice principal */
export const FRONTOFFICE_NAV: FrontOfficeNavItem[] = [
  { route: '/assessment/frontoffice/examens', label: '📝 Examens' },
  { route: '/assessment/frontoffice/quiz', label: '🎯 Quiz Interactifs' },
  { route: '/assessment/frontoffice/quiz/live', label: '🎮 Quiz Live' },
  { route: '/assessment/frontoffice/mes-resultats', label: '📊 Mes Résultats' },
  { route: '/assessment/frontoffice/mes-notes-examen', label: '📋 Mes Notes' },
  { route: '/assessment/frontoffice/recruitment', label: '💼 Recrutement' },
  { route: '/assessment/frontoffice/canaux', label: '📡 Canaux' }
];

/** Configuration du menu frontoffice (Examens - Conservé pour compatibilité) */
export const EXAM_NAV: FrontOfficeNavItem[] = [
  { route: '/assessment/frontoffice/examens', label: '📝 Examens' },
  { route: '/assessment/frontoffice/mes-resultats', label: '📊 Mes Résultats' },
  { route: '/assessment/frontoffice/mes-notes-examen', label: '📋 Mes Notes' },
];

/** Configuration du menu frontoffice (Quiz - Conservé pour compatibilité) */
export const QUIZ_NAV: FrontOfficeNavItem[] = [
  { route: '/assessment/frontoffice/quiz', label: '🎯 Quiz Interactifs' },
  { route: '/assessment/frontoffice/quiz/live', label: '🎮 Quiz Live' },
];

