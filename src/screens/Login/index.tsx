import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin } from '../../api/useLogin';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate(
      { email, password },
      { onSuccess: () => navigate('/', { replace: true }) }
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="card"
        style={{ width: 360, padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div className="logo-mark">R</div>
          <div>
            <div className="logo-name">Rewive</div>
            <div className="logo-tag">Accountability Layer</div>
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              border: '1px solid var(--border)',
              borderRadius: 9,
              fontSize: 13.5,
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)', display: 'block', marginBottom: 6 }}>
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              border: '1px solid var(--border)',
              borderRadius: 9,
              fontSize: 13.5,
              fontFamily: 'inherit',
            }}
          />
        </div>

        {login.isError && (
          <div style={{ fontSize: 12.5, color: 'var(--red)' }}>Invalid email or password.</div>
        )}

        <button className="btn primary" type="submit" disabled={login.isPending} style={{ justifyContent: 'center' }}>
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
