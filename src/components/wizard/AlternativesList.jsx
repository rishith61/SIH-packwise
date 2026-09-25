import Button from '../Button';
import styles from './Result.module.css';

export default function AlternativesList({ items, onCompare }) {
  return (
    <section className={styles.panel} aria-labelledby="alts-title">
      <h2 className={styles.panelTitle} id="alts-title">Alternatives</h2>
      <p className={styles.panelSub}>Other candidates and what you'd trade to use them.</p>
      {items?.length ? (
        <ul className={styles.alts}>
          {items.map((alt, i) => (
            <li key={alt.structure + i} className={styles.alt}>
              <h3 className={styles.altTitle}>{alt.structure}</h3>
              <p className={styles.altText}>{alt.tradeoffSummary}</p>
              {onCompare && (
                <Button variant="ghost" size="sm" className={styles.altBtn} onClick={() => onCompare(i)}>
                  <span>Compare<span className="sr-only">{` ${alt.structure} with the recommendation`}</span></span>
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>No alternative candidates met the constraints.</p>
      )}
    </section>
  );
}
