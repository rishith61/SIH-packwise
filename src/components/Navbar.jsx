import { Link } from 'react-router';
import { useJumpToGrid, useUnpack } from '../context/UnpackContext';
import { cx } from '../utils/cx';
import Button from './Button';
import ThemeToggle from './ThemeToggle';
import LeafIcon from './icons/LeafIcon';
import styles from './Navbar.module.css';

/** On the landing page it drives the unpack animation; in the wizard it links home. */
export default function Navbar() {
  const unpack = useUnpack();
  const onJump = useJumpToGrid();
  const logo = (
    <>
      <LeafIcon aria-hidden="true" />
      <span>PackWise</span>
    </>
  );
  return (
    <header className={styles.nav} id="top" ref={unpack?.register('nav')} data-print="hide">
      <div className={cx('container', styles.inner)}>
        {unpack
          ? <a className={styles.logo} href="#top" aria-label="PackWise home">{logo}</a>
          : <Link className={styles.logo} to="/" aria-label="PackWise home">{logo}</Link>}
        <div className={styles.actions}>
          <ThemeToggle />
          <Button variant="ghost" size="sm" className={styles.signin}>Sign in</Button>
          {unpack && <Button href="#categories" size="sm" data-jump="categories" onClick={onJump}>Get started</Button>}
        </div>
      </div>
    </header>
  );
}
