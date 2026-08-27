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
 *
 * <p>Las clases van en cada {@code <th>} y {@code <td>} en lugar de apoyarse en
 * selectores de elemento: mantiene toda la hoja de estilos en un unico nivel de
 * especificidad y evita que una regla de tabla pise sin querer a otra.</p>
 */
export function ContractsTable({ contracts }: ContractsTableProps) {
  return (
    <div className="ledger-wrap">
      <table className="ledger">
        <caption className="sr-only">Contratos encontrados</caption>

        <thead>
          <tr>
            <th className="ledger__head" scope="col">Código</th>
            <th className="ledger__head" scope="col">Estado</th>
            <th className="ledger__head" scope="col">Dirección del inmueble</th>
            <th className="ledger__head" scope="col">Arrendatario</th>
            <th className="ledger__head" scope="col">Propietarios</th>
            <th className="ledger__head" scope="col">Deudores solidarios</th>
          </tr>
        </thead>

        <tbody>
          {contracts.map((contract) => (
            <tr className="ledger__row" key={contract.contractCode}>
              <td className="ledger__cell ledger__cell--code">
                {contract.contractCode}
              </td>

              <td className="ledger__cell">
                <span
                  className={`stamp stamp--${contract.contractStatus.toLowerCase()}`}
                >
                  {contract.contractStatus}
                </span>
              </td>

              <td className="ledger__cell">
                {contract.propertyAddress}
                <span className="ledger__property-type">
                  {contract.propertyType}
                </span>
              </td>

              <td className="ledger__cell">{contract.tenant?.fullName ?? '—'}</td>

              <td className="ledger__cell">
                <PartyList parties={contract.owners} />
              </td>

              <td className="ledger__cell">
                <PartyList parties={contract.guarantors} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
