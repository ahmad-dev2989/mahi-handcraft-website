import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Menu, X, Search, LogOut, Settings, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export const StoreLayout: React.FC = () => {
  const { cartItems, settings } = useCart();
  const { profile, logout, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  // Handle header sticky class transition on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setSearchOpen(false);
    }
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
      
      {/* Announcement Bar */}
      <div style={{ 
        backgroundColor: '#C87A53', 
        color: '#FFFFFF', 
        fontSize: '11px', 
        textAlign: 'center', 
        padding: '8px 0', 
        fontWeight: 700, 
        letterSpacing: '0.12em',
        position: 'relative',
        zIndex: 101
      }}>
        FREE SHIPPING ON ORDERS OVER ${settings.shippingCost * 5}
      </div>

      {/* Sticky Header */}
      <header className={`header-wrapper ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container header-container">
          {/* Logo */}
          <Link to="/" className="logo">
            {settings.storeName.split(' ')[0]}
            <span style={{ color: '#C87A53' }}>{settings.storeName.split(' ').slice(1).join(' ')}</span>
          </Link>

          {/* Desktop Nav */}
          <nav style={{ display: 'flex', alignItems: 'center' }} className="desktop-only-nav">
            <ul className="nav-links">
              <li>
                <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Home</NavLink>
              </li>
              <li>
                <NavLink to="/shop" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Shop</NavLink>
              </li>
              <li>
                <NavLink to="/our-story" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Our Story</NavLink>
              </li>
              <li>
                <NavLink to="/contact" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Contact</NavLink>
              </li>
              {isAdmin && (
                <li>
                  <Link to="/admin" style={{ 
                    color: '#C87A53', 
                    fontSize: '12px', 
                    fontWeight: 700, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.12em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Settings size={14} /> Admin Portal
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          {/* Header Actions */}
          <div className="header-actions">
            {/* Search Toggle */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              {searchOpen ? (
                <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field"
                    style={{ 
                      padding: '8px 16px', 
                      fontSize: '13px', 
                      width: '200px',
                      borderRadius: '4px 0 0 4px',
                      borderRight: 'none',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    autoFocus
                  />
                  <button type="submit" className="btn btn-primary btn-sm" style={{ 
                    padding: '10px 16px', 
                    borderRadius: '0 4px 4px 0', 
                    border: 'none' 
                  }}>
                    <Search size={14} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setSearchOpen(false)} 
                    style={{ background: 'none', border: 'none', marginLeft: '12px', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <X size={18} />
                  </button>
                </form>
              ) : (
                <button className="header-action-btn" onClick={() => setSearchOpen(true)} title="Search Products">
                  <Search size={20} />
                </button>
              )}
            </div>

            {/* Account Link */}
            <Link to={profile ? "/account" : "/login"} className="header-action-btn" title="My Account">
              <User size={20} />
            </Link>

            {/* Cart Link */}
            <Link to="/cart" className="header-action-btn" title="Shopping Cart">
              <ShoppingBag size={20} />
              {totalCartCount > 0 && <span className="cart-count">{totalCartCount}</span>}
            </Link>

            {/* Hamburger on Mobile */}
            <button 
              className="hamburger" 
              onClick={() => setMobileMenuOpen(true)}
              style={{ display: 'flex' }}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Premium Mobile Slide-Out Drawer Overlay */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          backgroundColor: 'rgba(44, 42, 41, 0.4)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'flex-end',
          transition: 'all 0.3s ease'
        }} onClick={() => setMobileMenuOpen(false)}>
          
          {/* Drawer content */}
          <div style={{
            width: '85%',
            maxWidth: '360px',
            height: '100%',
            backgroundColor: '#FFFFFF',
            boxShadow: 'var(--shadow-lg)',
            padding: '32px 24px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Header row in drawer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Menu
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)' }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Navigation links in drawer */}
            <nav style={{ flexGrow: 1 }}>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <li>
                  <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)', fontSize: '15px', fontWeight: 500 }}>
                    <span>Home</span>
                    <ChevronRight size={16} color="var(--brand-primary)" />
                  </Link>
                </li>
                <li>
                  <Link to="/shop" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)', fontSize: '15px', fontWeight: 500 }}>
                    <span>Shop Collection</span>
                    <ChevronRight size={16} color="var(--brand-primary)" />
                  </Link>
                </li>
                <li>
                  <Link to="/our-story" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)', fontSize: '15px', fontWeight: 500 }}>
                    <span>Our Philosophy</span>
                    <ChevronRight size={16} color="var(--brand-primary)" />
                  </Link>
                </li>
                <li>
                  <Link to="/contact" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)', fontSize: '15px', fontWeight: 500 }}>
                    <span>Contact Us</span>
                    <ChevronRight size={16} color="var(--brand-primary)" />
                  </Link>
                </li>
                {isAdmin && (
                  <li>
                    <Link to="/admin" onClick={() => setMobileMenuOpen(false)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)', fontSize: '15px', fontWeight: 600, color: '#C87A53' }}>
                      <span>Admin Control Panel</span>
                      <ChevronRight size={16} color="var(--brand-primary)" />
                    </Link>
                  </li>
                )}
              </ul>
            </nav>

            {/* Profile / auth links at footer of drawer */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
              {profile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Logged in as <strong>{profile.name}</strong>
                  </div>
                  <Link to="/account" onClick={() => setMobileMenuOpen(false)} className="btn btn-outline-brand btn-sm" style={{ width: '100%' }}>
                    My Account
                  </Link>
                  <button 
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      await logout();
                    }} 
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', color: 'var(--error)', borderColor: 'var(--error)' }}
                  >
                    <LogOut size={14} /> Log Out
                  </button>
                </div>
              ) : (
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary" style={{ width: '100%', fontSize: '12px', padding: '12px' }}>
                  Log In / Register
                </Link>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main style={{ flexGrow: 1 }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="footer-wrapper">
        <div className="container">
          <div className="footer-grid">
            <div>
              <div className="footer-logo">
                {settings.storeName}
              </div>
              <p className="footer-text">
                Crafting modern traditions. We provide sustainable, high-quality, ethically-sourced handmade products designed to bring warmth and character into your home.
              </p>
              {settings.storePhone && (
                <p style={{ color: '#A39E9B', fontSize: '14px', marginBottom: '8px' }}>
                  <strong>Phone:</strong> {settings.storePhone}
                </p>
              )}
              {settings.storeEmail && (
                <p style={{ color: '#A39E9B', fontSize: '14px' }}>
                  <strong>Email:</strong> {settings.storeEmail}
                </p>
              )}
            </div>

            <div>
              <h4 className="footer-heading">Shop</h4>
              <ul className="footer-links">
                <li><Link to="/shop" className="footer-link">All Products</Link></li>
                <li><Link to="/shop?filter=featured" className="footer-link">Featured Items</Link></li>
                <li><Link to="/shop?filter=bestseller" className="footer-link">Best Sellers</Link></li>
                <li><Link to="/shop?filter=new" className="footer-link">New Arrivals</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="footer-heading">Support</h4>
              <ul className="footer-links">
                <li><Link to="/shipping" className="footer-link">Shipping Policy</Link></li>
                <li><Link to="/returns" className="footer-link">Returns & Refunds</Link></li>
                <li><Link to="/contact" className="footer-link">Contact Support</Link></li>
                <li><Link to="/our-story" className="footer-link">Our Philosophy</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="footer-heading">Legal</h4>
              <ul className="footer-links">
                <li><Link to="/privacy-policy" className="footer-link">Privacy Policy</Link></li>
                <li><Link to="/terms" className="footer-link">Terms & Conditions</Link></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} {settings.storeName}. All rights reserved.</p>
            <div style={{ display: 'flex', gap: '16px' }}>
              {settings.socialLinks.instagram && <a href={settings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" style={{ color: '#837E7C' }}>Instagram</a>}
              {settings.socialLinks.facebook && <a href={settings.socialLinks.facebook} target="_blank" rel="noopener noreferrer" style={{ color: '#837E7C' }}>Facebook</a>}
              {settings.socialLinks.pinterest && <a href={settings.socialLinks.pinterest} target="_blank" rel="noopener noreferrer" style={{ color: '#837E7C' }}>Pinterest</a>}
              {settings.socialLinks.twitter && <a href={settings.socialLinks.twitter} target="_blank" rel="noopener noreferrer" style={{ color: '#837E7C' }}>Twitter</a>}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
