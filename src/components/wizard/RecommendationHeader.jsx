import ConfidenceBadge from './ConfidenceBadge';
import styles from './Result.module.css';

export default function RecommendationHeader({ structure, confidence, commodityName, basis, analysisId, headingRef }) {
  return (
    <header className={styles.recHeader}>
      <p className={styles.eyebrow}>Recommended packaging structure{commodityName && <> for <strong>{commodityName}</strong></>}</p>
      <div className={styles.recTitleRow}>
        <h1 className={styles.recTitle} tabIndex={-1} ref={headingRef}>{structure}</h1>
        <ConfidenceBadge value={confidence} />
      </div>
      {basis && <p className={styles.basis}>Based on {basis}</p>}
      {analysisId && <p className={styles.analysisId}>Analysis {analysisId}</p>}
    </header>
  );
}
