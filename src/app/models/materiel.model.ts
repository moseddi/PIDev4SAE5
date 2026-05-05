import { Salle } from './salle.model';

export interface Materiel {
  id?: number;
  nom: string;
  status: string;
  /** Usage hours (server-side cumulative). */
  dureeUtilisation?: number;
  /** Maintenance alert threshold in hours (default 100 on server). */
  seuilMaintenance?: number;
  quantiteTotale?: number;
  quantiteAssociee?: number;
  /** total - assigned (from API or compute client-side) */
  quantiteRestante?: number;
  salle?: Salle | null;
}
