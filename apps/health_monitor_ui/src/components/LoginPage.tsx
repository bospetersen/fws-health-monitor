import { createSignal } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useAuth } from '../services/authService';
import styles from './pages/pageLayout.module.css';
import loginStyles from './pages/login.module.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  
  let emailInputRef: HTMLInputElement | undefined;
  let passwordInputRef: HTMLInputElement | undefined;
  
  const [error, setError] = createSignal<string | null>(null);
  const [isLoading, setIsLoading] = createSignal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const email = emailInputRef?.value || '';
      const password = passwordInputRef?.value || '';
      await auth.login(email, password);
      navigate('/system/health');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class={loginStyles.loginContainer}>
      <div class={loginStyles.loginBox}>
        <h1>Health Monitor</h1>
        <p>Login to access system monitoring</p>

        <form onsubmit={handleSubmit} class={loginStyles.loginForm}>
          {error() && <div class={loginStyles.errorMessage}>{error()}</div>}

          <div class={loginStyles.formGroup}>
            <label for="email">Email</label>
            <input
              ref={emailInputRef}
              id="email"
              type="email"
              placeholder="admin@colorworks.local"
              required
              disabled={isLoading()}
            />
          </div>

          <div class={loginStyles.formGroup}>
            <label for="password">Password</label>
            <input
              ref={passwordInputRef}
              id="password"
              type="password"
              placeholder="Enter your password"
              required
              disabled={isLoading()}
            />
          </div>

          <button type="submit" class={loginStyles.loginButton} disabled={isLoading()}>
            {isLoading() ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div class={loginStyles.infoBox}>
          <p>
            <strong>Demo Credentials:</strong>
          </p>
          <p>Email: admin@colorworks.local</p>
          <p style={{ "color": "#666", "font-size": "12px" }}>
            (Password provided during setup)
          </p>
        </div>
      </div>
    </div>
  );
}
