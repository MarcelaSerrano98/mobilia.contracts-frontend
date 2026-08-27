import { useId, useState, type FormEvent, type KeyboardEvent } from 'react';
import { MIN_QUERY_LENGTH } from '../api/contractsApi';
import {
  useContractSuggestions,
  type Suggestion,
} from '../hooks/useContractSuggestions';
import { SearchSuggestions } from './SearchSuggestions';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
}

/*
 * Va en un <form> para que Intro lance la busqueda sin codigo adicional.
 *
 * IMPORTANTE: sigue el patron ARIA de combobox. El foco no sale nunca del campo
 * al recorrer el panel —lo que cambia es `aria-activedescendant`—, porque si
 * saltara a cada opcion no se podria seguir escribiendo.
 */
export function SearchBar({ onSearch, isSearching }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  /*
   * IMPORTANTE: se guarda el contrato marcado, no su posicion. Con un indice,
   * al llegar coincidencias nuevas la marca senalaria otro contrato distinto,
   * o uno que ya no esta en la lista.
   */
  const [activeCode, setActiveCode] = useState<string | null>(null);

  const listboxId = useId();
  const optionId = (index: number) => `${listboxId}-${index}`;

  const trimmedQuery = query.trim();
  const isTooShort = trimmedQuery.length > 0 && trimmedQuery.length < MIN_QUERY_LENGTH;
  const canSearch = trimmedQuery.length >= MIN_QUERY_LENGTH && !isSearching;

  const { suggestions, isEmpty } = useContractSuggestions(query);

  const hasList = isOpen && suggestions.length > 0;
  const showNoMatches = isOpen && isEmpty && !isTooShort;

  const activeIndex = suggestions.findIndex(
    (suggestion) => suggestion.contract.contractCode === activeCode,
  );

  function highlight(index: number) {
    setActiveCode(suggestions[index]?.contract.contractCode ?? null);
  }

  function close() {
    setIsOpen(false);
    setActiveCode(null);
  }

  function runSearch(text: string) {
    close();
    onSearch(text);
  }

  // Completa el campo con el valor entero, que suele traer tildes que no se
  // escribieron.
  function accept(suggestion: Suggestion) {
    const text = suggestion.match?.value ?? suggestion.contract.contractCode;
    setQuery(text);
    runSearch(text);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canSearch) {
      runSearch(trimmedQuery);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      close();
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (suggestions.length === 0) {
        return;
      }

      // Las flechas mueven la seleccion, no el cursor dentro del texto.
      event.preventDefault();
      setIsOpen(true);

      const step = event.key === 'ArrowDown' ? 1 : -1;
      const next = activeIndex + step;

      // Fuera de la lista se vuelve al texto tal y como se escribio.
      if (next < -1) {
        highlight(suggestions.length - 1);
      } else if (next >= suggestions.length) {
        highlight(-1);
      } else {
        highlight(next);
      }

      return;
    }

    if (event.key === 'Enter' && hasList && activeIndex >= 0) {
      // Gana la linea elegida: el formulario no se envia.
      event.preventDefault();
      accept(suggestions[activeIndex]!);
    }
  }

  return (
    <form
      className="finder"
      onSubmit={handleSubmit}
      role="search"
      // Al salir del bloque entero y no solo del campo, para que el clic sobre
      // una linea del panel llegue a producirse.
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          close();
        }
      }}
    >
      <label className="sr-only" htmlFor="search-input">
        Buscar en el historial de inmuebles
      </label>

      {/* El panel se posiciona contra este bloque para flotar sobre la tabla
          en lugar de empujarla hacia abajo. */}
      <div className="finder__field">
        <div className="finder__row">
          <input
            id="search-input"
            className="finder__input"
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Una persona, una dirección o un código"
            autoComplete="off"
            role="combobox"
            aria-expanded={hasList}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 ? optionId(activeIndex) : undefined
            }
            aria-describedby="search-hint"
          />

          <button className="finder__submit" type="submit" disabled={!canSearch}>
            {isSearching ? 'Buscando…' : 'Buscar'}
          </button>
        </div>

        {hasList && (
          <SearchSuggestions
            suggestions={suggestions}
            query={trimmedQuery}
            activeIndex={activeIndex}
            listboxId={listboxId}
            optionId={optionId}
            onSelect={accept}
            onHover={highlight}
          />
        )}

        {showNoMatches && (
          <p className="panel panel--empty">Ningún contrato contiene ese texto.</p>
        )}
      </div>

      <p id="search-hint" className="finder__hint">
        {isTooShort
          ? `Escribe al menos ${MIN_QUERY_LENGTH} caracteres.`
          : 'Busca por nombre, documento, email, dirección o código. Ignora mayúsculas y tildes.'}
      </p>

      {/* Solo para el lector de pantalla: las coincidencias ya se ven. */}
      <p className="sr-only" role="status">
        {hasList ? `${suggestions.length} coincidencias` : ''}
      </p>
    </form>
  );
}
