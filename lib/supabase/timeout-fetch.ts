export function fetchWithTimeout(
  url: URL | RequestInfo,
  options?: RequestInit,
  timeoutMs = 4000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return fetch(url, {
    ...options,
    signal: options?.signal || controller.signal,
  }).finally(() => {
    clearTimeout(timeoutId);
  });
}
