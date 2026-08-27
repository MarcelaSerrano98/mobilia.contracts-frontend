/*
 * Estos tipos son un espejo del JSON del back-end, no un modelo propio: si algo
 * aqui no encaja con la pantalla, se adapta al usarlo, no cambiando el tipo.
 */

export type ContractStatus = 'ACTIVO' | 'INACTIVO';

export type PropertyType = 'CASA' | 'APARTAMENTO' | 'LOCAL';

export interface Party {
  fullName: string;
  documentNumber: string;
}

export interface ContractSearchResult {
  contractCode: string;
  contractStatus: ContractStatus;
  propertyAddress: string;
  propertyType: PropertyType;
  /*
   * IMPORTANTE: el enunciado dice que siempre hay arrendatario, pero el esquema
   * de la API admite que falte. Se declara nullable para que el compilador
   * obligue a decidir que se pinta, en vez de fallar en tiempo de ejecucion.
   */
  tenant: Party | null;
  owners: Party[];
  guarantors: Party[];
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface ApiErrorBody {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  details: string[];
}
