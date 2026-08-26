import type { Party } from '../types/contract';

interface PartyListProps {
  parties: Party[];
}

/**
 * Lista de personas dentro de una celda de la tabla.
 *
 * <p>Se usa el documento de identidad como {@code key} en lugar del indice del
 * array: es unico y estable, de modo que React puede reutilizar los nodos si la
 * lista cambia de orden.</p>
 */
export function PartyList({ parties }: PartyListProps) {
  if (parties.length === 0) {
    // El enunciado pide dejar la celda vacia cuando no aplica.
    return <span className="party-list__empty" aria-label="Sin registros">—</span>;
  }

  return (
    <ul className="party-list">
      {parties.map((party) => (
        <li key={party.documentNumber} className="party-list__item">
          {party.fullName}
        </li>
      ))}
    </ul>
  );
}
