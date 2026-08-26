import { useState, type FormEvent } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
}

/** Longitud minima que exige el back-end. Se replica para avisar antes. */
const MIN_QUERY_LENGTH = 2;

/**
 * Campo de texto y boton de buscar.
 *
 * <p>Se envuelve en un {@code <form>} en lugar de escuchar solo el clic del
 * boton: asi la tecla Intro tambien lanza la busqueda, sin codigo adicional y
 * con el comportamiento que espera cualquier persona.</p>
 */
export function SearchBar({ onSearch, isSearching }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const trimmedQuery = query.trim();
  const isTooShort = trimmedQuery.length > 0 && trimmedQuery.length < MIN_QUERY_LENGTH;
  const canSearch = trimmedQuery.length >= MIN_QUERY_LENGTH && !isSearching;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (canSearch) {
      onSearch(trimmedQuery);
    }
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit} role="search">
      <label className="search-bar__label" htmlFor="search-input">
        Buscar contratos
      </label>

      <div className="search-bar__row">
        <input
          id="search-input"
          className="search-bar__input"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nombre, documento, email, dirección o código del contrato"
          autoComplete="off"
          aria-describedby="search-hint"
        />

        <button className="search-bar__button" type="submit" disabled={!canSearch}>
          {isSearching ? 'Buscando…' : 'Buscar'}
        </button>
      </div>

      <p id="search-hint" className="search-bar__hint">
        {isTooShort
          ? `Escribe al menos ${MIN_QUERY_LENGTH} caracteres.`
          : 'La búsqueda ignora mayúsculas y tildes.'}
      </p>
    </form>
  );
}
