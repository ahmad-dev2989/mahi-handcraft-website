import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Menu, X, Search, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export const StoreLayout: React.FC = () => {
  const { cartItems, settings } = useCart();
  const { profile, logout, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Announcement Bar */}
      <div style={{ 
        backgroundColor: '#C87A53', 
        color: '#FFFFFF', 
        fontSize: '11px', 
        textAlign: 'center', 
        padding: '6px 0', 
        fontWeight: 600, 
        letterSpacing: '0.1em' 
      }}>
        FREE SHIPPING ON ORDERS OVER ${settings.shippingCost * 5}
      </div>

      {/* Header */}
      <header className="header-wrapper">
        <div className="container header-container">
          {/* Logo */}
          <Link to="/" className="logo">
            {settings.storeName.split(' ')[0]}
            <span style={{ color: '#C87A53' }}>{settings.storeName.split(' ').slice(1).join(' ')}</span>
          </Link>

          {/* Desktop Nav */}
          <nav style={{ display: 'flex', alignItems: 'center' }}>
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
                    fontSize: '13px', 
                    fontWeight: 600, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.1em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Settings size={14} /> Admin
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          {/* Header Actions */}
          <div className="header-actions">
            {/* Search Bar Trigger */}
            <div style={{ position: 'relative' }}>
              {searchOpen ? (
                <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-field"
                    style={{ 
                      padding: '6px 12px', 
                      fontSize: '12px', 
                      width: '160px',
                      borderRadius: '4px 0 0 4px',
                      borderRight: 'none'
                    }}
                    autoFocus
                  />
                  <button type="submit" className="btn btn-primary" style={{ 
                    padding: '8px 12px', 
                    borderRadius: '0 4px 4px 0', 
                    border: 'none' 
                  }}>
                    <Search size={14} />
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setSearchOpen(false)} 
                    style={{ background: 'none', border: 'none', marginLeft: '8px', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                </form>
              ) : (
                <button className="header-action-btn" onClick={() => setSearchOpen(true)}>
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
            <button className="hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          top: '112px',
          left: 0,
          width: '100%',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E6DFD5',
          padding: '24px',
          zIndex: 99,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
        }}>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <li>
              <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Home</Link>
            </li>
            <li>
              <Link to="/shop" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Shop</Link>
            </li>
            <li>
              <Link to="/our-story" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Our Story</Link>
            </li>
            <li>
              <Link to="/contact" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact</Link>
            </li>
            {isAdmin && (
              <li>
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#C87A53' }}>Admin Panel</Link>
              </li>
            )}
            {profile ? (
              <>
                <li>
                  <Link to="/account" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>My Profile</Link>
                </li>
                <li>
                  <button 
                    onClick={async () => {
                      setMobileMenuOpen(false);
                      await logout();
                    }} 
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      fontSize: '14px', 
                      fontWeight: 600, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.05em', 
                      color: '#B5655D',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <LogOut size={16} /> Log Out
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#C87A53' }}>Log In / Sign Up</Link>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Main Content */}
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
