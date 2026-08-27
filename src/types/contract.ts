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
  /**
   * IMPORTANTE (estudiar) — Por que este campo puede ser null.
   *
   * <p>El enunciado dice que todo contrato tiene un arrendatario, pero el
   * esquema JSON de la API admite que falte. Se declara {@code Party | null}
   * para reflejar la API y no el deseo: con {@code strictNullChecks} activo,
   * escribir {@code contract.tenant.fullName} deja de compilar y obliga a
   * decidir que se pinta cuando no hay nadie. Si se declarara {@code Party} a
   * secas, el mismo codigo compilaria y fallaria en tiempo de ejecucion con
   * un «cannot read property of null» delante del evaluador.</p>
   */
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
