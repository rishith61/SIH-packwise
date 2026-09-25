import { Navigate, Outlet, useLocation } from 'react-router';
import { useWizard } from '../../context/WizardContext';
import { WIZARD_STEPS } from '../../data/wizard';
import { lowConfidence, stepCompletion } from '../../lib/wizardModel';
import { USING_MOCKS } from '../../services/api';
import { cx } from '../../utils/cx';
import SkipLink from '../../components/SkipLink';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import WizardStepper from '../../components/wizard/WizardStepper';
import LowConfidenceBanner from '../../components/wizard/LowConfidenceBanner';
import styles from './Wizard.module.css';

// running, result and report all sit under the final "Result" step.
function stepIndexFor(pathname) {
  const i = WIZARD_STEPS.findIndex((s) => pathname.startsWith(s.path));
  return i === -1 ? WIZARD_STEPS.length - 1 : i;
}

export default function WizardLayout() {
  const { state } = useWizard();
  const { pathname } = useLocation();
  const current = stepIndexFor(pathname);

  const done = stepCompletion(state);
  // Priorities always validate, so they only count as complete once an analysis has been run.
  const doneList = [done.commodity, done.profile, done.conditions, done.priorities && done.result, done.result];
  const loadingCommodity = state.commodityLoad.status !== 'idle';
  const isReachable = (i) => {
    if (i === 0) return true;
    if (i === 1) return done.commodity || loadingCommodity;
    if (i === 4) return done.result;
    return doneList[i - 1];
  };

  // Deep links to a later input step fall back to the furthest step the user can be on.
  if (current > 0 && current < 4 && !isReachable(current)) {
    let target = current;
    while (target > 0 && !isReachable(target)) target--;
    return <Navigate to={WIZARD_STEPS[target].path} replace />;
  }

  const confidence = lowConfidence(state);
  const showBanner = current >= 1 && !loadingCommodity;

  return (
    <>
      <SkipLink />
      <Navbar />
      <main id="main" className={styles.wizard}>
        <div className="container">
          <div className={styles.top} data-print="hide">
            <WizardStepper
              currentStep={current + 1}
              totalSteps={WIZARD_STEPS.length}
              steps={WIZARD_STEPS}
              isReachable={isReachable}
              isDone={(i) => doneList[i]}
            />
            {USING_MOCKS && (
              <span className={styles.mock} title="VITE_API_BASE_URL is not set, so the app is using built-in mock responses.">
                <span className={styles.mockDot} aria-hidden="true"></span>Demo data
              </span>
            )}
          </div>
          {showBanner && (
            <div className={cx(styles.banner)}>
              <LowConfidenceBanner isCustom={confidence.isCustom} missing={confidence.missing} />
            </div>
          )}
          <Outlet />
        </div>
      </main>
      <Footer />
    </>
  );
}
