import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/db';
import type { ShippingAddress } from '../types';
import { ShieldCheck, Truck, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';

export const Checkout: React.FC = () => {
  const { profile, loading: authLoading, updateProfileData } = useAuth();
  const { cartItems, subtotal, shipping, tax, total, clearCart, settings } = useCart();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !profile) {
      navigate('/login?redirect=checkout');
    }
  }, [profile, authLoading, navigate]);

  // Shipping Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('United States');
  const [saveAddress, setSaveAddress] = useState(true);

  // Pre-fill form from user profile if it exists
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
      if (profile.shippingAddress) {
        setAddressLine(profile.shippingAddress.addressLine || '');
        setCity(profile.shippingAddress.city || '');
        setState(profile.shippingAddress.state || '');
        setPostalCode(profile.shippingAddress.postalCode || '');
        setCountry(profile.shippingAddress.country || 'United States');
      }
    }
  }, [profile]);

  // UI States
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  if (authLoading) {
    return (
      <div className="loading-container" style={{ minHeight: '50vh' }}>
        <div className="spinner"></div>
        <p>Loading checkout security...</p>
      </div>
    );
  }

  if (cartItems.length === 0 && !placedOrderId) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <AlertCircle size={48} color="var(--error)" style={{ marginBottom: '20px' }} />
        <h2>Your Cart is Empty</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Please add products to your cart before proceeding to checkout.</p>
        <Link to="/shop" className="btn btn-primary">Return to Shop</Link>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setErrorMsg('');

    // Form validation
    if (!name || !email || !phone || !addressLine || !city || !state || !postalCode || !country) {
      setErrorMsg('Please complete all required shipping fields.');
      return;
    }

    setSubmitting(true);

    try {
      const shippingAddress: ShippingAddress = {
        name,
        addressLine,
        city,
        state,
        postalCode,
        country
      };

      // 1. If save address checked, update user's profile in Firestore
      if (saveAddress) {
        await updateProfileData({
          phone,
          shippingAddress
        });
      }

      // 2. Call authoritative Firestore Order Transaction service
      const checkoutItems = cartItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }));

      const newOrderId = await createOrder(
        profile.uid,
        { name, email, phone },
        shippingAddress,
        checkoutItems
      );

      // 3. Clear cart in Context / localStorage
      clearCart();
      setPlacedOrderId(newOrderId);
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMsg(err.message || 'An error occurred while creating your order. Please check item stock levels.');
    } finally {
      setSubmitting(false);
    }
  };

  // Order placed confirmation view
  if (placedOrderId) {
    return (
      <div className="container" style={{ padding: '80px 24px', maxWidth: '600px', textAlign: 'center' }}>
        <div style={{ 
          backgroundColor: '#FFFFFF', 
          border: '1px solid var(--border-color)', 
          borderRadius: '4px',
          padding: '48px 32px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <CheckCircle2 size={64} color="var(--success)" style={{ margin: '0 auto 20px auto' }} />
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', marginBottom: '8px' }}>Order Confirmed</h2>
          <p style={{ color: 'var(--brand-primary)', fontWeight: 600, fontSize: '15px', marginBottom: '24px' }}>
            Order Reference: #{placedOrderId}
          </p>
          
          <div style={{ 
            backgroundColor: 'var(--brand-light)', 
            padding: '20px', 
            borderRadius: '4px', 
            textAlign: 'left',
            marginBottom: '32px',
            fontSize: '14px' 
          }}>
            <p style={{ marginBottom: '8px' }}><strong>Payment Method:</strong> Cash on Delivery (COD)</p>
            <p style={{ color: 'var(--text-muted)' }}>
              Thank you for supporting global artisans! Your order is currently pending verification. Payment will be collected in cash upon delivery of your package.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <Link to="/account" className="btn btn-primary" style={{ flexGrow: 1 }}>Track Order</Link>
            <Link to="/shop" className="btn btn-secondary" style={{ flexGrow: 1 }}>Continue Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '60px 0' }}>
      <div className="container">
        
        {/* Breadcrumb path */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '32px' }}>
          <Link to="/cart">Cart</Link>
          <ChevronRight size={12} />
          <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Checkout</span>
        </div>

        <h1 style={{ fontSize: '36px', marginBottom: '40px', fontFamily: 'var(--font-serif)' }}>Secure Checkout</h1>

        {errorMsg && <div className="error-banner">{errorMsg}</div>}

        <div className="checkout-layout-grid">
          
          {/* A. Shipping Address Form */}
          <form onSubmit={handlePlaceOrder} style={{ backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '4px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '24px' }}>Shipping Address</h3>
            
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Jane Doe"
                required
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="checkout-form-row">
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input 
                  type="email" 
                  className="input-field" 
                  placeholder="jane@example.com"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input 
                  type="tel" 
                  className="input-field" 
                  placeholder="+1 (555) 000-0000"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Street Address *</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="123 Artisan Rd"
                required
                value={addressLine}
                onChange={e => setAddressLine(e.target.value)}
              />
            </div>

            <div className="checkout-form-row">
              <div className="form-group">
                <label className="form-label">City *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Portland"
                  required
                  value={city}
                  onChange={e => setCity(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">State / Province *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="OR"
                  required
                  value={state}
                  onChange={e => setState(e.target.value)}
                />
              </div>
            </div>

            <div className="checkout-form-row">
              <div className="form-group">
                <label className="form-label">Postal / Zip Code *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="97201"
                  required
                  value={postalCode}
                  onChange={e => setPostalCode(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Country *</label>
                <select 
                  className="input-field" 
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                >
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Australia">Australia</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '12px' }}>
              <label className="form-checkbox">
                <input 
                  type="checkbox" 
                  checked={saveAddress} 
                  onChange={e => setSaveAddress(e.target.checked)} 
                />
                <span>Save this address to my profile</span>
              </label>
            </div>

            {/* Cash on Delivery Payment Details */}
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginTop: '40px', marginBottom: '24px' }}>Payment Method</h3>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '16px', 
              border: '2px solid var(--brand-primary)', 
              borderRadius: '4px',
              backgroundColor: 'var(--brand-light)',
              marginBottom: '32px'
            }}>
              <Truck size={20} color="var(--brand-primary)" />
              <div style={{ flexGrow: 1 }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600 }}>Cash on Delivery (COD)</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Pay in cash upon delivery of your products.</p>
              </div>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '4px solid var(--brand-primary)', backgroundColor: '#FFFFFF' }}></div>
            </div>

            <button type="submit" disabled={submitting} className="btn btn-primary" style={{ width: '100%', padding: '16px' }}>
              {submitting ? 'Verifying inventory...' : `Place COD Order — $${total.toFixed(2)}`}
            </button>
          </form>

          {/* B. Order Summary Review */}
          <div>
            <div style={{ backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '4px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '24px' }}>Review Items</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px', maxHeight: '320px', overflowY: 'auto' }}>
                {cartItems.map(item => {
                  const product = item.product;
                  const price = product.salePrice !== null ? product.salePrice : product.originalPrice;
                  return (
                    <div key={item.productId} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ width: '60px', height: '60px', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '2px', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <img src={product.mainImage} alt={product.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      </div>
                      <div style={{ flexGrow: 1, fontSize: '13px' }}>
                        <h4 style={{ fontWeight: 500, fontFamily: 'var(--font-serif)', lineHeight: '1.2' }}>{product.name}</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Qty: {item.quantity} × ${price.toFixed(2)}</p>
                      </div>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>${(price * item.quantity).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Totals Breakdown */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Shipping Cost</span>
                  <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Tax ({settings.taxRate}%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 600 }}>
                  <span>Total Amount</span>
                  <span style={{ color: 'var(--brand-primary)' }}>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '24px', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
              <ShieldCheck size={20} color="var(--success)" />
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                This is a secure connection. The inventory for your items is dynamically allocated during transaction verification to prevent overselling.
              </p>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        .checkout-layout-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 64px;
          align-items: start;
        }
        .checkout-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 768px) {
          .checkout-layout-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
        @media (max-width: 480px) {
          .checkout-form-row {
            grid-template-columns: 1fr !important;
            gap: 0 !important;
          }
        }
      `}</style>

    </div>
  );
};
