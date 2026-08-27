import { useId, useState, type FormEvent, type KeyboardEvent } from 'react';
import {
  useContractSuggestions,
  type Suggestion,
} from '../hooks/useContractSuggestions';
import { SearchSuggestions } from './SearchSuggestions';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
}

/** Longitud minima que exige el back-end. Se replica para avisar antes. */
const MIN_QUERY_LENGTH = 2;

/**
 * Campo de texto, desplegable de coincidencias y boton de buscar.
 *
 * <p>Se envuelve en un {@code <form>} en lugar de escuchar solo el clic del
 * boton: asi la tecla Intro tambien lanza la busqueda, sin codigo adicional y
 * con el comportamiento que espera cualquier persona.</p>
 *
 * <p>El campo sigue el patron ARIA de combobox: {@code aria-expanded} dice si
 * el panel esta abierto, {@code aria-activedescendant} apunta a la linea que
 * se esta recorriendo con las flechas, y el foco no se mueve nunca de la caja
 * de texto —de modo que se puede seguir escribiendo mientras se navega—.</p>
 */
export function SearchBar({ onSearch, isSearching }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  /*
   * La linea recorrida se guarda por el codigo del contrato y no por su
   * posicion. Asi, cuando llegan coincidencias nuevas, la marca sigue al
   * contrato si continua en la lista y desaparece sola si ya no esta, sin
   * necesidad de un efecto que la reinicie.
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

  /** Marca la linea que ocupa esa posicion, o ninguna si se sale de la lista. */
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

  /** Completa el campo con el dato elegido y lanza la busqueda con el. */
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

      // Por debajo de la primera linea se vuelve al texto tal y como se
      // escribio; por encima de la ultima se da la vuelta.
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
      // Hay una linea elegida: gana ella y el formulario no se envia.
      event.preventDefault();
      accept(suggestions[activeIndex]!);
    }
  }

  return (
    <form
      className="finder"
      onSubmit={handleSubmit}
      role="search"
      /* Cerrar al salir de todo el bloque, y no al salir del campo, deja que
         el clic sobre una linea del panel llegue a producirse. */
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          close();
        }
      }}
    >
      <label className="sr-only" htmlFor="search-input">
        Buscar en el historial de inmuebles
      </label>

      {/* El panel se posiciona contra este bloque, no contra el formulario
          entero: asi cuelga justo de la linea del campo y flota sobre lo que
          haya debajo, en lugar de empujar la tabla hacia abajo. */}
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

      {/* El recuento solo existe para el lector de pantalla: en la pantalla
          las coincidencias ya se ven. */}
      <p className="sr-only" role="status">
        {hasList ? `${suggestions.length} coincidencias` : ''}
      </p>
    </form>
  );
}
