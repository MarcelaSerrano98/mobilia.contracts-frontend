import type { Party } from '../types/contract';

interface PartyListProps {
  parties: Party[];
}

export function PartyList({ parties }: PartyListProps) {
  if (parties.length === 0) {
    /*
     * El enunciado pide la celda vacia cuando no hay deudores. Se pinta una raya
     * porque una celda en blanco no distingue «no aplica» de «falta el dato», y
     * un lector de pantalla no anunciaria nada.
     */
    return <span className="party-list__empty" aria-label="Sin registros">—</span>;
  }

  return (
    <ul className="party-list">
      {parties.map((party) => (
        // IMPORTANTE: el documento como key y no el indice; si no, al reordenar
        // React reutiliza el nodo y su estado se queda con la persona equivocada.
        <li key={party.documentNumber} className="party-list__item">
          {party.fullName}
        </li>
      ))}
    </ul>
  );
}
