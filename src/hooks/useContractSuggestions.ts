import { useEffect, useState } from 'react';
import { MIN_QUERY_LENGTH, searchContracts } from '../api/contractsApi';
import { findMatch, type FieldMatch } from '../lib/matchField';
import type { ContractSearchResult } from '../types/contract';

export interface Suggestion {
  contract: ContractSearchResult;
  // null cuando el back-end encontro el contrato por un campo que no devuelve.
  match: FieldMatch | null;
}

const MAX_SUGGESTIONS = 6;

// Sin esta pausa, escribir «martinez» lanzaria ocho peticiones para ensennar
// solo el resultado de la ultima.
const DEBOUNCE_MS = 250;

interface UseContractSuggestionsResult {
  suggestions: Suggestion[];
  isEmpty: boolean;
}

interface SuggestionsFor {
  query: string;
  items: Suggestion[];
}

/**
 * Coincidencias que alimentan el desplegable mientras se escribe.
 *
 * <p>Va aparte de {@link useContractSearch} para que un fallo de las
 * sugerencias no borre la tabla ya visible: aqui el error se traga y, si
 * persiste, lo cuenta la busqueda al pulsar Buscar.</p>
 *
 * @param query texto que se esta escribiendo, sin recortar
 * @returns las coincidencias de ese texto, vacias mientras no las haya, y si
 *   el servicio ya respondio sin ningun contrato
 */
export function useContractSuggestions(
  query: string,
): UseContractSuggestionsResult {
  /*
   * IMPORTANTE: se guarda junto al texto que la pidio para poder descartarla
   * en el render. Vaciarla desde un efecto llega tarde, y el panel ensennaria
   * un instante las coincidencias de la palabra anterior.
   */
  const [answer, setAnswer] = useState<SuggestionsFor | null>(null);

  const text = query.trim();

  useEffect(() => {
    const wanted = query.trim();

    if (wanted.length < MIN_QUERY_LENGTH) {
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(() => {
      searchContracts({
        query: wanted,
        page: 0,
        size: MAX_SUGGESTIONS,
        signal: controller.signal,
      })
        .then((page) => {
          setAnswer({
            query: wanted,
            items: page.content.map((contract) => ({
              contract,
              match: findMatch(contract, wanted),
            })),
          });
        })
        .catch((error: unknown) => {
          // Cancelar es lo normal aqui: ha llegado otra tecla.
          if (error instanceof DOMException && error.name === 'AbortError') {
            return;
          }
          setAnswer({ query: wanted, items: [] });
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const isCurrent =
    answer !== null && answer.query === text && text.length >= MIN_QUERY_LENGTH;

  return {
    suggestions: isCurrent ? answer.items : [],
    isEmpty: isCurrent && answer.items.length === 0,
  };
}
