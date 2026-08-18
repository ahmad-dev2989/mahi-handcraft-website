import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';

export const Cart: React.FC = () => {
  const { cartItems, subtotal, shipping, tax, total, updateQuantity, removeFromCart, settings } = useCart();
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleCheckoutRedirect = () => {
    if (!profile) {
      // Redirect to login, but tag it to return to checkout
      navigate('/login?redirect=checkout');
    } else {
      navigate('/checkout');
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <ShoppingBag size={48} color="var(--brand-primary)" style={{ marginBottom: '20px', strokeWidth: 1.5 }} />
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', marginBottom: '12px' }}>Your Cart is Empty</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px', maxWidth: '480px', margin: '0 auto 32px auto' }}>
          Explore our collection of handwoven baskets, clutches, and home masterpieces to add sustainable warmth to your space.
        </p>
        <Link to="/shop" className="btn btn-primary">Return to Shop</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '60px 0' }}>
      <div className="container">
        <h1 style={{ fontSize: '36px', marginBottom: '40px', fontFamily: 'var(--font-serif)' }}>Shopping Cart</h1>
        
        <div className="cart-layout-grid">
          {/* Cart Items List */}
          <div>
            <div style={{ borderTop: '1px solid var(--border-color)' }}>
              {cartItems.map((item) => {
                const product = item.product;
                const hasDiscount = product.salePrice !== null;
                const price = hasDiscount ? product.salePrice : product.originalPrice;
                const totalItemPrice = (price || 0) * item.quantity;

                return (
                  <div 
                    key={item.productId} 
                    className="cart-item-row"
                  >
                    {/* Image */}
                    <Link to={`/products/${product.slug}`} className="cart-item-image" style={{ width: '100px', height: '100px', flexShrink: 0, border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={product.mainImage} alt={product.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </Link>

                    {/* Meta info */}
                    <div className="cart-item-meta" style={{ flexGrow: 1 }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                        {product.categoryName}
                      </span>
                      <h3 style={{ fontSize: '18px', fontFamily: 'var(--font-serif)', margin: '4px 0' }}>
                        <Link to={`/products/${product.slug}`}>{product.name}</Link>
                      </h3>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px' }}>
                        <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>${price?.toFixed(2)}</span>
                        {hasDiscount && (
                          <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '12px' }}>
                            ${product.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Selector */}
                    <div className="cart-item-qty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: '#FFFFFF' }}>
                        <button 
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          style={{ padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                        >
                          -
                        </button>
                        <span style={{ width: '30px', textAlign: 'center', fontSize: '13px', fontWeight: 600 }}>{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          style={{ padding: '6px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                        >
                          +
                        </button>
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Max: {product.stockQuantity}</span>
                    </div>

                    {/* Subtotal & Delete */}
                    <div className="cart-item-price-block" style={{ textAlign: 'right', minWidth: '120px' }}>
                      <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--text-main)', marginBottom: '8px' }}>
                        ${totalItemPrice.toFixed(2)}
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.productId)}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          color: 'var(--text-muted)', 
                          cursor: 'pointer', 
                          fontSize: '13px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px' 
                        }}
                        title="Remove item"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
            
            <div style={{ marginTop: '24px' }}>
              <Link to="/shop" className="btn btn-secondary btn-sm">← Continue Shopping</Link>
            </div>
          </div>

          {/* Checkout Totals Card */}
          <div style={{ 
            backgroundColor: '#FFFFFF', 
            border: '1px solid var(--border-color)', 
            borderRadius: '4px', 
            padding: '32px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>Order Summary</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                <span style={{ fontWeight: 600 }}>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Estimated Delivery</span>
                <span style={{ fontWeight: 600 }}>
                  {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Estimated Tax ({settings.taxRate}%)</span>
                <span style={{ fontWeight: 600 }}>${tax.toFixed(2)}</span>
              </div>
              
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 600 }}>
                <span>Total Amount</span>
                <span style={{ color: 'var(--brand-primary)' }}>${total.toFixed(2)}</span>
              </div>
            </div>

            <button onClick={handleCheckoutRedirect} className="btn btn-primary" style={{ width: '100%', padding: '14px', marginBottom: '16px' }}>
              Proceed to Checkout <ArrowRight size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
              <ShieldCheck size={14} color="var(--success)" />
              <span>Login required to place secure orders.</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .cart-layout-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 48px;
          align-items: start;
        }
        .cart-item-row {
          display: flex;
          gap: 24px;
          padding: 24px 0;
          border-bottom: 1px solid var(--border-color);
          align-items: center;
        }
        @media (max-width: 768px) {
          .cart-layout-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .cart-item-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
            padding: 20px 0 !important;
          }
          .cart-item-image {
            width: 80px !important;
            height: 80px !important;
          }
          .cart-item-meta {
            width: 100% !important;
          }
          .cart-item-qty {
            flex-direction: row !important;
            width: 100% !important;
            justify-content: space-between !important;
            border-top: 1px dashed var(--border-color);
            padding-top: 12px;
          }
          .cart-item-price-block {
            width: 100% !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            text-align: left !important;
            border-top: 1px dashed var(--border-color);
            padding-top: 12px;
          }
        }
      `}</style>

    </div>
  );
};
