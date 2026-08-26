import { ContractsTable } from './components/ContractsTable';
import { SearchBar } from './components/SearchBar';
import { SearchFeedback } from './components/SearchFeedback';
import { useContractSearch } from './hooks/useContractSearch';
import './App.css';

/**
 * Pantalla de busqueda de contratos.
 *
 * <p>El componente solo compone: la logica de la peticion vive en
 * {@code useContractSearch} y cada pieza de la interfaz en su propio
 * componente.</p>
 */
export default function App() {
  const { status, results, errorMessage, lastQuery, search } = useContractSearch();

  const contracts = results?.content ?? [];

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Mobilia · Consulta de contratos</h1>
        <p className="app__subtitle">
          Busca por nombre, apellidos, documento de identidad, email, dirección
          del inmueble o código del contrato.
        </p>
      </header>

      <main className="app__main">
        <SearchBar onSearch={search} isSearching={status === 'loading'} />

        <SearchFeedback
          status={status}
          errorMessage={errorMessage}
          lastQuery={lastQuery}
          totalResults={results?.totalElements ?? 0}
        />

        {status === 'success' && contracts.length > 0 && (
          <ContractsTable contracts={contracts} />
        )}
      </main>
    </div>
  );
}
