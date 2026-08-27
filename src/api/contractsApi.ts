import type {
  ApiErrorBody,
  ContractSearchResult,
  PagedResponse,
} from '../types/contract';

// En una variable de entorno para no recompilar al cambiar de entorno.
const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

/*
 * IMPORTANTE: conserva el mensaje del back-end, que ya viene redactado en
 * castellano y se muestra tal cual, y el status para poder distinguir un error
 * de la peticion de una caida del servicio.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/*
 * Regla del back-end, no de la pantalla: vive aqui para que haya un unico sitio
 * que tocar si el servicio cambiara de criterio.
 */
export const MIN_QUERY_LENGTH = 2;

interface SearchParams {
  query: string;
  page?: number;
  size?: number;
  signal?: AbortSignal;
}

/**
 * Consulta los contratos que contienen el texto indicado en el nombre,
 * apellidos, documento o email de sus partes, en la direccion del inmueble o
 * en el codigo del contrato.
 *
 * @param query texto a buscar; el servicio exige {@link MIN_QUERY_LENGTH}
 * @param page pagina solicitada, empezando en cero
 * @param size numero maximo de contratos por pagina
 * @param signal permite abortar la peticion desde quien la lanzo
 * @returns la pagina de contratos coincidentes
 * @throws {ApiError} si el servicio responde con un codigo de error
 * @throws {DOMException} con nombre `AbortError` si se aborta la peticion
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

// Una respuesta de error no siempre trae JSON valido: un 502 de un proxy
// intermedio devuelve HTML.
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    if (body.message) {
      return body.message;
    }
  } catch {
    // Sin cuerpo aprovechable; queda el mensaje generico de abajo.
  }
  return `El servicio respondio con un error (${response.status}).`;
}
