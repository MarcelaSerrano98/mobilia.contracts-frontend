import { useEffect, useState } from 'react';
import { MIN_QUERY_LENGTH, searchContracts } from '../api/contractsApi';
import { findMatch, type FieldMatch } from '../lib/matchField';
import type { ContractSearchResult } from '../types/contract';

/** Una linea del desplegable: el contrato y el dato por el que ha salido. */
export interface Suggestion {
  contract: ContractSearchResult;
  /** Campo que contiene el texto, o null si la respuesta no lo incluye. */
  match: FieldMatch | null;
}

/** Cuantas lineas caben en el desplegable sin convertirlo en otra tabla. */
const MAX_SUGGESTIONS = 6;

/**
 * Espera a que la persona deje de teclear antes de preguntar.
 *
 * Sin esta pausa, escribir «martinez» lanzaria ocho peticiones para ensennar
 * solo el resultado de la ultima.
 */
const DEBOUNCE_MS = 250;

interface UseContractSuggestionsResult {
  suggestions: Suggestion[];
  /** True cuando ya se ha respondido y no habia ningun contrato. */
  isEmpty: boolean;
}

/** Lo ultimo que respondio el servicio, junto al texto que lo pidio. */
interface SuggestionsFor {
  query: string;
  items: Suggestion[];
}

/**
 * Consulta el mismo servicio que la busqueda, pero de a pocos y mientras se
 * escribe, para alimentar el desplegable.
 *
 * <p>Va aparte de {@code useContractSearch} a proposito: el desplegable no
 * debe tocar el estado de la busqueda confirmada, ni dejar la tabla en blanco
 * porque una sugerencia haya fallado. Si una peticion de sugerencias se
 * rompe, el panel se cierra sin decir nada y el error, si persiste, lo cuenta
 * la busqueda de verdad al pulsar Buscar.</p>
 *
 * <p>IMPORTANTE (estudiar) — Se guarda el texto que pidio cada respuesta
 * junto a la respuesta misma. Sirve para decidir <em>durante el render</em>
 * si lo que hay en memoria vale para lo que hay escrito ahora: sin esa
 * comprobacion, al escribir una letra mas el panel ensennaria durante un
 * instante las coincidencias de la palabra anterior.</p>
 *
 * <p>Es la alternativa a reaccionar con un efecto que vacie la lista cada vez
 * que cambia el texto. Un efecto asi provoca un render de mas y, sobre todo,
 * describe el estado en dos sitios: lo que hay guardado y lo que el efecto
 * hara con ello. Derivarlo en el render deja una sola verdad —«esta respuesta
 * es de este texto»— y ningun momento intermedio en que ambas discrepen.</p>
 */
export function useContractSuggestions(
  query: string,
): UseContractSuggestionsResult {
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
          // La cancelacion es lo normal aqui: llega una tecla mas.
          if (error instanceof DOMException && error.name === 'AbortError') {
            return;
          }
          setAnswer({ query: wanted, items: [] });
        });
    }, DEBOUNCE_MS);

    // Cancela tanto la espera como la peticion si el texto cambia antes.
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
