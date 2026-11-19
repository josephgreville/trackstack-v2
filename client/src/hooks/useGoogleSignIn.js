import { useEffect, useState } from 'react';
import { authService } from '../services/index.js';

export function useGoogleSignIn() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    authService
      .googleStatus()
      .then(({ configured }) => {
        if (active) setAvailable(Boolean(configured));
      })
      .catch(() => {
        if (active) setAvailable(false);
      });
    return () => { active = false; };
  }, []);

  return available;
}
