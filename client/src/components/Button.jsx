import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { hoverCard } from './motion.jsx';

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
  const [ripple, setRipple] = useState(null);

  const handleClick = (event) => {
    if (disabled || loading) return;
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    setRipple({ x, y, size });
  };

  const Component = as ?? (to ? Link : href ? 'a' : 'button');
  const isDomElement = typeof Component === 'string';
  const MotionTag = isDomElement ? motion[Component] : motion(Component);

  return (
    <MotionTag
      className={[
        'btn',
        `btn-${variant}`,
        `btn-${size}`,
        fullWidth ? 'btn-block' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      type={isDomElement ? type : undefined}
      disabled={isDomElement ? disabled || loading : undefined}
      to={to}
      href={href}
      onClick={handleClick}
      whileHover={!disabled && !loading ? hoverCard.whileHover : undefined}
      whileTap={!disabled && !loading ? hoverCard.whileTap : undefined}
      {...props}
    >
      {loading ? (
        <span className="spinner" aria-hidden="true" />
      ) : icon ? (
        <span className="btn-icon">{icon}</span>
      ) : null}
      {children ? <span>{children}</span> : null}
      {ripple && (
        <motion.span
          initial={{ opacity: 0.5, scale: 0 }}
          animate={{ opacity: 0, scale: 2 }}
          transition={{ duration: 0.5 }}
          className="ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
          aria-hidden="true"
        />
      )}
    </MotionTag>
  );
}
