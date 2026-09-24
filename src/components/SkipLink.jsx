import { useJumpToGrid } from '../context/UnpackContext';
import styles from './SkipLink.module.css';

export default function SkipLink() {
  const onJump = useJumpToGrid();
  return (
    <a className={styles.skipLink} href="#categories" data-jump="categories" onClick={onJump}>
      Skip to categories
    </a>
  );
}
