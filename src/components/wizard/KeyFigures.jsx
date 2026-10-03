import { dayRange, days, inr, label, num } from '../../utils/format';
import ProvenanceBadge from './ProvenanceBadge';
import resultStyles from './Result.module.css';
import styles from './Insights.module.css';

/** Shelf life against the target, cost, footprint and end of life for one structure. */
export default function KeyFigures({ shelfLife, costAndImpact, title = 'At a glance', sub = 'Estimated performance of the recommended structure, per pack.' }) {
  if (!shelfLife && !costAndImpact) return null;
  const s = shelfLife || {};
  const c = costAndImpact || {};
  const range = dayRange(s.lowDays, s.highDays);

  return (
    <section className={resultStyles.panel} aria-labelledby="figures-title">
      <div className={styles.head}>
        <div>
          <h2 className={resultStyles.panelTitle} id="figures-title">{title}</h2>
          <p className={resultStyles.panelSub}>{sub}</p>
        </div>
        <ProvenanceBadge value={s.provenance || c.provenance} />
      </div>
      <dl className={styles.figures}>
        {days(s.estimateDays) && (
          <div className={styles.figure}>
            <dt>Estimated shelf life</dt>
            <dd>
              <span className={styles.value}>{days(s.estimateDays)}</span>
              <span className={styles.detail}>
                {range && <>Range {range}</>}
                {range && s.targetDays ? ' · ' : ''}
                {s.targetDays ? <>target {days(s.targetDays)}</> : null}
              </span>
              {typeof s.meetsTarget === 'boolean' && (
                <span className={styles.flag} data-ok={String(s.meetsTarget)}>
                  {s.meetsTarget ? 'Meets your target' : 'Below your target'}
                </span>
              )}
            </dd>
          </div>
        )}
        {s.failureMode && (
          <div className={styles.figure}>
            <dt>What limits it</dt>
            <dd>
              <span className={`${styles.value} ${styles.valueText}`}>{label(s.failureMode)}</span>
              <span className={styles.detail}>First quality failure expected in this pack</span>
            </dd>
          </div>
        )}
        {inr(c.inrPerPack) && (
          <div className={styles.figure}>
            <dt>Packaging cost</dt>
            <dd>
              <span className={styles.value}>{inr(c.inrPerPack)}</span>
              <span className={styles.detail}>
                {c.costBand && <>{label(c.costBand)} cost band</>}
                {inr(c.eprFeeInrPerPack) && <> · EPR fee {inr(c.eprFeeInrPerPack)}</>}
              </span>
            </dd>
          </div>
        )}
        {num(c.gCo2ePerPack) && (
          <div className={styles.figure}>
            <dt>Carbon footprint</dt>
            <dd>
              <span className={styles.value}>{num(c.gCo2ePerPack, 'g CO₂e')}</span>
              {num(c.gramsPerPack) && <span className={styles.detail}>{num(c.gramsPerPack, 'g')} of film per pack</span>}
            </dd>
          </div>
        )}
        {typeof c.recyclable === 'boolean' && (
          <div className={styles.figure}>
            <dt>End of life</dt>
            <dd>
              <span className={styles.value}>{c.recyclable ? 'Recyclable' : 'Hard to recycle'}</span>
              <span className={styles.detail}>
                {c.monoMaterial ? 'Mono-material' : 'Multi-material'}
                {num(c.recyclabilityIndex) && <> · index {c.recyclabilityIndex}/100</>}
                {c.eprCategory && <> · EPR category {c.eprCategory}</>}
              </span>
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}
