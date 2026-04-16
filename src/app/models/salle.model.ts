import { Materiel } from './materiel.model';

export interface Salle {
  id?: number;
  nom: string;
  capacite: number;
  materiels?: Materiel[];
}

// DTO léger utilisé dans classe-seance pour le dropdown des salles
export interface SalleDTO {
  id: number;
  nom: string;
  capacite: number;
}