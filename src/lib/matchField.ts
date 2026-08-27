import type { ContractSearchResult, Party } from '../types/contract';

/*
 * El back-end devuelve los contratos que contienen el texto pero no dice en que
 * campo lo encontro, asi que la coincidencia se recalcula aqui con sus mismas
 * reglas: sin mayusculas y sin tildes.
 */
export interface FieldMatch {
  field: string;
  value: string;
  person?: string;
  // Un codigo o un documento, que el disenno pinta en monoespaciada.
  isData?: boolean;
}

/*
 * IMPORTANTE: normalizar acorta el texto —«í» se descompone en dos caracteres y
 * pierde uno al quitar la tilde—, asi que el mapa guarda de que posicion del
 * original viene cada letra. Sin el, el subrayado caeria corrido.
 */
function normalizeWithMap(text: string): { normalized: string; map: number[] } {
  const map: number[] = [];
  let normalized = '';

  for (let index = 0; index < text.length; index += 1) {
    // Un caracter puede dar varios: la enne se descompone en n mas tilde, y
    // por eso «nunez» encuentra «Núñez».
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

/**
 * @returns el texto en minusculas y sin tildes, listo para comparar
 */
export function normalize(text: string): string {
  return normalizeWithMap(text).normalized;
}

function contains(value: string, query: string): boolean {
  return normalize(value).includes(normalize(query));
}

/**
 * Parte un valor por el fragmento buscado, para poder resaltarlo.
 *
 * @param value texto completo del campo, con sus tildes
 * @param query texto buscado, que puede venir sin ellas
 * @returns lo anterior al fragmento, el fragmento y lo posterior; si no
 *   aparece, el valor entero como primer elemento
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
 * Localiza el campo del contrato que contiene el texto buscado.
 *
 * <p>Se recorren de lo mas identificativo a lo mas general: quien escribe un
 * codigo entero espera ver resaltado el codigo, no una direccion que lo
 * contenga por casualidad.</p>
 *
 * @param contract contrato devuelto por el servicio
 * @param query texto buscado
 * @returns el campo coincidente, o null si el servicio lo encontro por el
 *   email, que la respuesta no incluye
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
