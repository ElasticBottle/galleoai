export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Creates a successful Result
 * @param data The success data
 * @returns A successful Result containing the data
 */
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Creates a failure Result
 * @param error The error value
 * @returns A failure Result containing the error
 */
export function err<E = Error>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Safely executes a function and returns a Result type
 * @param fn The function to execute
 * @param mapError Optional callback that will be called with the error before returning. If it returns a value, that value will be used as the error.
 * @returns A Result type containing either the successful data or an error
 */
export async function safe<T, E>(
  fn: () => Promise<T> | T,
  mapError: (error: Error) => E,
): Promise<Result<T, E>>;
export async function safe<T>(
  fn: () => Promise<T> | T,
): Promise<Result<T, Error>>;
export async function safe<T, E>(
  fn: () => Promise<T> | T,
  mapError?: (error: Error) => E,
): Promise<Result<T, E | Error>> {
  try {
    const data = await fn();
    return ok(data);
  } catch (error) {
    const normalizedError =
      error instanceof Error ? error : new Error(String(error));
    if (mapError) {
      return err(mapError(normalizedError));
    }
    return err(normalizedError);
  }
}

/**
 * Safely executes a synchronous function and returns a Result type
 * @param fn The function to execute
 * @param mapError Optional callback that will be called with the error before returning. If it returns a value, that value will be used as the error.
 * @returns A Result type containing either the successful data or an error
 */
export function safeSync<T, E>(
  fn: () => T,
  mapError: (error: Error) => E,
): Result<T, E>;
export function safeSync<T>(fn: () => T): Result<T, Error>;
export function safeSync<T, E>(
  fn: () => T,
  mapError?: (error: Error) => E,
): Result<T, E | Error> {
  try {
    const data = fn();
    return ok(data);
  } catch (error) {
    const normalizedError =
      error instanceof Error ? error : new Error(String(error));
    if (mapError) {
      return err(mapError(normalizedError));
    }
    return err(normalizedError);
  }
}

/**
 * Safely executes a fetch request and returns a Result type
 * @param input The URL or Request object to fetch
 * @param init Optional fetch initialization options
 * @param mapError Optional callback that will be called with the error before returning. If it returns a value, that value will be used as the error.
 * @returns A Result type containing either the successful Response or an error
 */
export async function safeFetch<E>(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  mapError: (error: Error) => E,
): Promise<Result<Response, E>>;
export async function safeFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Result<Response, Error>>;
export async function safeFetch<E>(
  input: RequestInfo | URL,
  init?: RequestInit,
  mapError?: (error: Error) => E,
): Promise<Result<Response, E | Error>> {
  try {
    const response = await fetch(input, init);

    if (!response.ok) {
      const errorText = await response
        .text()
        .catch(() => "Failed to read response body");
      const error = new Error(
        `Request failed: ${response.status}. Status: ${response.statusText}. ${errorText ? `\n${errorText}` : ""}`,
      );
      if (mapError) {
        return err(mapError(error));
      }
      return err(error);
    }

    return ok(response);
  } catch (error) {
    const normalizedError =
      error instanceof Error ? error : new Error(String(error));
    if (mapError) {
      return err(mapError(normalizedError));
    }
    return err(normalizedError);
  }
}
