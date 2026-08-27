import type { SearchStatus } from '../hooks/useContractSearch';

interface SearchFeedbackProps {
  status: SearchStatus;
  errorMessage: string | null;
  lastQuery: string;
  totalResults: number;
}

/*
 * Los cuatro estados se cubren de forma explicita: una tabla vacia sin mensaje
 * deja sin saber si fallo la conexion o si no hay resultados. El estado inicial
 * calla porque la pista del campo ya explica por donde se busca.
 *
 * IMPORTANTE: `aria-live` anuncia el cambio aunque el foco este en otro sitio.
 * Es `polite` para no interrumpir por un recuento; el error lleva ademas
 * `role="alert"`, que si interrumpe.
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
