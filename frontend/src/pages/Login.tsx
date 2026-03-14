import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../App';
import { api } from '../api';
import styles from './Login.module.css';

export default function Login() {
  const { me, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const errorCode = params.get('error');

  useEffect(() => {
    if (!loading && me) navigate('/dashboard', { replace: true });
  }, [me, loading, navigate]);

  const errorMessages: Record<string, string> = {
    not_authorized: 'Your Google account isn\'t registered as faculty for any school. Contact your school administrator.',
    token:          'Authentication failed. Please try again.',
    no_email:       'Could not retrieve your email from Google.',
    no_code:        'Authentication was cancelled.',
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}>🔍</div>
        <h1 className={styles.title}>Kids Lose Stuff</h1>
        <p className={styles.sub}>Faculty sign-in to manage your school's lost items gallery.</p>

        {errorCode && (
          <div className={styles.error}>
            {errorMessages[errorCode] ?? 'An error occurred. Please try again.'}
          </div>
        )}

        <a href={api.loginUrl()} className={`btn btn-primary ${styles.googleBtn}`}>
          <GoogleIcon />
          Sign in with Google
        </a>

        <p className={styles.note}>
          This portal is for school faculty only.
          Parents can access the gallery via the shareable link provided by your school.
        </p>
      </div>

      <footer className={styles.footer}>
        Kids Lose Stuff — free, private, no ads.
      </footer>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
