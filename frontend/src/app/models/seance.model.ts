export type TypeSeance = 'PRESENTIEL' | 'EN_LIGNE';

export interface Seance {
  id?: number;
  dateDebut: string;
  dateFin: string;
  type: TypeSeance;
  jour?: string;
  salleId?: number | null;
  salleNom?: string | null;
  classe?: { id?: number; nom: string } | null;
}

export interface SeanceSaveResponse {
  seance: Seance;
  warnings: string[];
}