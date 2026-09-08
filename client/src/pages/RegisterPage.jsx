import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RegisterPage() {
  const { register, verifyRegistrationSetup } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [setup, setSetup] = useState(null); // { setupToken, qrCode, secret, email }
  const [code, setCode] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await register(email, password);
      setSetup(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await verifyRegistrationSetup(setup.setupToken, code);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code');
    } finally {
      setSubmitting(false);
    }
  }

  if (setup) {
    return (
      <div className="auth-form auth-form-wide">
        <h1>Set up Two-Factor Authentication</h1>
        <p className="page-subtitle">
          Scan this QR code with Google Authenticator, Authy, or any TOTP app, then enter the
          6-digit code to finish creating your account.
        </p>
        <img src={setup.qrCode} alt="2FA QR code" className="totp-qr" />
        <p className="settings-label">Can't scan? Enter this key manually:</p>
        <code className="totp-secret">{setup.secret}</code>
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
            {submitting ? 'Verifying…' : 'Verify & Finish'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="auth-form">
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>{submitting ? 'Creating…' : 'Create account'}</button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}
