import { cx } from '../utils/cx';
import styles from './Button.module.css';

/** Renders an <a> when given an href, otherwise a <button>. */
export default function Button({ href, variant = 'primary', size, block = false, type = 'button', className, children, ...rest }) {
  const classes = cx(styles.btn, styles[variant], size === 'sm' && styles.sm, block && styles.block, className);
  if (href) {
    return <a className={classes} href={href} {...rest}>{children}</a>;
  }
  return <button type={type} className={classes} {...rest}>{children}</button>;
}
