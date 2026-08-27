import { ContractsTable } from './components/ContractsTable';
import { SearchBar } from './components/SearchBar';
import { SearchFeedback } from './components/SearchFeedback';
import { useContractSearch } from './hooks/useContractSearch';
import './App.css';

export default function App() {
  const { status, results, errorMessage, lastQuery, search } = useContractSearch();

  const contracts = results?.content ?? [];

  return (
    <div className="page">
      <header className="masthead">
        <span className="masthead__wordmark">Mobilia</span>
        <span className="masthead__label">Consulta de contratos</span>
      </header>

      <main className="page__main">
        <h1 className="page__title">Historial de inmuebles</h1>
        <p className="page__lead">
          Consulta los contratos de un inmueble, el vigente y los anteriores,
          junto con las personas que figuran en cada uno.
        </p>

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
