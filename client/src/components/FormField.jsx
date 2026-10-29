import { useId, useState } from 'react';
import { IconEye, IconEyeOff } from './Icons.jsx';

export default function FormField({
  label,
  name,
  type = 'text',
  as = 'input',
  error,
  hint,
  required,
  value,
  onChange,
  placeholder,
  autoComplete,
  autoFocus,
  rows = 4,
  maxLength,
  children,
  className = '',
  ...props
}) {
  const id = useId();
  const descriptionId = `${id}-description`;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;
  const Element = as;

  return (
    <div className={`field ${error ? 'field-has-error' : ''} ${className}`.trim()}>
      <div className="field-label-row">
        <label htmlFor={id} className="field-label">
          {label}
          {required ? <span className="field-required"> *</span> : null}
        </label>
        {hint ? (
          <span className="field-hint" id={descriptionId}>
            {hint}
          </span>
        ) : null}
      </div>

      <div className={`field-control ${isPassword ? 'field-control-password' : ''}`.trim()}>
        <Element
          id={id}
          name={name}
          type={as === 'input' ? inputType : undefined}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          rows={as === 'textarea' ? rows : undefined}
          maxLength={maxLength}
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : hint ? descriptionId : undefined}
          className="field-input"
          {...props}
        >
          {children}
        </Element>

        {isPassword ? (
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
          >
            {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="field-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
