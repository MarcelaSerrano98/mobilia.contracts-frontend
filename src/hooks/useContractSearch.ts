import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, searchContracts } from '../api/contractsApi';
import type { ContractSearchResult, PagedResponse } from '../types/contract';

/** Estados por los que pasa una busqueda. */
export type SearchStatus = 'idle' | 'loading' | 'success' | 'error';

interface UseContractSearchResult {
  status: SearchStatus;
  results: PagedResponse<ContractSearchResult> | null;
  errorMessage: string | null;
  /** Texto de la ultima busqueda lanzada, para los mensajes en pantalla. */
  lastQuery: string;
  search: (query: string) => void;
}

/**
 * Encapsula el ciclo de vida de una busqueda: peticion, estados y errores.
 *
 * <p>Extraerlo a un hook mantiene los componentes centrados en pintar y permite
 * reutilizar la logica si mannana hiciera falta buscar desde otra pantalla.</p>
 */
export function useContractSearch(): UseContractSearchResult {
  const [status, setStatus] = useState<SearchStatus>('idle');
  const [results, setResults] = useState<PagedResponse<ContractSearchResult> | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState('');

  /**
   * Referencia a la peticion en curso.
   *
   * Sin ella se produciria una condicion de carrera: si se lanzan dos busquedas
   * seguidas y la primera tarda mas que la segunda, su respuesta llegaria
   * despues y sobreescribiria en pantalla un resultado mas reciente.
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
        // Una peticion cancelada no es un fallo: la reemplazo otra mas reciente.
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

  // Cancela la peticion pendiente si el componente se desmonta.
  useEffect(() => () => inFlightRequest.current?.abort(), []);

  return { status, results, errorMessage, lastQuery, search };
}
