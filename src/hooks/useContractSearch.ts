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
   * IMPORTANTE (estudiar) — La condicion de carrera de todo buscador.
   *
   * <p>Si se lanzan dos busquedas seguidas y la primera tarda mas que la
   * segunda, su respuesta llega despues y sobreescribe en pantalla un
   * resultado mas reciente. La persona ve entonces los resultados de lo que
   * escribio antes, sin ninguna pista de que ha pasado.</p>
   *
   * <p>No es un problema de velocidad de la red sino de orden de llegada: dos
   * peticiones independientes no garantizan responder en el orden en que se
   * enviaron. Guardar la peticion en curso y abortarla al lanzar la siguiente
   * hace que solo pueda haber una viva, y con ella una sola respuesta capaz
   * de escribir en el estado.</p>
   *
   * <p>Se usa {@code useRef} y no {@code useState} porque cambiar de peticion
   * no tiene que repintar nada: es un dato de trabajo, no algo que se vea.</p>
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
        // IMPORTANTE (estudiar): abortar una peticion hace que su promesa se
        // rechace con AbortError. Sin este filtro, cancelar una busqueda se
        // mostraria como un error en pantalla, y cancelar es justo lo que
        // hace el codigo de arriba en cada tecleo.
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
