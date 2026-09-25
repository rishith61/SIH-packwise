/*
 * PackWise API client (build spec §7). Every screen talks to the backend
 * through these four functions only.
 *
 * With VITE_API_BASE_URL unset the calls are served by src/mocks instead, so
 * the wizard can be built and demoed before the backend exists. Switching to
 * the real backend needs no other code changes.
 */
import * as mock from '../mocks/mockApi';
import { ApiError } from './apiError';

export { ApiError };

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const TIMEOUT_MS = 30000;

export const USING_MOCKS = !BASE_URL;

async function request(path, { method = 'GET', body, signal, raw = false } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(new DOMException('Timed out', 'TimeoutError')), TIMEOUT_MS);
  const onAbort = () => ctrl.abort(signal.reason);
  if (signal) signal.addEventListener('abort', onAbort, { once: true });

  let res;
  try {
    res = await fetch(BASE_URL + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    const timedOut = ctrl.signal.reason?.name === 'TimeoutError';
    throw new ApiError({
      code: timedOut ? 'TIMEOUT' : 'NETWORK_ERROR',
      message: timedOut
        ? 'The server took too long to respond. Your inputs are saved, so you can try again.'
        : "Couldn't reach the PackWise server. Check your connection and try again.",
    });
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onAbort);
  }

  if (!res.ok) {
    let payload = null;
    try { payload = await res.json(); } catch { /* not JSON */ }
    throw new ApiError({ ...(payload?.error || {}), status: res.status });
  }
  return raw ? res : res.json();
}

/** GET /api/commodities?query= → { results: [{ commodityId, name, category }] } */
export function searchCommodities(query, { signal } = {}) {
  if (USING_MOCKS) return mock.searchCommodities(query, { signal });
  return request('/api/commodities?query=' + encodeURIComponent(query), { signal });
}

/** GET /api/commodities/{id} → default profile with { value, provenance, confidence } wrappers. */
export function getCommodity(commodityId, { signal } = {}) {
  if (USING_MOCKS) return mock.getCommodity(commodityId, { signal });
  return request('/api/commodities/' + encodeURIComponent(commodityId), { signal });
}

/** POST /api/analyze → the full explainable result. */
export function analyze(payload, { signal } = {}) {
  if (USING_MOCKS) return mock.analyze(payload, { signal });
  return request('/api/analyze', { method: 'POST', body: payload, signal });
}

/** GET /api/report/{analysisId}?format=pdf → Blob. Throws when unavailable. */
export async function fetchReportPdf(analysisId) {
  if (USING_MOCKS) throw new ApiError({ code: 'NOT_AVAILABLE', message: 'PDF export needs the backend.' });
  const res = await request('/api/report/' + encodeURIComponent(analysisId) + '?format=pdf', { raw: true });
  return res.blob();
}
