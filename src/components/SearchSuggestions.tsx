import type { Suggestion } from '../hooks/useContractSuggestions';
import { splitMatch } from '../lib/matchField';

interface SearchSuggestionsProps {
  suggestions: Suggestion[];
  query: string;
  // -1 cuando no hay ninguna linea recorrida con el teclado.
  activeIndex: number;
  listboxId: string;
  optionId: (index: number) => string;
  onSelect: (suggestion: Suggestion) => void;
  onHover: (index: number) => void;
}

/*
 * Cada linea ensenna el dato que ha coincidido y en que papel figura, no solo
 * el contrato: es la diferencia entre «hay dos resultados» y «el texto esta en
 * el apellido de la propietaria de este contrato».
 */
export function SearchSuggestions({
  suggestions,
  query,
  activeIndex,
  listboxId,
  optionId,
  onSelect,
  onHover,
}: SearchSuggestionsProps) {
  return (
    <ul className="panel" id={listboxId} role="listbox" aria-label="Coincidencias">
      {suggestions.map((suggestion, index) => {
        const { contract, match } = suggestion;
        const [before, hit, after] = splitMatch(match?.value ?? '', query);

        return (
          <li
            key={contract.contractCode}
            id={optionId(index)}
            className={
              index === activeIndex ? 'panel__row panel__row--on' : 'panel__row'
            }
            role="option"
            aria-selected={index === activeIndex}
            // En mousedown el campo aun no ha perdido el foco, asi que el
            // panel no se cierra antes de que el clic llegue.
            onMouseDown={(event) => event.preventDefault()}
            onMouseEnter={() => onHover(index)}
            onClick={() => onSelect(suggestion)}
          >
            <span className="panel__main">
              {match === null ? (
                <span className="panel__value">{contract.propertyAddress}</span>
              ) : (
                <span
                  className={
                    match.isData === true
                      ? 'panel__value panel__value--data'
                      : 'panel__value'
                  }
                >
                  {before}
                  <mark className="panel__hit">{hit}</mark>
                  {after}
                </span>
              )}

              <span className="panel__field">
                {match === null ? 'otro campo' : match.field}
                {/* El nombre va fuera de las versales: es una persona, no una
                    etiqueta, y deformarlo se lee como un dato distinto. */}
                {match?.person !== undefined && (
                  <span className="panel__person"> · {match.person}</span>
                )}
              </span>
            </span>

            <span className="panel__aside">
              <span className="panel__code">{contract.contractCode}</span>
              <span
                className={`stamp stamp--${contract.contractStatus.toLowerCase()}`}
              >
                {contract.contractStatus}
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
