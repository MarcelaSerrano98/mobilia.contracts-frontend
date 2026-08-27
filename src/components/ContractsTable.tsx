import type { ContractSearchResult } from '../types/contract';
import { PartyList } from './PartyList';

interface ContractsTableProps {
  contracts: ContractSearchResult[];
}

/*
 * IMPORTANTE: tabla real y no una rejilla de <div>. Con `scope="col"` el lector
 * de pantalla dice a que columna pertenece cada celda; sin eso se oye un nombre
 * sin saber si es el arrendatario o un deudor, que es el dato que importa.
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
