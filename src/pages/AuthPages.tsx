import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { LogIn, UserPlus, ArrowLeft, Mail } from 'lucide-react';

export const AuthPages: React.FC = () => {
  const { login, signup, resetPassword, loginWithGoogle, profile } = useAuth();
  const { settings } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  // Switch between 'login', 'signup', 'forgot'
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    // If user is already logged in, redirect them
    if (profile) {
      if (redirect === 'checkout') {
        navigate('/checkout');
      } else if (profile.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/account');
      }
    }
  }, [profile, redirect, navigate]);

  const handleGoogleSignIn = async (forceRedirect: boolean = false) => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle(forceRedirect);
      // Redirect handled by useEffect
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const validateEmail = (mail: string) => {
    if (mode === 'login') return mail.trim().length > 0;
    return /\S+@\S+\.\S+/.test(mail);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email) {
      setError('Please provide an email address.');
      return;
    }
    if (!validateEmail(email)) {
      setError('Invalid email address format.');
      return;
    }

    if (mode === 'login') {
      if (!password) {
        setError('Please enter your password.');
        return;
      }
      setLoading(true);
      try {
        await login(email, password);
        // Redirect handled by useEffect
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Incorrect email or password. Please try again.');
      } finally {
        setLoading(false);
      }
    } else if (mode === 'signup') {
      if (!name) {
        setError('Please enter your full name.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      setLoading(true);
      try {
        await signup(email, password, name);
        // Redirect handled by useEffect
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Registration failed. The email might already be in use.');
      } finally {
        setLoading(false);
      }
    } else if (mode === 'forgot') {
      setLoading(true);
      try {
        await resetPassword(email);
        setSuccessMsg('Reset link sent! Please check your email inbox.');
        setEmail('');
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to send reset email. Verify the address is correct.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh', padding: '40px 24px' }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '440px', 
        backgroundColor: '#FFFFFF', 
        border: '1px solid var(--border-color)', 
        borderRadius: '4px',
        padding: '40px 32px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        
        {/* Mode headers */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontFamily: 'var(--font-serif)', marginBottom: '8px' }}>
            {mode === 'login' && 'Welcome Back'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'forgot' && 'Reset Password'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {mode === 'login' && 'Sign in to access your orders and profile'}
            {mode === 'signup' && `Join ${settings.storeName} to start shopping`}
            {mode === 'forgot' && 'Enter your email to receive a recovery link'}
          </p>
        </div>

        {error && (
          <div className="error-banner" style={{ fontSize: '13px', padding: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
            <div style={{ fontWeight: 600 }}>{error}</div>
            {error.includes('Firebase Console') && (
              <div style={{ marginTop: '10px' }}>
                <a
                  href="https://console.firebase.google.com/project/mahi-handcrafts/authentication"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-block',
                    padding: '8px 14px',
                    backgroundColor: 'var(--brand-primary)',
                    color: '#FFFFFF',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  Open Firebase Console to Enable Google →
                </a>
              </div>
            )}
          </div>
        )}
        {successMsg && (
          <div style={{ 
            backgroundColor: '#D1FAE5', 
            color: '#065F46', 
            border: '1px solid #A7F3D0',
            padding: '12px', 
            fontSize: '13px',
            borderRadius: '4px', 
            marginBottom: '20px' 
          }}>
            {successMsg}
          </div>
        )}

        {/* Continue with Google */}
        {mode !== 'forgot' && (
          <div style={{ marginBottom: '24px' }}>
            <button
              type="button"
              onClick={() => handleGoogleSignIn(false)}
              disabled={googleLoading || loading}
              className="btn-google"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => handleGoogleSignIn(true)}
                disabled={googleLoading || loading}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px 8px',
                  color: 'var(--text-muted)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Popup blocked or closing? Sign in directly with Google
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', marginTop: '20px', gap: '12px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                or with email
              </span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
            </div>
          </div>
        )}

        <form onSubmit={handleFormSubmit}>
          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="Jane Doe"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email or Username</label>
            <input
              type="text"
              className="input-field"
              placeholder="jane@example.com or admin"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          {mode !== 'forgot' && (
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          )}

          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
          )}

          {mode === 'login' && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
              <button 
                type="button" 
                onClick={() => { setMode('forgot'); setError(''); }}
                style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', fontSize: '13px', cursor: 'pointer' }}
              >
                Forgot your password?
              </button>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginBottom: '24px' }}>
            {loading && 'Please wait...'}
            {!loading && mode === 'login' && <><LogIn size={16} /> Sign In</>}
            {!loading && mode === 'signup' && <><UserPlus size={16} /> Register</>}
            {!loading && mode === 'forgot' && <><Mail size={16} /> Send Recovery Link</>}
          </button>
        </form>

        {/* Action Toggle Switchers */}
        <div style={{ 
          borderTop: '1px solid var(--border-color)', 
          paddingTop: '24px', 
          textAlign: 'center',
          fontSize: '14px',
          color: 'var(--text-muted)'
        }}>
          {mode === 'login' && (
            <p>
              New to {settings.storeName}?{' '}
              <button 
                onClick={() => { setMode('signup'); setError(''); }} 
                style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', fontWeight: 600, cursor: 'pointer' }}
              >
                Sign up here
              </button>
            </p>
          )}
          {mode === 'signup' && (
            <p>
              Already have an account?{' '}
              <button 
                onClick={() => { setMode('login'); setError(''); }} 
                style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', fontWeight: 600, cursor: 'pointer' }}
              >
                Sign in here
              </button>
            </p>
          )}
          {mode === 'forgot' && (
            <button 
              onClick={() => { setMode('login'); setError(''); }}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'var(--text-main)', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px',
                cursor: 'pointer' 
              }}
            >
              <ArrowLeft size={16} /> Return to Sign In
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
