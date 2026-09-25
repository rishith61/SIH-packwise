import { Navigate, useNavigate } from 'react-router';
import { useWizard } from '../../context/WizardContext';
import { buildAnalyzePayload } from '../../lib/wizardModel';
import { useFocusOnMount } from '../../hooks/useFocusOnMount';
import { conditionsSummary } from '../../utils/summary';
import Button from '../../components/Button';
import AlternativesList from '../../components/wizard/AlternativesList';
import FreshProducePanel from '../../components/wizard/FreshProducePanel';
import Notice from '../../components/wizard/Notice';
import RecommendationHeader from '../../components/wizard/RecommendationHeader';
import RequirementTable from '../../components/wizard/RequirementTable';
import WhyThisPanel from '../../components/wizard/WhyThisPanel';
import resultStyles from '../../components/wizard/Result.module.css';
import styles from './Wizard.module.css';
import own from './ResultPage.module.css';

/** Screen 6, the hero screen: recommendation, requirements, why, alternatives. */
export default function ResultPage() {
  const { state, dispatch, runAnalysis, reset } = useWizard();
  const navigate = useNavigate();
  const headingRef = useFocusOnMount();
  const result = state.analysis.result;

  if (!result) return <Navigate to="/analyze/priorities" replace />;

  const stale = state.analysis.payloadKey !== JSON.stringify(buildAnalyzePayload(state));

  function compare(i) {
    dispatch({ type: 'compare/set', indices: [i] });
    navigate('/analyze/report');
  }

  function rerun() {
    runAnalysis();
    navigate('/analyze/running');
  }

  function startOver() {
    reset();
    navigate('/analyze/commodity');
  }

  return (
    <div className={styles.page}>
      <RecommendationHeader
        headingRef={headingRef}
        structure={result.recommendation?.structure}
        confidence={result.recommendation?.confidence}
        commodityName={state.commodity.commodityName}
        basis={conditionsSummary(state)}
        analysisId={result.analysisId}
      />

      {stale && (
        <div className={own.gap}>
          <Notice
            tone="warn"
            title="Your inputs changed since this analysis"
            actions={<Button size="sm" onClick={rerun}>Re-run analysis</Button>}
          >
            The result below reflects your previous inputs.
          </Notice>
        </div>
      )}

      <section className={`${resultStyles.panel} ${own.gap}`} aria-labelledby="req-title">
        <h2 className={resultStyles.panelTitle} id="req-title">Requirements</h2>
        <p className={resultStyles.panelSub}>What the package has to achieve for this food and these conditions, and how the recommended structure performs against each.</p>
        <RequirementTable rows={result.requirements} />
      </section>

      <div className={result.freshProduceMode ? own.split : own.gap}>
        <WhyThisPanel reasons={result.why} />
        {result.freshProduceMode && <FreshProducePanel data={result.freshProduce} />}
      </div>

      <div className={own.gap}>
        <AlternativesList items={result.alternatives} onCompare={compare} />
      </div>

      <div className={own.actions} data-print="hide">
        <Button to="/analyze/report">Compare & export report <span aria-hidden="true">→</span></Button>
        <Button variant="ghost" to="/analyze/priorities">Edit inputs</Button>
        <Button variant="ghost" onClick={startOver}>Start a new analysis</Button>
      </div>
    </div>
  );
}
