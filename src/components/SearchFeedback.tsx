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
 * <p>IMPORTANTE (estudiar) — {@code aria-live="polite"} hace que el lector de
 * pantalla anuncie este bloque cuando su contenido cambia, aunque el foco este
 * en otro sitio. Sin el, quien busca a oidas pulsa Buscar y no recibe ninguna
 * senal: la tabla aparece en pantalla, pero nada se lo dice.</p>
 *
 * <p>El valor {@code polite} espera a que termine de leerse lo que estuviera
 * en curso, frente a {@code assertive}, que interrumpe. Para un recuento de
 * resultados, interrumpir seria desproporcionado. El mensaje de error si lleva
 * ademas {@code role="alert"}, que si es asertivo: un fallo no puede esperar
 * su turno.</p>
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
