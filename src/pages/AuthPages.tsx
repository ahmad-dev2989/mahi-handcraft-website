import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, ArrowLeft, Mail } from 'lucide-react';

export const AuthPages: React.FC = () => {
  const { login, signup, resetPassword, profile } = useAuth();
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

  const validateEmail = (mail: string) => {
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
            {mode === 'signup' && 'Join Mahi Handcraft to start shopping'}
            {mode === 'forgot' && 'Enter your email to receive a recovery link'}
          </p>
        </div>

        {error && <div className="error-banner" style={{ fontSize: '13px', padding: '12px' }}>{error}</div>}
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
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="input-field"
              placeholder="jane@example.com"
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
              New to Mahi Handcraft?{' '}
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
