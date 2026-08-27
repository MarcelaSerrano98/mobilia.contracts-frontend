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
 * <p>El estado inicial no dice nada: la tira de rotulos bajo el campo ya
 * explica por donde se puede buscar, y repetirlo aqui seria pedirle a la
 * persona que lea dos veces lo mismo antes de escribir.</p>
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
      {status === 'loading' && (
        <p className="feedback__count">
          <span className="feedback__count-text">Buscando…</span>
        </p>
      )}

      {status === 'error' && (
        <p className="feedback__error" role="alert">
          {errorMessage}
        </p>
      )}

      {status === 'success' && totalResults === 0 && (
        <p className="feedback__empty">
          Ningún contrato coincide con «{lastQuery}». Prueba con el número de
          documento o con la dirección del inmueble.
        </p>
      )}

      {status === 'success' && totalResults > 0 && (
        <p className="feedback__count">
          <span className="feedback__count-text">
            {totalResults} {totalResults === 1 ? 'contrato' : 'contratos'} ·{' '}
            {/* El texto buscado se muestra tal y como se escribio: el resto
                del recuento va en versales, pero forzarlas aqui deformaria
                un apellido o una direccion que la persona acaba de teclear. */}
            <span className="feedback__query">«{lastQuery}»</span>
          </span>
        </p>
      )}
    </div>
  );
}
