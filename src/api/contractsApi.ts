import type {
  ApiErrorBody,
  ContractSearchResult,
  PagedResponse,
} from '../types/contract';

/**
 * URL base de la API.
 *
 * Se lee de una variable de entorno de Vite en lugar de escribirse en el
 * codigo: el valor cambia entre desarrollo y produccion, y una URL fija
 * obligaria a recompilar para desplegar.
 */
const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

/**
 * Error de la API con el codigo de estado y el mensaje que devolvio el
 * back-end, para poder mostrarlo tal cual a la persona que busca.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface SearchParams {
  query: string;
  page?: number;
  size?: number;
  /** Permite cancelar la peticion si llega una busqueda mas reciente. */
  signal?: AbortSignal;
}

/**
 * Consulta los contratos que contienen el texto indicado.
 *
 * @throws {ApiError} si el back-end responde con un codigo de error
 */
export async function searchContracts({
  query,
  page = 0,
  size = 20,
  signal,
}: SearchParams): Promise<PagedResponse<ContractSearchResult>> {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    size: String(size),
  });

  const response = await fetch(
    `${API_BASE_URL}/api/v1/contracts/search?${params}`,
    { signal, headers: { Accept: 'application/json' } },
  );

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  return (await response.json()) as PagedResponse<ContractSearchResult>;
}

/**
 * Extrae el mensaje de un error de la API.
 *
 * Se protege con try/catch porque una respuesta de error no siempre trae un
 * cuerpo JSON valido (por ejemplo, un 502 de un proxy intermedio).
 */
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    if (body.message) {
      return body.message;
    }
  } catch {
    // El cuerpo no era JSON: se recurre al mensaje generico de abajo.
  }
  return `El servicio respondio con un error (${response.status}).`;
}
