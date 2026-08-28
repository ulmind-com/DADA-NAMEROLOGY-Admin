import React, { useState } from 'react';
import { Card, Field } from '@/components/ui';
import { useSession } from '@/lib/session';

export default function Login() {
  const { signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch (err: any) {
      setError(err?.message ?? 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Card className="login-card">
        <img src="/sun-emblem.png" alt="" />
        <div className="brand-kicker" style={{ marginTop: 10 }}>DADA'S</div>
        <h1 style={{ marginTop: 2 }}>NUMEROLOGY</h1>
        <p className="small muted" style={{ marginTop: 8 }}>Admin panel — authorised staff only</p>

        <form className="login-form" onSubmit={submit}>
          <Field label="EMAIL">
            <input
              className="input"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@dadanumerology.com"
              required
            />
          </Field>
          <Field label="PASSWORD">
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </Field>

          {!!error && (
            <div className="pill pill-bad" style={{ padding: '9px 13px', borderRadius: 'var(--r)' }}>
              {error}
            </div>
          )}

          <button className="btn btn-primary" disabled={loading} style={{ height: 44 }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </Card>
    </div>
  );
}
