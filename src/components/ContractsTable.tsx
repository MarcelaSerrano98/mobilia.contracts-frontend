import type { ContractSearchResult } from '../types/contract';
import { PartyList } from './PartyList';

interface ContractsTableProps {
  contracts: ContractSearchResult[];
}

/**
 * Tabla de resultados con las columnas que exige el enunciado.
 *
 * <p>IMPORTANTE (estudiar) — Se usa una tabla HTML real y no una rejilla de
 * {@code <div>}. Con CSS Grid se consigue el mismo dibujo, pero se pierde lo
 * que no se ve: {@code <th scope="col">} hace que un lector de pantalla, al
 * llegar a una celda cualquiera, anuncie antes a que columna pertenece. Sin
 * eso, quien navega a oidas escucha «Juan Carlos Perez Gomez» sin saber si es
 * el arrendatario o un deudor solidario, que es justo el dato que la pantalla
 * existe para dar.</p>
 *
 * <p>El {@code <caption>} nombra la tabla entera y se oculta visualmente con
 * la clase {@code sr-only}: sigue disponible para las tecnologias de asistencia
 * sin ocupar espacio en pantalla.</p>
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
