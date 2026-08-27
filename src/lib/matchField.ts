import type { ContractSearchResult, Party } from '../types/contract';

/**
 * Averigua por que campo coincide un contrato con el texto buscado.
 *
 * <p>El back-end devuelve los contratos que contienen el texto, pero no dice
 * en cual de los campos lo encontro. Se recalcula aqui con las mismas reglas
 * —sin mayusculas ni tildes— para poder ensennar en el desplegable el dato
 * concreto que ha coincidido, y no solo el contrato al que pertenece.</p>
 */
export interface FieldMatch {
  /** Como se llama el campo para quien mira la pantalla. */
  field: string;
  /** Valor completo del campo, para pintarlo con el fragmento resaltado. */
  value: string;
  /** Persona a la que pertenece el dato, cuando el campo es un documento. */
  person?: string;
  /**
   * True cuando el valor es un dato y no prosa —un codigo, un documento—.
   *
   * Decide con que letra se pinta: el sistema reserva la monoespaciada para
   * lo que se coteja caracter a caracter, y un nombre o una direccion no
   * entran en esa categoria.
   */
  isData?: boolean;
}

/**
 * Pasa el texto a minusculas y le quita las tildes, conservando la
 * correspondencia con las posiciones del texto original.
 *
 * <p>Hace falta el mapa porque la normalizacion cambia la longitud: «Martinez»
 * con tilde ocupa una posicion mas en su forma descompuesta, y sin el mapa el
 * fragmento resaltado se desplazaria una letra.</p>
 */
function normalizeWithMap(text: string): { normalized: string; map: number[] } {
  const map: number[] = [];
  let normalized = '';

  for (let index = 0; index < text.length; index += 1) {
    const folded = text[index]!
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    for (const character of folded) {
      normalized += character;
      map.push(index);
    }
  }

  return { normalized, map };
}

/** Deja el texto listo para comparar: sin mayusculas y sin tildes. */
export function normalize(text: string): string {
  return normalizeWithMap(text).normalized;
}

/** Devuelve true si el valor contiene el texto buscado. */
function contains(value: string, query: string): boolean {
  return normalize(value).includes(normalize(query));
}

/**
 * Parte un valor en tres: lo que va antes del fragmento buscado, el fragmento
 * y lo que va despues. Si no aparece, devuelve el valor entero como «antes».
 */
export function splitMatch(
  value: string,
  query: string,
): [before: string, match: string, after: string] {
  const { normalized, map } = normalizeWithMap(value);
  const needle = normalize(query);

  const found = normalized.indexOf(needle);
  if (needle.length === 0 || found === -1) {
    return [value, '', ''];
  }

  const start = map[found]!;
  const end = map[found + needle.length - 1]! + 1;

  return [value.slice(0, start), value.slice(start, end), value.slice(end)];
}

/** Busca el texto en una persona: primero el nombre, luego el documento. */
function matchParty(party: Party, query: string, role: string): FieldMatch | null {
  if (contains(party.fullName, query)) {
    return { field: role, value: party.fullName };
  }

  if (contains(party.documentNumber, query)) {
    return {
      field: `documento · ${role}`,
      value: party.documentNumber,
      person: party.fullName,
      isData: true,
    };
  }

  return null;
}

/**
 * Devuelve el primer campo del contrato que contiene el texto.
 *
 * <p>El orden no es casual: va de lo mas identificativo —el codigo— a lo mas
 * general. Si alguien escribe un codigo completo, lo que quiere ver resaltado
 * es el codigo, no la direccion que tambien lo contenga por casualidad.</p>
 *
 * <p>Devuelve {@code null} cuando el back-end ha encontrado el contrato por un
 * campo que la respuesta no incluye —el email de una persona—: en ese caso el
 * desplegable ensenna el contrato sin resaltar nada, en lugar de inventarse
 * una coincidencia.</p>
 */
export function findMatch(
  contract: ContractSearchResult,
  query: string,
): FieldMatch | null {
  if (contains(contract.contractCode, query)) {
    return { field: 'código', value: contract.contractCode, isData: true };
  }

  if (contains(contract.propertyAddress, query)) {
    return { field: 'dirección', value: contract.propertyAddress };
  }

  if (contract.tenant !== null) {
    const tenantMatch = matchParty(contract.tenant, query, 'arrendatario');
    if (tenantMatch !== null) {
      return tenantMatch;
    }
  }

  for (const owner of contract.owners) {
    const ownerMatch = matchParty(owner, query, 'propietario');
    if (ownerMatch !== null) {
      return ownerMatch;
    }
  }

  for (const guarantor of contract.guarantors) {
    const guarantorMatch = matchParty(guarantor, query, 'deudor solidario');
    if (guarantorMatch !== null) {
      return guarantorMatch;
    }
  }

  return null;
}
