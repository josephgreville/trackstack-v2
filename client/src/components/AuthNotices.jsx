import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext.jsx';

const NOTICES = {
  google_success: ['success', 'Signed in with Google.'],
  google_cancelled: ['info', 'Google sign-in was cancelled.'],
  google_error: ['error', 'Google sign-in is unavailable right now. Please try again.'],
  google_unverified: ['error', 'Your Google account needs a verified email address.'],
};

export default function AuthNotices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { success, error, info } = useToast();
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    const notice = NOTICES[searchParams.get('auth')];
    if (!notice) return;

    shown.current = true;
    const [tone, message] = notice;
    if (tone === 'success') success(message);
    else if (tone === 'error') error(message);
    else info(message);

    searchParams.delete('auth');
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams, success, error, info]);

  return null;
}
