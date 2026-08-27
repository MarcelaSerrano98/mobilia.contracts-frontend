import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, searchContracts } from '../api/contractsApi';
import type { ContractSearchResult, PagedResponse } from '../types/contract';

export type SearchStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseContractSearchResult {
  status: SearchStatus;
  results: PagedResponse<ContractSearchResult> | null;
  errorMessage: string | null;
  lastQuery: string;
  search: (query: string) => void;
}

/**
 * Ciclo de vida de una busqueda de contratos.
 *
 * @returns el estado de la busqueda, sus resultados, el mensaje de error si
 *   fallo, el ultimo texto buscado y la funcion que lanza una busqueda nueva
 *   cancelando la anterior
 */
export function useContractSearch(): UseContractSearchResult {
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [results, setResults] = useState<PagedResponse<ContractSearchResult> | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState('');

  /*
   * IMPORTANTE: dos peticiones no responden necesariamente en el orden en que
   * salieron, asi que una busqueda lenta puede pisar el resultado de otra mas
   * reciente. Abortar la anterior deja siempre una sola respuesta viva.
   */
  const inFlightRequest = useRef<AbortController | null>(null);

  const search = useCallback((query: string) => {
    inFlightRequest.current?.abort();

    const controller = new AbortController();
    inFlightRequest.current = controller;

    setStatus('loading');
    setErrorMessage(null);
    setLastQuery(query);

    searchContracts({ query, signal: controller.signal })
      .then((page) => {
        setResults(page);
        setStatus('success');
      })
      .catch((error: unknown) => {
        // Abortar rechaza la promesa: sin este filtro, cancelar una busqueda
        // se veria en pantalla como un fallo.
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        setResults(null);
        setStatus('error');
        setErrorMessage(
          error instanceof ApiError
            ? error.message
            : 'No se pudo conectar con el servicio. Comprueba que el back-end este levantado.',
        );
      });
  }, []);

  // Evita escribir estado de un componente que ya no esta montado.
  useEffect(() => () => inFlightRequest.current?.abort(), []);

  return { status, results, errorMessage, lastQuery, search };
}
