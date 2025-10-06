export class HttpError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown = null) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers ?? undefined);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const response = await fetch(input, {
    ...init,
    headers,
    credentials: init.credentials ?? "include",
  });

  let parsedBody: unknown = null;

  if (response.status !== 204) {
    const text = await response.text();

    if (text) {
      try {
        parsedBody = JSON.parse(text);
      } catch {
        parsedBody = text;
      }
    }
  }

  if (!response.ok) {
    const message =
      typeof parsedBody === "object" &&
      parsedBody !== null &&
      "error" in parsedBody &&
      typeof (parsedBody as { error?: unknown }).error === "string"
        ? (parsedBody as { error: string }).error
        : response.statusText || "Request failed";

    throw new HttpError(message, response.status, parsedBody);
  }

  return parsedBody as T;
}
