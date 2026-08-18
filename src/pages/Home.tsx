import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../services/db';
import type { Product } from '../types';
import { useCart } from '../context/CartContext';
import { ArrowRight, Sprout, Heart, ChevronLeft, ChevronRight, Send } from 'lucide-react';

const HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=1200',
    eyebrow: 'CRAFTED BY HAND',
    title: 'Timeless Craft, Made for Modern Living',
    subtitle: 'Discover beautifully handcrafted home accents made with care, character, and ancestral tradition.'
  },
  {
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=1200',
    eyebrow: 'NATURAL FIBERS',
    title: 'Woven with Organic Character',
    subtitle: 'Every tote, clutch, and basket is handwoven from sustainably harvested palm and sweetgrass fibers.'
  },
  {
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=1200',
    eyebrow: 'HERITAGE DECOR',
    title: 'Bring Artisan Warmth into Your Space',
    subtitle: 'Our tapestries and wall hangings bring global textiles and cultural histories into contemporary homes.'
  },
  {
    image: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&q=80&w=1200',
    eyebrow: 'SEASONAL ACCENTS',
    title: 'Handcrafted Traditions Since Decades',
    subtitle: 'Partnering directly with global weaver families to support fair wages and preserve heritage looms.'
  }
];

export const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  // Slideshow States
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideDirection, setSlideDirection] = useState<'in' | 'out'>('in');

  // Newsletter State
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch featured products
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const allProducts = await getProducts();
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

  // 2. Ken Burns Slideshow auto-rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setSlideDirection(prev => prev === 'in' ? 'out' : 'in');
      setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length);
    }, 6000); // 6 seconds slide duration
    return () => clearInterval(interval);
  }, []);

  // 3. Scroll Reveal observer
  useEffect(() => {
    if (loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.scroll-reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loading]);

  const handleNextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSlideDirection(prev => prev === 'in' ? 'out' : 'in');
    setCurrentSlide(prev => (prev + 1) % HERO_SLIDES.length);
  };

  const handlePrevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSlideDirection(prev => prev === 'in' ? 'out' : 'in');
    setCurrentSlide(prev => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const handleSubscribeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter a valid email.');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      setEmail('');
    }, 800);
  };

  return (
    <div style={{ overflow: 'hidden' }}>
      
      {/* ==========================================
      1. HERO SLIDESHOW SECTION
      ========================================== */}
      <section className="hero-slider-container">
        {HERO_SLIDES.map((slide, idx) => (
          <div 
            key={idx}
            className={`hero-slide ${idx === currentSlide ? 'active' : ''} ${idx === currentSlide ? (slideDirection === 'in' ? 'zoom-in' : 'zoom-out') : ''}`}
            style={{ backgroundImage: `url("${slide.image}")` }}
          >
            <div className="hero-gradient-overlay"></div>
            
            <div className="hero-content-wrapper">
              <div className="container">
                <div style={{ maxWidth: '640px' }}>
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: 700, 
                    letterSpacing: '0.25em', 
                    textTransform: 'uppercase', 
                    color: 'var(--brand-primary)',
                    display: 'block',
                    marginBottom: '16px',
                    animation: 'slideInLeft 0.8s ease'
                  }}>
                    {slide.eyebrow}
                  </span>
                  
                  <h1 style={{ 
                    fontFamily: 'var(--font-serif)', 
                    fontSize: '56px', 
                    fontWeight: 400, 
                    lineHeight: '1.15',
                    color: '#FFFFFF', 
                    marginBottom: '20px',
                    animation: 'revealUp 1s ease'
                  }}>
                    {slide.title}
                  </h1>
                  
                  <p style={{ 
                    fontSize: '16px', 
                    color: '#FAF7F2', 
                    marginBottom: '36px', 
                    lineHeight: '1.65',
                    animation: 'revealUp 1.2s ease'
                  }}>
                    {slide.subtitle}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', animation: 'revealUp 1.4s ease' }}>
                    <Link to="/shop" className="btn btn-primary" style={{ padding: '16px 32px' }}>
                      Shop The Collection
                    </Link>
                    <Link to="/our-story" className="btn btn-secondary" style={{ color: '#FFFFFF', borderColor: '#FFFFFF', padding: '16px 32px' }}>
                      Explore Our Story
                    </Link>
                  </div>
                </div>
              </div>
            </div>

          </div>
        ))}

        {/* Slideshow arrows */}
        <button 
          onClick={handlePrevSlide} 
          style={{ 
            position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', 
            background: 'rgba(44, 42, 41, 0.4)', border: 'none', borderRadius: '50%', 
            width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            color: '#FFFFFF', cursor: 'pointer', zIndex: 10, transition: 'var(--transition)'
          }}
          className="header-action-btn"
        >
          <ChevronLeft size={20} />
        </button>

        <button 
          onClick={handleNextSlide} 
          style={{ 
            position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)', 
            background: 'rgba(44, 42, 41, 0.4)', border: 'none', borderRadius: '50%', 
            width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
            color: '#FFFFFF', cursor: 'pointer', zIndex: 10, transition: 'var(--transition)'
          }}
          className="header-action-btn"
        >
          <ChevronRight size={20} />
        </button>

        {/* Numerical fractional slide indicator */}
        <div style={{ 
          position: 'absolute', bottom: '32px', right: '48px', 
          color: '#FFFFFF', zIndex: 10, fontSize: '14px', 
          letterSpacing: '0.1em', fontWeight: 600 
        }}>
          0{currentSlide + 1} <span style={{ color: 'rgba(255,255,255,0.4)' }}>/</span> 0{HERO_SLIDES.length}
        </div>
      </section>

      {/* ==========================================
      2. FEATURED CATEGORIES
      ========================================== */}
      <section className="section scroll-reveal" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block', marginBottom: '8px' }}>
              CURATED ESSENTIALS
            </span>
            <h2 style={{ fontSize: '36px', fontFamily: 'var(--font-serif)' }}>Shop by Category</h2>
          </div>

          <div className="grid-categories">
            <Link to="/shop?category=cat-handbags" className="category-card">
              <img src="https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600" alt="Bags" className="category-card-img" />
              <div className="category-card-overlay">
                <h3 className="category-card-title">Artisan Bags</h3>
                <span className="category-card-action">View Totes & Clutches <ArrowRight size={14} /></span>
              </div>
            </Link>

            <Link to="/shop?category=cat-home" className="category-card">
              <img src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=600" alt="Tapestries" className="category-card-img" />
              <div className="category-card-overlay">
                <h3 className="category-card-title">Wall Tapestries</h3>
                <span className="category-card-action">View Woven Decor <ArrowRight size={14} /></span>
              </div>
            </Link>

            <Link to="/shop?category=cat-traditional" className="category-card">
              <img src="https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&q=80&w=600" alt="Accessories" className="category-card-img" />
              <div className="category-card-overlay">
                <h3 className="category-card-title">Traditional Fans</h3>
                <span className="category-card-action">View Heritage Fans <ArrowRight size={14} /></span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ==========================================
      3. FEATURED PRODUCTS GRID
      ========================================== */}
      <section className="section scroll-reveal" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '56px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block', marginBottom: '8px' }}>
                EXQUISITE COLLECTION
              </span>
              <h2 style={{ fontSize: '36px', margin: 0, fontFamily: 'var(--font-serif)' }}>Seasonal Masterpieces</h2>
            </div>
            <Link to="/shop" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--brand-primary)' }}>
              View Full Collection <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Gathering seasonal masterpieces...</p>
            </div>
          ) : featuredProducts.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 24px', 
              border: '1px dashed var(--border-color)', 
              borderRadius: '4px',
              backgroundColor: '#FFFFFF'
            }}>
              <h3 style={{ marginBottom: '8px' }}>No featured items seeded.</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Log in as Administrator to seed products.</p>
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

      {/* ==========================================
      4. BRAND PHILOSOPHY / WHY CHOOSE US
      ========================================== */}
      <section className="section scroll-reveal" style={{ backgroundColor: '#F6EFE6', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '64px', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block', marginBottom: '8px' }}>
                CRAFT WITH INTENT
              </span>
              <h2 style={{ fontSize: '42px', fontFamily: 'var(--font-serif)', marginBottom: '24px', lineHeight: '1.15' }}>
                Slow Craft, Ethical Sourcing, Natural Fibers.
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '15px' }}>
                We believe home pieces should carry stories and history. We partner directly with loom-weaving families, honoring ancestral crafting patterns using organic fibers to build durable textiles.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <Sprout size={32} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>Organic Fibers</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.5' }}>Sweetgrass and organic palm leaves harvested responsibly.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <Heart size={32} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px' }}>Ethical Direct Trade</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.5' }}>Ensuring artisans dictate their pricing structure directly.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <img 
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800" 
                alt="Loom details" 
                style={{ width: '100%', height: '480px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
      5. LIFESTYLE BANNER SECTION
      ========================================== */}
      <section style={{ 
        height: '50vh', 
        background: 'linear-gradient(rgba(44,42,41,0.35), rgba(44,42,41,0.25)), url("https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=1600") no-repeat center center/cover',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '0 24px'
      }} className="scroll-reveal">
        <div style={{ maxWidth: '600px', color: '#FFFFFF' }}>
          <h2 style={{ fontSize: '40px', fontFamily: 'var(--font-serif)', color: '#FFFFFF', marginBottom: '16px' }}>Crafting Warmth</h2>
          <p style={{ fontSize: '15px', color: '#FAF7F2', marginBottom: '24px', lineHeight: '1.6' }}>
            Bring global histories and warm textures into your contemporary layout with organic basketry and clutches.
          </p>
          <Link to="/shop" className="btn btn-primary">Discover Decor</Link>
        </div>
      </section>

      {/* ==========================================
      6. NEWSLETTER / CIRCLE
      ========================================== */}
      <section className="section scroll-reveal" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container" style={{ maxWidth: '560px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', marginBottom: '12px' }}>Join The Circle</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '28px', lineHeight: '1.65' }}>
            Receive stories about the weavers, exclusive access to batch dispatches, and updates on sustainable living. No spam, only craft.
          </p>

          {success ? (
            <div style={{ backgroundColor: '#D1FAE5', color: '#065F46', padding: '16px 24px', borderRadius: '4px' }}>
              <h4 style={{ marginBottom: '4px' }}>Subscription Successful!</h4>
              <p style={{ fontSize: '13px' }}>Thank you. You have been added to our exclusive mailing circle.</p>
            </div>
          ) : (
            <form onSubmit={handleSubscribeSubmit} style={{ display: 'flex', gap: '8px', width: '100%' }}>
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
