import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { analyze, getCommodity } from '../services/api';
import { matchCustomPreset } from '../data/customPresets';
import { buildAnalyzePayload, clearPersisted, loadPersisted, persist, reducer } from '../lib/wizardModel';

const WizardContext = createContext(null);

/**
 * Holds the wizard's input across steps 1–4 and the analysis result. State
 * is mirrored to localStorage so a failed request or reload never loses input.
 */
export function WizardProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadPersisted);
  const stateRef = useRef(state);
  stateRef.current = state;
  const commodityCtrl = useRef(null);
  const analysisCtrl = useRef(null);

  useEffect(() => { persist(state); }, [state]);
  useEffect(() => () => {
    commodityCtrl.current?.abort();
    analysisCtrl.current?.abort();
  }, []);

  /** Fetches a predefined commodity's default profile. Resolves true on success. */
  const loadCommodity = useCallback(async ({ commodityId, name }) => {
    commodityCtrl.current?.abort();
    const ctrl = new AbortController();
    commodityCtrl.current = ctrl;
    dispatch({ type: 'commodity/loadStart', commodityId, name });
    try {
      const payload = await getCommodity(commodityId, { signal: ctrl.signal });
      if (ctrl.signal.aborted) return false;
      dispatch({ type: 'commodity/loaded', payload });
      return true;
    } catch (error) {
      if (ctrl.signal.aborted) return false;
      dispatch({ type: 'commodity/loadError', error: { message: error.message, code: error.code } });
      return false;
    }
  }, []);

  const startCustom = useCallback(({ name, category, notes }) => {
    commodityCtrl.current?.abort();
    const preset = matchCustomPreset(name, notes?.description);
    dispatch({ type: 'commodity/custom', name, category, notes, preset });
  }, []);

  /** Sends POST /api/analyze with the current wizard state. */
  const runAnalysis = useCallback(async () => {
    if (stateRef.current.analysis.status === 'running') return;
    analysisCtrl.current?.abort();
    const ctrl = new AbortController();
    analysisCtrl.current = ctrl;
    const payload = buildAnalyzePayload(stateRef.current);
    const payloadKey = JSON.stringify(payload);
    dispatch({ type: 'analysis/start' });
    try {
      const result = await analyze(payload, { signal: ctrl.signal });
      if (!ctrl.signal.aborted) dispatch({ type: 'analysis/success', result, payloadKey });
    } catch (error) {
      if (ctrl.signal.aborted) return;
      dispatch({
        type: 'analysis/error',
        error: { code: error.code || 'UNKNOWN_ERROR', message: error.message, field: error.field || null },
      });
    }
  }, []);

  const reset = useCallback(() => {
    commodityCtrl.current?.abort();
    analysisCtrl.current?.abort();
    clearPersisted();
    dispatch({ type: 'reset' });
  }, []);

  const value = useMemo(
    () => ({ state, dispatch, loadCommodity, startCustom, runAnalysis, reset }),
    [state, loadCommodity, startCustom, runAnalysis, reset],
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard() {
  return useContext(WizardContext);
}

/** Server-side validation message for a contract field path, if any. */
export function useFieldError(path) {
  return useContext(WizardContext).state.fieldErrors[path] || null;
}
