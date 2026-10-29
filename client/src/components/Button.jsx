import { createElement } from 'react';
import { Link } from 'react-router-dom';

export default function Button({
  as,
  to,
  href,
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  icon,
  fullWidth = false,
  type = 'button',
  disabled,
  ...props
}) {
  const Component = as ?? (to ? Link : href ? 'a' : 'button');
  const componentProps = {
    className: [
      'btn',
      `btn-${variant}`,
      `btn-${size}`,
      fullWidth ? 'btn-block' : '',
      className,
    ]
      .filter(Boolean)
      .join(' '),
    ...(Component === 'button' ? { type, disabled: disabled || loading } : {}),
    ...(to ? { to } : {}),
    ...(href ? { href } : {}),
    ...props,
  };

  return createElement(
    Component,
    componentProps,
    loading ? <span className="spinner" aria-hidden="true" /> : icon ? <span className="btn-icon">{icon}</span> : null,
    children ? <span>{children}</span> : null,
  );
}
