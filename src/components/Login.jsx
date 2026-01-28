import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import styles from './Login.module.css';

const Login = () => {
  const { signInWithSSO } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithSSO();
    } catch (err) {
      setError(err.message || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.loginSection}>
      <div className={styles.loginContainer}>
        <div className={styles.loginHeader}>
          <div className={styles.navBrand}>
            <div>
              <h1>ITCPR Account Portal</h1>
            </div>
          </div>
          <p className={styles.loginSubtitle}>Sign in to access your account</p>
        </div>
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}
        <button
          className={styles.btnApply}
          onClick={handleLogin}
          disabled={loading}
        >
          <span className="material-icons">vpn_key</span>
          {loading ? 'Signing in...' : 'Sign in with SSO'}
        </button>
      </div>
    </section>
  );
};

export default Login;
