import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

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

  if (loginToken) {
    return (
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
          />
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={submitting}>
            {submitting ? 'Verifying…' : 'Verify & Login'}
          </button>
        </form>
        <p>
          <button className="link-button" onClick={() => setLoginToken(null)}>
            <i className="fa-solid fa-arrow-left" /> Back
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="auth-form">
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>{submitting ? 'Logging in…' : 'Login'}</button>
      </form>
      <p>No account? <Link to="/register">Register</Link></p>
    </div>
  );
}
