import type { SearchStatus } from '../hooks/useContractSearch';

interface SearchFeedbackProps {
  status: SearchStatus;
  errorMessage: string | null;
  lastQuery: string;
  totalResults: number;
}

/**
 * Mensaje que acompanna a la tabla segun el estado de la busqueda.
 *
 * <p>Cubre de forma explicita los cuatro estados —inicial, cargando, sin
 * resultados y error— en lugar de mostrar una tabla vacia sin explicacion,
 * que deja a la persona sin saber si fallo algo o simplemente no hay datos.</p>
 *
 * <p>{@code aria-live="polite"} hace que un lector de pantalla anuncie el
 * cambio de estado sin interrumpir lo que este leyendo.</p>
 */
export function SearchFeedback({
  status,
  errorMessage,
  lastQuery,
  totalResults,
}: SearchFeedbackProps) {
  return (
    <div className="feedback" aria-live="polite">
      {status === 'idle' && (
        <p className="feedback__message">
          Escribe un texto y pulsa <strong>Buscar</strong> para consultar los
          contratos.
        </p>
      )}

      {status === 'loading' && (
        <p className="feedback__message feedback__message--loading">Buscando…</p>
      )}

      {status === 'error' && (
        <p className="feedback__message feedback__message--error" role="alert">
          {errorMessage}
        </p>
      )}

      {status === 'success' && totalResults === 0 && (
        <p className="feedback__message">
          No se encontraron contratos que contengan «{lastQuery}».
        </p>
      )}

      {status === 'success' && totalResults > 0 && (
        <p className="feedback__message feedback__message--success">
          {totalResults}{' '}
          {totalResults === 1 ? 'contrato encontrado' : 'contratos encontrados'}{' '}
          para «{lastQuery}».
        </p>
      )}
    </div>
  );
}
