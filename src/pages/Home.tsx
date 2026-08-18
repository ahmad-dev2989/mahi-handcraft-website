import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../services/db';
import type { Product } from '../types';
import { useCart } from '../context/CartContext';
import { ArrowRight, Sparkles, Sprout, Heart, Send } from 'lucide-react';

export const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  // Newsletter Form State
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const allProducts = await getProducts();
        // Filter featured in memory (to avoid index requirement issues on fresh setup)
        const featured = allProducts.filter(p => p.featured === true).slice(0, 4);
        setFeaturedProducts(featured);
      } catch (err) {
        console.error('Failed to load featured products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Please provide a valid email.');
      return;
    }

    setSubmitting(true);
    // Simulate API registration
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      setEmail('');
    }, 800);
  };

  return (
    <div>
      {/* 1. HERO SECTION */}
      <section style={{
        position: 'relative',
        background: 'linear-gradient(to right, rgba(44,42,41,0.5), rgba(44,42,41,0.2)), url("https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=1600") no-repeat center center/cover',
        height: '80vh',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px'
      }}>
        <div className="container" style={{ maxWidth: '640px', marginLeft: '0' }}>
          <p style={{ 
            fontSize: '12px', 
            fontWeight: 600, 
            letterSpacing: '0.2em', 
            textTransform: 'uppercase', 
            color: 'var(--brand-primary)',
            marginBottom: '16px' 
          }}>
            PRESERVED IN TRADITION
          </p>
          <h1 style={{ 
            fontFamily: 'var(--font-serif)', 
            fontSize: '56px', 
            fontWeight: 400, 
            lineHeight: '1.15',
            color: '#FFFFFF', 
            marginBottom: '20px' 
          }}>
            Preserving Craft, One Weave at a Time.
          </h1>
          <p style={{ fontSize: '16px', color: '#E6DFD5', marginBottom: '32px', lineHeight: '1.6' }}>
            Discover handcrafted clothing, totes, basketry, and home accents created by independent artisan families using sustainable techniques.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link to="/shop" className="btn btn-primary">
              Shop The Collection
            </Link>
            <Link to="/our-story" className="btn btn-secondary" style={{ color: '#FFFFFF', borderColor: '#FFFFFF' }}>
              Our Philosophy
            </Link>
          </div>
        </div>
      </section>

      {/* 2. PHILOSOPHY STATS SECTION */}
      <section className="section" style={{ backgroundColor: '#F6EFE6', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }}>
          <div>
            <img 
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800" 
              alt="Artisan loom" 
              style={{ width: '100%', height: '480px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }}
            />
          </div>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--brand-primary)', marginBottom: '8px' }}>
              NATURAL LUXURY
            </p>
            <h2 style={{ fontSize: '36px', marginBottom: '20px' }}>Modern Traditions</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
              Every product is slowly made by hand, taking anywhere from a few hours to several weeks. By combining ancestral weaving patterns with contemporary colors, we craft pieces that are physically durable and visually timeless.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Sprout style={{ color: 'var(--brand-primary)', flexShrink: 0 }} size={24} />
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>100% Natural Fibers</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Locally harvested palm, wool, linen, and dyes.</p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <Heart style={{ color: 'var(--brand-primary)', flexShrink: 0 }} size={24} />
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Ethical Sourcing</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Direct trade wages supporting multi-generation families.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURED PRODUCTS SECTION */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '40px' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--brand-primary)', marginBottom: '6px' }}>
                EXQUISITE DESIGN
              </p>
              <h2 style={{ fontSize: '32px', margin: 0 }}>Seasonal Masterpieces</h2>
            </div>
            <Link to="/shop" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--brand-primary)' }}>
              View Catalog <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading pieces...</p>
            </div>
          ) : featuredProducts.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 24px', 
              border: '1px dashed var(--border-color)', 
              borderRadius: '4px',
              backgroundColor: '#FFFFFF'
            }}>
              <Sparkles size={36} color="var(--brand-primary)" style={{ marginBottom: '12px' }} />
              <h3 style={{ marginBottom: '8px' }}>Store Seed Data Required</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
                Log in as an Administrator and trigger the "Seed Demo Products" tool in the dashboard to populate this section.
              </p>
              <Link to="/shop" className="btn btn-secondary btn-sm">Explore Shop</Link>
            </div>
          ) : (
            <div className="grid-products">
              {featuredProducts.map((product) => {
                const hasDiscount = product.salePrice !== null;
                const original = product.originalPrice;
                const sale = product.salePrice;
                const discountPercent = hasDiscount ? Math.round(((original - (sale || 0)) / original) * 100) : 0;

                return (
                  <div key={product.id} className="product-card">
                    <Link to={`/products/${product.slug}`} className="product-image-container">
                      {hasDiscount && <span className="badge-tag badge-sale">{discountPercent}% OFF</span>}
                      {product.stockQuantity === 0 && <span className="badge-tag badge-out-of-stock">Out of Stock</span>}
                      <img src={product.mainImage} alt={product.name} className="product-card-img" />
                    </Link>
                    
                    <div className="product-card-info">
                      <div className="product-card-category">{product.categoryName}</div>
                      <h3 className="product-card-title">
                        <Link to={`/products/${product.slug}`}>{product.name}</Link>
                      </h3>
                      
                      <div className="product-card-price-row">
                        {hasDiscount ? (
                          <>
                            <span className="price-current">${sale?.toFixed(2)}</span>
                            <span className="price-original">${original.toFixed(2)}</span>
                          </>
                        ) : (
                          <span className="price-current">${original.toFixed(2)}</span>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => addToCart(product, 1)}
                        disabled={product.stockQuantity <= 0}
                        className="btn btn-outline-brand btn-sm"
                        style={{ marginTop: '16px', width: '100%' }}
                      >
                        {product.stockQuantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 4. NEWSLETTER SUBSCRIPTION SECTION */}
      <section className="section" style={{ backgroundColor: '#FAF7F2', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container" style={{ maxWidth: '560px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', marginBottom: '12px' }}>Join The Circle</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '28px', lineHeight: '1.6' }}>
            Receive stories about the weavers, exclusive access to batch dispatches, and updates on sustainable living. No spam, only craft.
          </p>

          {success ? (
            <div style={{ backgroundColor: '#D1FAE5', color: '#065F46', padding: '16px 24px', borderRadius: '4px' }}>
              <h4 style={{ marginBottom: '4px' }}>Subscription Successful!</h4>
              <p style={{ fontSize: '13px' }}>Thank you. You have been added to our exclusive mailing circle.</p>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <div style={{ flexGrow: 1, position: 'relative' }}>
                <input 
                  type="email" 
                  className="input-field" 
                  placeholder="Enter your email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={submitting}
                  style={{ width: '100%' }}
                />
                {error && <span style={{ color: 'var(--error)', fontSize: '11px', position: 'absolute', bottom: '-20px', left: '4px' }}>{error}</span>}
              </div>
              <button type="submit" disabled={submitting} className="btn btn-primary" style={{ padding: '12px 20px', flexShrink: 0 }}>
                {submitting ? 'Subscribing...' : <><Send size={14} /> Subscribe</>}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};
