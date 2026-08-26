import type { ContractSearchResult } from '../types/contract';
import { PartyList } from './PartyList';

interface ContractsTableProps {
  contracts: ContractSearchResult[];
}

/**
 * Tabla de resultados con las columnas que exige el enunciado.
 *
 * <p>Se usa una tabla HTML real y no una rejilla de {@code <div>}: los datos son
 * tabulares, y el marcado semantico permite que un lector de pantalla anuncie a
 * que columna pertenece cada celda.</p>
 */
export function ContractsTable({ contracts }: ContractsTableProps) {
  return (
    <div className="table-wrapper">
      <table className="contracts-table">
        <caption className="contracts-table__caption">
          Contratos encontrados
        </caption>

        <thead>
          <tr>
            <th scope="col">Código</th>
            <th scope="col">Estado</th>
            <th scope="col">Dirección del inmueble</th>
            <th scope="col">Arrendatario</th>
            <th scope="col">Propietarios</th>
            <th scope="col">Deudores solidarios</th>
          </tr>
        </thead>

        <tbody>
          {contracts.map((contract) => (
            <tr key={contract.contractCode}>
              <td className="contracts-table__code">{contract.contractCode}</td>

              <td>
                <span
                  className={`badge badge--${contract.contractStatus.toLowerCase()}`}
                >
                  {contract.contractStatus}
                </span>
              </td>

              <td>
                {contract.propertyAddress}
                <span className="contracts-table__property-type">
                  {contract.propertyType}
                </span>
              </td>

              <td>{contract.tenant?.fullName ?? '—'}</td>

              <td>
                <PartyList parties={contract.owners} />
              </td>

              <td>
                <PartyList parties={contract.guarantors} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
