import { cx } from '../utils/cx';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={cx('container', styles.inner)}>
        <span>© 2026 PackWise</span>
        <span>Packaging recommendations for food makers</span>
      </div>
    </footer>
  );
}
