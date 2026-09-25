/*
 * In-browser stand-in for the PackWise backend (used when VITE_API_BASE_URL
 * is unset). It returns canned fixtures with realistic latency and can
 * simulate failures from the console:
 *
 *   window.PackWise.mock.failNext('network')     // next analyze call fails
 *   window.PackWise.mock.failNext('validation')  // VALIDATION_ERROR on conditions.temperatureC
 */
import { ApiError } from '../services/apiError';
import { MOCK_COMMODITIES } from './commodities';
import { DRY_GOODS_RESULT, FRESH_PRODUCE_RESULT, GENERIC_RESULT } from './analyses';

let failNextKind = null;

if (typeof window !== 'undefined') {
  const api = (window.PackWise = window.PackWise || {});
  api.mock = {
    failNext(kind = 'network') { failNextKind = kind; return `Next analyze call will fail with: ${kind}`; },
  };
}

function delay(ms, signal) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => { clearTimeout(t); reject(signal.reason); }, { once: true });
  });
}

export async function searchCommodities(query, { signal } = {}) {
  await delay(query ? 250 : 500, signal);
  const q = query.trim().toLowerCase();
  const results = MOCK_COMMODITIES
    .filter((c) => !q || c.name.toLowerCase().includes(q) || c.commodityId.toLowerCase().includes(q))
    .map(({ commodityId, name, category }) => ({ commodityId, name, category }));
  return { results };
}

export async function getCommodity(commodityId, { signal } = {}) {
  await delay(450, signal);
  const hit = MOCK_COMMODITIES.find((c) => c.commodityId === commodityId);
  if (!hit) throw new ApiError({ code: 'NOT_FOUND', message: 'That commodity is no longer in the catalog.', status: 404 });
  return structuredClone(hit);
}

export async function analyze(payload, { signal } = {}) {
  await delay(2600, signal);

  const kind = failNextKind;
  failNextKind = null;
  if (kind === 'network') {
    throw new ApiError({ code: 'NETWORK_ERROR', message: "Couldn't reach the PackWise server. Check your connection and try again." });
  }
  if (kind === 'validation') {
    throw new ApiError({
      code: 'VALIDATION_ERROR',
      message: 'Temperature is outside the range supported for this storage type.',
      field: 'conditions.temperatureC',
      status: 422,
    });
  }
  if (kind) {
    throw new ApiError({ code: 'SERVER_ERROR', message: 'The analysis service hit an unexpected error.', status: 500 });
  }

  const p = payload.commodity.profile;
  const fixture =
    p.category === 'fresh_produce' || p.respirationClass === 'high' ? FRESH_PRODUCE_RESULT
      : p.category === 'snack' || p.category === 'dry_goods' ? DRY_GOODS_RESULT
        : GENERIC_RESULT;

  return {
    analysisId: 'an_mock_' + Math.random().toString(16).slice(2, 10),
    ...structuredClone(fixture),
  };
}
