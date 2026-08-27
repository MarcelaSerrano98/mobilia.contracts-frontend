import type { Party } from '../types/contract';

interface PartyListProps {
  parties: Party[];
}

/**
 * Lista de personas dentro de una celda de la tabla.
 *
 * <p>IMPORTANTE (estudiar) — Se usa el documento de identidad como {@code key}
 * y no el indice del array. La {@code key} es como React decide, entre dos
 * renders, que nodo de la lista vieja corresponde a cual de la nueva. Con el
 * indice, «el primero» siempre corresponde con «el primero», asi que al
 * reordenar o insertar por delante React conserva el nodo y le cambia el
 * contenido, en lugar de moverlo: el estado interno del nodo —el foco, una
 * seleccion de texto, una animacion a medias— se queda con la persona
 * equivocada.</p>
 *
 * <p>El documento de identidad es unico y no cambia, que es exactamente lo que
 * {@code key} necesita.</p>
 */
export function PartyList({ parties }: PartyListProps) {
  if (parties.length === 0) {
    /*
     * El enunciado pide que la celda quede vacia cuando no hay deudores
     * solidarios. Se pinta una raya y no una celda literalmente en blanco:
     * una celda vacia no distingue «no aplica» de «falta el dato o fallo
     * algo», y quien lee con un lector de pantalla no oiria nada en absoluto.
     * La raya es la convencion tipografica para «sin datos» y el aria-label
     * lo dice con palabras. La celda no contiene ningun nombre, que es lo que
     * el enunciado pide.
     */
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
