import React, { useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Receipt, 
  Users, 
  Settings as SettingsIcon, 
  LogOut, 
  Home, 
  ShieldAlert 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AdminLayout: React.FC = () => {
  const { profile, loading, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If auth state resolved and user is not an Admin, redirect
    if (!loading && !isAdmin) {
      navigate('/login');
    }
  }, [loading, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '18px' }}>Verifying authorization...</p>
      </div>
    );
  }

  // Fallback in case of navigation delay
  if (!profile || !isAdmin) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh', padding: '40px', textAlign: 'center' }}>
        <ShieldAlert size={48} color="var(--error)" style={{ marginBottom: '16px' }} />
        <h2 style={{ marginBottom: '8px' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>You do not have administrative permissions to view this area.</p>
        <Link to="/" className="btn btn-primary">Return to Storefront</Link>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Admin Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <Link to="/admin" style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ 
              fontFamily: 'var(--font-serif)', 
              fontSize: '20px', 
              fontWeight: 600, 
              letterSpacing: '0.05em', 
              color: '#FFFFFF' 
            }}>
              MAHI <span style={{ color: 'var(--brand-primary)' }}>PORTAL</span>
            </span>
            <span style={{ fontSize: '10px', color: 'var(--brand-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Management Console
            </span>
          </Link>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <ul className="admin-nav-links">
            <li>
              <NavLink to="/admin" end className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/products" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
                <ShoppingBag size={18} />
                <span>Products</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/orders" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
                <Receipt size={18} />
                <span>Orders</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/customers" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
                <Users size={18} />
                <span>Customers</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/admin/settings" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
                <SettingsIcon size={18} />
                <span>Settings</span>
              </NavLink>
            </li>
          </ul>

          {/* Sidebar Footer Operations */}
          <div style={{ padding: '16px', borderTop: '1px solid #3E3B3A' }}>
            <Link to="/" className="admin-nav-link" style={{ padding: '8px 12px', marginBottom: '8px' }}>
              <Home size={16} />
              <span>Back to Store</span>
            </Link>
            <button 
              onClick={async () => {
                await logout();
                navigate('/');
              }}
              className="admin-nav-link" 
              style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                width: '100%', 
                textAlign: 'left',
                padding: '8px 12px',
                color: 'var(--error)'
              }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="admin-content">
        {/* Simple top info bar */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '32px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '16px' 
        }}>
          <div>
            <h2 style={{ fontSize: '24px', marginBottom: '4px' }}>Control Panel</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Welcome back, {profile.name} (Administrator)</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: 600, 
              backgroundColor: 'var(--brand-primary)', 
              color: '#FFFFFF',
              padding: '4px 10px',
              borderRadius: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Active Session
            </span>
          </div>
        </div>

        {/* Dynamic Nested Routes */}
        <Outlet />
      </main>
    </div>
  );
};
