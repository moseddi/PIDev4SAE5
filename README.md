

Ce dépôt centralise l'ensemble du projet **English School Platform**. Il est organisé selon une architecture **Monorepo** regroupant le frontend et les microservices backend.

## 📁 Structure du Projet

L'architecture est divisée en deux parties principales :

### 🎨 Frontend (`/frontend`)
*   **Technologie** : Angular
*   **Description** : Interface utilisateur pour la gestion de la plateforme scolaire, incluant les tableaux de bord, la gestion des cours et les évaluations.

### ⚙️ Backend (`/backend`)
Le backend est basé sur une architecture **Microservices** utilisant Spring Boot et Spring Cloud.

1.  **`eureka-server`** : Service de découverte (Discovery Server) permettant l'enregistrement de tous les microservices.
2.  **`api-gateway`** : Point d'entrée unique (Gateway) gérant le routage des requêtes vers les services appropriés.
3.  **`assessment-service`** : Gestion des évaluations et des scores.
4.  **`career-service`** : Gestion des offres d'emploi et des candidatures.
5.  **`quiz-service`** : Gestion des questionnaires et des examens.

---

## 🚀 Comment lancer le projet

### Prérequis
*   Java 17 ou supérieur
*   Node.js & npm (pour Angular)
*   Maven

### Étapes de démarrage

1.  **Lancer le Backend** :
    *   Commencez par lancer le `eureka-server`.
    *   Ensuite, lancez le `api-gateway`.
    *   Enfin, lancez les microservices métiers (`assessment`, `career`, `quiz`).
    
2.  **Lancer le Frontend** :
    *   Allez dans le dossier `frontend`.
    *   Exécutez `npm install`.
    *   Exécutez `npm start` ou `ng serve`.

---

## 🛠️ Technologies utilisées
*   **Frontend** : Angular, TypeScript, CSS, HTML5.
*   **Backend** : Java, Spring Boot, Spring Cloud (Eureka, Gateway), Maven.
*   **Base de données** : (Selon la configuration de chaque service).
