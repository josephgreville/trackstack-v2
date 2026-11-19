const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Turn an API error's details into field-name to message pairs. */
export function fieldErrorsFrom(error) {
  const errors = {};
  const details = error?.details;

  if (Array.isArray(details)) {
    details.forEach(({ field, message }) => {
      if (field && message) errors[field] = message;
    });
  } else if (details?.field && error?.message) {
    errors[details.field] = error.message;
  }

  return errors;
}

/** Keep the server's wording when it gives one, otherwise use a safe fallback. */
export function messageFrom(error, fallback) {
  return typeof error?.message === 'string' && error.message.trim()
    ? error.message
    : fallback;
}

export function validateLogin({ email, password }) {
  const errors = {};
  const address = email.trim();

  if (!address) errors.email = 'Email is required.';
  else if (!EMAIL_PATTERN.test(address)) errors.email = 'Enter a valid email address.';
  if (!password) errors.password = 'Password is required.';

  return errors;
}

export function validateRegister({ username, email, password, confirmPassword }) {
  const errors = {};
  const name = username.trim();
  const address = email.trim();

  if (!name) errors.username = 'Username is required.';
  else if (name.length < 2) errors.username = 'Username must be at least 2 characters.';
  else if (name.length > 40) errors.username = 'Username must be 40 characters or fewer.';
  else if (!/^[a-zA-Z0-9][a-zA-Z0-9 _.-]*$/.test(name)) {
    errors.username = 'Use letters, numbers, spaces, dots, dashes or underscores.';
  }

  if (!address) errors.email = 'Email is required.';
  else if (!EMAIL_PATTERN.test(address)) errors.email = 'Enter a valid email address.';
  else if (address.length > 254) errors.email = 'Email must be 254 characters or fewer.';

  if (!password) errors.password = 'Password is required.';
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
  else if (password.length > 128) errors.password = 'Password must be 128 characters or fewer.';

  if (!confirmPassword) errors.confirmPassword = 'Confirm your password.';
  else if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match.';

  return errors;
}
