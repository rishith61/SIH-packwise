import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useWizard } from '../../context/WizardContext';
import { CONSTRAINT_SUGGESTIONS, PRIORITY_FIELDS } from '../../data/wizard';
import { useFocusOnMount } from '../../hooks/useFocusOnMount';
import Button from '../../components/Button';
import TagChip from '../../components/TagChip';
import LockIcon from '../../components/icons/LockIcon';
import ScaleIcon from '../../components/icons/ScaleIcon';
import StepActions from '../../components/wizard/StepActions';
import fieldStyles from '../../components/wizard/Field.module.css';
import styles from './Wizard.module.css';
import own from './PrioritiesStep.module.css';

const WEIGHT_WORDS = ['Ignore', 'Very low', 'Low', 'Low', 'Moderate', 'Moderate', 'Moderate', 'High', 'High', 'Very high', 'Critical'];

export default function PrioritiesStep() {
  const { state, dispatch, runAnalysis } = useWizard();
  const navigate = useNavigate();
  const headingRef = useFocusOnMount();
  const [custom, setCustom] = useState('');

  const p = state.priorities;
  const total = PRIORITY_FIELDS.reduce((sum, f) => sum + p[f.key], 0);
  const constraints = p.hardConstraints;
  const suggested = new Set(CONSTRAINT_SUGGESTIONS.map((s) => s.value));
  const extraConstraints = constraints.filter((c) => !suggested.has(c));

  function toggleSuggestion(value) {
    dispatch({ type: constraints.includes(value) ? 'constraints/remove' : 'constraints/add', value });
  }

  function addCustom(e) {
    e.preventDefault();
    if (!custom.trim()) return;
    dispatch({ type: 'constraints/add', value: custom });
    setCustom('');
  }

  function analyze() {
    runAnalysis();
    navigate('/analyze/running');
  }

  return (
    <div className={styles.page}>
      <p className={styles.eyebrow}>Step 4 of 5</p>
      <h1 className={styles.title} tabIndex={-1} ref={headingRef}>What matters most?</h1>
      <p className={styles.sub}>
        Weight each priority independently. Candidates that pass the requirements are ranked with these weights, so the trade-offs stay explicit.
      </p>

      <section className={`${styles.panel} ${styles.section}`} aria-labelledby="weights-title">
        <div className={styles.panelHead}>
          <span className={styles.panelIcon} aria-hidden="true"><ScaleIcon /></span>
          <div>
            <h2 className={styles.panelTitle} id="weights-title">Priority weights</h2>
            <p className={styles.panelSub}>0 ignores a priority, 1 makes it as important as possible.</p>
          </div>
        </div>

        <div className={own.sliders}>
          {PRIORITY_FIELDS.map((f) => {
            const v = p[f.key];
            return (
              <div key={f.key} className={own.slider} style={{ '--c': f.color }}>
                <div className={own.sliderHead}>
                  <label htmlFor={'prio-' + f.key} className={own.sliderLabel}>
                    <span className={own.swatch} aria-hidden="true"></span>{f.label}
                  </label>
                  <output htmlFor={'prio-' + f.key} className={own.value}>
                    {v.toFixed(1)} <span>{WEIGHT_WORDS[Math.round(v * 10)]}</span>
                  </output>
                </div>
                <input
                  id={'prio-' + f.key}
                  className={own.range}
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={v}
                  aria-describedby={'prio-' + f.key + '-hint'}
                  aria-valuetext={`${v.toFixed(1)}, ${WEIGHT_WORDS[Math.round(v * 10)]}`}
                  onChange={(e) => dispatch({ type: 'priorities/set', field: f.key, value: Number(e.target.value) })}
                />
                <p className={own.hint} id={'prio-' + f.key + '-hint'}>{f.hint}</p>
              </div>
            );
          })}
        </div>

        <div className={own.emphasis}>
          <p className={own.emphasisLabel}>Relative emphasis</p>
          {total > 0 ? (
            <>
              <div className={own.bar} role="img" aria-label={PRIORITY_FIELDS.map((f) => `${f.label} ${Math.round((p[f.key] / total) * 100)}%`).join(', ')}>
                {PRIORITY_FIELDS.map((f) => (
                  <span key={f.key} style={{ flexGrow: p[f.key], background: f.color }}></span>
                ))}
              </div>
              <ul className={own.legend} aria-hidden="true">
                {PRIORITY_FIELDS.map((f) => (
                  <li key={f.key} style={{ '--c': f.color }}>
                    <span className={own.swatch}></span>{f.label} {Math.round((p[f.key] / total) * 100)}%
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className={own.none}>No priority has any weight yet.</p>
          )}
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="constraints-title">
        <div className={styles.panelHead}>
          <span className={styles.panelIcon} aria-hidden="true"><LockIcon /></span>
          <div>
            <h2 className={styles.panelTitle} id="constraints-title">Hard constraints <span className={own.optional}>(optional)</span></h2>
            <p className={styles.panelSub}>Candidates that break any of these are filtered out rather than ranked lower.</p>
          </div>
        </div>
        <div className={own.chips} role="group" aria-label="Suggested constraints">
          {CONSTRAINT_SUGGESTIONS.map((s) => (
            <TagChip key={s.value} tag={s.label} pressed={constraints.includes(s.value)} onSelect={() => toggleSuggestion(s.value)} />
          ))}
        </div>

        <form className={own.addRow} onSubmit={addCustom}>
          <label htmlFor="constraint-custom" className="sr-only">Custom constraint</label>
          <input
            id="constraint-custom"
            className={fieldStyles.input}
            type="text"
            placeholder="Custom constraint, e.g. food_contact_grade:true"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
          <Button type="submit" variant="ghost" disabled={!custom.trim()}>Add</Button>
        </form>

        {extraConstraints.length > 0 && (
          <ul className={own.extra} aria-label="Custom constraints">
            {extraConstraints.map((c) => (
              <li key={c}>
                <code>{c}</code>
                <button type="button" className={own.remove} onClick={() => dispatch({ type: 'constraints/remove', value: c })} aria-label={`Remove ${c}`}>×</button>
              </li>
            ))}
          </ul>
        )}
        {constraints.length > 0 && (
          <p className={own.sent}>Sent as: {constraints.map((c) => <code key={c}>{c}</code>)}</p>
        )}
      </section>

      <StepActions backTo="/analyze/conditions" nextLabel="Analyze packaging" onNext={analyze} />
    </div>
  );
}
