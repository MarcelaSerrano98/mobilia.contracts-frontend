/**
 * Tipos que reflejan el contrato de la API del back-end.
 *
 * Mantenerlos tipados es la razon principal para usar TypeScript aqui: si el
 * back-end renombra un campo, el compilador senala todos los puntos del front
 * que hay que ajustar, en lugar de aparecer como `undefined` en pantalla.
 */

/** Estados posibles de un contrato. */
export type ContractStatus = 'ACTIVO' | 'INACTIVO';

/** Tipos de inmueble admitidos. */
export type PropertyType = 'CASA' | 'APARTAMENTO' | 'LOCAL';

/** Persona vinculada a un contrato. */
export interface Party {
  fullName: string;
  documentNumber: string;
}

/** Fila de la tabla de resultados. */
export interface ContractSearchResult {
  contractCode: string;
  contractStatus: ContractStatus;
  propertyAddress: string;
  propertyType: PropertyType;
  /** El esquema garantiza uno por contrato, pero la API admite ausencia. */
  tenant: Party | null;
  owners: Party[];
  /** Lista vacia cuando el contrato no tiene deudores solidarios. */
  guarantors: Party[];
}

/** Envoltura de resultados paginados que devuelve la API. */
export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

/** Cuerpo de error uniforme de la API. */
export interface ApiErrorBody {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  details: string[];
}
