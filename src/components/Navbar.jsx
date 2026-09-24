import { useJumpToGrid, useUnpack } from '../context/UnpackContext';
import { cx } from '../utils/cx';
import Button from './Button';
import ThemeToggle from './ThemeToggle';
import LeafIcon from './icons/LeafIcon';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { register } = useUnpack();
  const onJump = useJumpToGrid();
  return (
    <header className={styles.nav} id="top" ref={register('nav')}>
      <div className={cx('container', styles.inner)}>
        <a className={styles.logo} href="#top" aria-label="PackWise home">
          <LeafIcon aria-hidden="true" />
          <span>PackWise</span>
        </a>
        <div className={styles.actions}>
          <ThemeToggle />
          <Button variant="ghost" size="sm" className={styles.signin}>Sign in</Button>
          <Button href="#categories" size="sm" data-jump="categories" onClick={onJump}>Get started</Button>
        </div>
      </div>
    </header>
  );
}
