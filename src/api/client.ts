import { API_BASE_URL, API_TIMEOUT_MS } from '../config/api';

type ValidationError = {
  path?: string;
  message?: string;
};

type ApiErrorPayload = {
  message?: string;
  code?: string;
  errors?: ValidationError[];
};

type ApiEnvelope<T> = {
  data: T;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const buildValidationMessage = (errors?: ValidationError[]): string | undefined => {
  if (!errors || errors.length === 0) {
    return undefined;
  }

  const firstError = errors[0];
  if (!firstError?.message) {
    return undefined;
  }

  const pathPrefix = firstError.path ? `${firstError.path}: ` : '';
  return `${pathPrefix}${firstError.message}`;
};

const parseJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
};

export const postJson = async <TRequest, TResponse>(
  path: string,
  payload: TRequest
): Promise<TResponse> => {
  return requestJson<TRequest, TResponse>('POST', path, payload);
};

export const patchJson = async <TRequest, TResponse>(
  path: string,
  payload: TRequest
): Promise<TResponse> => {
  return requestJson<TRequest, TResponse>('PATCH', path, payload);
};

const requestJson = async <TRequest, TResponse>(
  method: 'POST' | 'PATCH',
  path: string,
  payload: TRequest
): Promise<TResponse> => {
  if (!API_BASE_URL) {
    throw new ApiError('API base URL is missing', 500, 'MISSING_API_BASE_URL');
  }

  const fullUrl = `${API_BASE_URL}${path}`;
  const startTime = Date.now();

  console.log('API_REQUEST', {
    timestamp: new Date().toISOString(),
    method,
    url: fullUrl,
    path,
    payload
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(fullUrl, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    const duration = Date.now() - startTime;
    const parsed = (await parseJson(response)) as ApiErrorPayload | ApiEnvelope<TResponse> | undefined;

    console.log('API_RESPONSE', {
      timestamp: new Date().toISOString(),
      method,
      url: fullUrl,
      status: response.status,
      duration: `${duration}ms`,
      data: parsed
    });

    if (!response.ok) {
      const errorPayload = (parsed ?? {}) as ApiErrorPayload;
      const message =
        buildValidationMessage(errorPayload.errors) ?? errorPayload.message ?? 'Request failed. Please try again.';
      throw new ApiError(message, response.status, errorPayload.code);
    }

    const envelope = parsed as ApiEnvelope<TResponse>;
    return envelope.data;
  } catch (error) {
    const duration = Date.now() - startTime;

    if (error instanceof ApiError) {
      console.log('API_ERROR', {
        timestamp: new Date().toISOString(),
        method,
        url: fullUrl,
        status: error.status,
        duration: `${duration}ms`,
        message: error.message,
        code: error.code
      });
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      console.log('API_ERROR', {
        timestamp: new Date().toISOString(),
        method,
        url: fullUrl,
        duration: `${duration}ms`,
        error: 'TIMEOUT',
        message: 'Request timed out. Check your connection and try again.'
      });
      throw new ApiError('Request timed out. Check your connection and try again.', 408, 'TIMEOUT');
    }

    console.log('API_ERROR', {
      timestamp: new Date().toISOString(),
      method,
      url: fullUrl,
      duration: `${duration}ms`,
      error: 'NETWORK_ERROR',
      message: error instanceof Error ? error.message : 'Unknown network error'
    });
    throw new ApiError('Network request failed. Ensure the API server is reachable.', 503, 'NETWORK_ERROR');
  } finally {
    clearTimeout(timeoutId);
  }
};
