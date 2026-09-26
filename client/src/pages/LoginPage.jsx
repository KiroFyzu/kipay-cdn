import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';

export default function LoginPage() {
  const { login, verifyLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [loginToken, setLoginToken] = useState(null);
  const [code, setCode] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await login(email, password);
      if (result.requires2FA) {
        setLoginToken(result.loginToken);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await verifyLogin(loginToken, code);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-shell-top">
        <span className="brand">
          <span className="brand-mark" aria-hidden="true"><i className="fa-solid fa-cloud-arrow-up" /></span>
          <span className="brand-text">Uploader CDN</span>
        </span>
        <ThemeToggle />
      </div>
      <div className="auth-shell-body">
        {loginToken ? (
          <div className="auth-form">
            <h1>Two-Factor Verification</h1>
            <p className="page-subtitle">Enter the 6-digit code from your authenticator app.</p>
            <form onSubmit={handleVerify}>
              <input
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                maxLength={6}
                autoFocus
                aria-label="6-digit authentication code"
              />
              {error && <p className="error">{error}</p>}
              <button type="submit" className="primary" disabled={submitting}>
                {submitting ? 'Verifying…' : 'Verify & Login'}
              </button>
            </form>
            <p>
              <button className="link-button" onClick={() => setLoginToken(null)}>
                <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Back
              </button>
            </p>
          </div>
        ) : (
          <div className="auth-form">
            <h1>Login</h1>
            <form onSubmit={handleSubmit}>
              <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
              {error && <p className="error">{error}</p>}
              <button type="submit" className="primary" disabled={submitting}>{submitting ? 'Logging in…' : 'Login'}</button>
            </form>
            <p>No account? <Link to="/register">Register</Link></p>
          </div>
        )}
      </div>
    </div>
  );
}
