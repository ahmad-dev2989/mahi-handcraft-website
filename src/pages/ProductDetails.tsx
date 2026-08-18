import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductBySlug, getProducts } from '../services/db';
import type { Product } from '../types';
import { useCart } from '../context/CartContext';
import { ShoppingBag, ChevronRight, Truck, RefreshCw, ShieldAlert } from 'lucide-react';

export const ProductDetails: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Accordion tab states
  const [openTabs, setOpenTabs] = useState({
    details: true,
    care: false,
    shipping: false
  });

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const prod = await getProductBySlug(slug);
        setProduct(prod);
        if (prod) {
          setSelectedImage(prod.mainImage);
          setQuantity(1);

          // Fetch related products (same category, exclude current)
          const allProducts = await getProducts();
          const related = allProducts
            .filter((p) => p.categoryId === prod.categoryId && p.id !== prod.id)
            .slice(0, 4);
          setRelatedProducts(related);
        }
      } catch (err) {
        console.error('Failed to load product details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [slug]);

  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '50vh' }}>
        <div className="spinner"></div>
        <p>Gathering artisan details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <ShieldAlert size={48} color="var(--error)" style={{ marginBottom: '16px' }} />
        <h2>Product Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>The item you are looking for does not exist or has been removed.</p>
        <Link to="/shop" className="btn btn-primary">Return to Shop</Link>
      </div>
    );
  }

  const hasDiscount = product.salePrice !== null;
  const original = product.originalPrice;
  const sale = product.salePrice;
  const discountPercent = hasDiscount ? Math.round(((original - (sale || 0)) / original) * 100) : 0;

  const handleQuantityChange = (val: number) => {
    let newQty = quantity + val;
    if (newQty < 1) newQty = 1;
    if (newQty > product.stockQuantity) newQty = product.stockQuantity;
    setQuantity(newQty);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    navigate('/checkout');
  };

  const toggleTab = (tab: 'details' | 'care' | 'shipping') => {
    setOpenTabs(prev => ({
      ...prev,
      [tab]: !prev[tab]
    }));
  };

  return (
    <div style={{ padding: '40px 0 80px 0' }}>
      <div className="container">
        
        {/* Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '32px' }}>
          <Link to="/">Home</Link>
          <ChevronRight size={12} />
          <Link to="/shop">Shop</Link>
          <ChevronRight size={12} />
          <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{product.name}</span>
        </div>

        {/* Product Details Layout */}
        <div className="product-details-grid">
          
          {/* Gallery Side */}
          <div>
            <div className="details-gallery-container" style={{ 
              backgroundColor: '#FFFFFF', 
              border: '1px solid var(--border-color)', 
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '16px',
              padding: '16px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <img 
                src={selectedImage} 
                alt={product.name} 
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </div>
            
            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto' }}>
                {product.images.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    style={{ 
                      flexShrink: 0,
                      width: '80px',
                      height: '80px',
                      border: selectedImage === img ? '2px solid var(--brand-primary)' : '1px solid var(--border-color)',
                      borderRadius: '4px',
                      backgroundColor: '#FFFFFF',
                      padding: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    <img src={img} alt="Thumbnail" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Configuration & Meta Side */}
          <div>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: 600, 
              color: 'var(--brand-primary)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.1em',
              display: 'block',
              marginBottom: '8px'
            }}>
              {product.categoryName}
            </span>
            <h1 className="details-title" style={{ marginBottom: '16px', lineHeight: '1.15' }}>{product.name}</h1>
            
            {/* Price display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              {hasDiscount ? (
                <>
                  <span style={{ fontSize: '28px', fontWeight: 600, color: 'var(--brand-primary)' }}>${sale?.toFixed(2)}</span>
                  <span style={{ fontSize: '20px', textDecoration: 'line-through', color: 'var(--text-muted)' }}>${original.toFixed(2)}</span>
                  <span style={{ 
                    backgroundColor: 'var(--error)', 
                    color: '#FFFFFF', 
                    fontSize: '11px', 
                    fontWeight: 600, 
                    padding: '4px 8px', 
                    borderRadius: '2px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em' 
                  }}>
                    {discountPercent}% OFF
                  </span>
                </>
              ) : (
                <span style={{ fontSize: '28px', fontWeight: 600, color: 'var(--text-main)' }}>${original.toFixed(2)}</span>
              )}
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '32px', lineHeight: '1.6' }}>
              {product.shortDescription}
            </p>

            {/* Inventory Status & Actions */}
            <div style={{ 
              borderTop: '1px solid var(--border-color)', 
              borderBottom: '1px solid var(--border-color)', 
              padding: '24px 0', 
              marginBottom: '32px' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Stock Availability</span>
                {product.stockQuantity > 0 ? (
                  <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '14px' }}>
                    In Stock ({product.stockQuantity} items remaining)
                  </span>
                ) : (
                  <span style={{ color: 'var(--error)', fontWeight: 600, fontSize: '14px' }}>
                    Out of Stock
                  </span>
                )}
              </div>

              {product.stockQuantity > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Quantity</span>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                    <button 
                      onClick={() => handleQuantityChange(-1)} 
                      style={{ padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
                    >
                      -
                    </button>
                    <span style={{ width: '40px', textAlign: 'center', fontWeight: 600, fontSize: '14px' }}>{quantity}</span>
                    <button 
                      onClick={() => handleQuantityChange(1)} 
                      style={{ padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              <div className="details-buttons-row">
                <button 
                  onClick={() => addToCart(product, quantity)}
                  disabled={product.stockQuantity <= 0}
                  className="btn btn-primary"
                  style={{ flexGrow: 1, padding: '16px' }}
                >
                  <ShoppingBag size={18} /> Add to Cart
                </button>
                <button 
                  onClick={handleBuyNow}
                  disabled={product.stockQuantity <= 0}
                  className="btn btn-secondary"
                  style={{ flexGrow: 1, padding: '16px' }}
                >
                  Buy It Now
                </button>
              </div>
            </div>

            {/* Collapsible Tabs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Tab 1: Product Description */}
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <button 
                  onClick={() => toggleTab('details')}
                  style={{ 
                    width: '100%', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    background: 'none', 
                    border: 'none', 
                    fontWeight: 600, 
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '8px 0',
                    cursor: 'pointer' 
                  }}
                >
                  <span>Product Details</span>
                  <span>{openTabs.details ? '−' : '+'}</span>
                </button>
                {openTabs.details && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', marginTop: '8px' }}>
                    {product.description}
                  </p>
                )}
              </div>

              {/* Tab 2: Care Instructions */}
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <button 
                  onClick={() => toggleTab('care')}
                  style={{ 
                    width: '100%', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    background: 'none', 
                    border: 'none', 
                    fontWeight: 600, 
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '8px 0',
                    cursor: 'pointer' 
                  }}
                >
                  <span>Care Instructions</span>
                  <span>{openTabs.care ? '−' : '+'}</span>
                </button>
                {openTabs.care && (
                  <ul style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', marginTop: '8px', paddingLeft: '20px' }}>
                    <li>Avoid direct exposure to heavy water or moisture.</li>
                    <li>Wipe gently with a clean, dry cotton cloth to remove dust.</li>
                    <li>Store in a cool, dry place away from direct sunlight to prevent fiber discoloration.</li>
                    <li>Handle with care to preserve natural loom integrity.</li>
                  </ul>
                )}
              </div>

              {/* Tab 3: Shipping & Returns */}
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <button 
                  onClick={() => toggleTab('shipping')}
                  style={{ 
                    width: '100%', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    background: 'none', 
                    border: 'none', 
                    fontWeight: 600, 
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '8px 0',
                    cursor: 'pointer' 
                  }}
                >
                  <span>Shipping & Returns</span>
                  <span>{openTabs.shipping ? '−' : '+'}</span>
                </button>
                {openTabs.shipping && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Truck size={16} /> Flat shipping rate of $15 applies global storefront (Free on orders $75+).
                    </p>
                    <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <RefreshCw size={16} /> Returns eligible within 30 days of receiving package. Unused condition required.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Meet the Maker Artisan Section */}
        <section className="details-maker-section">
          <div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '8px' }}>
              CREATIVE PHILOSOPHY
            </span>
            <h2 style={{ fontSize: '32px', marginBottom: '16px' }}>Meet the Maker</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.6' }}>
              This piece was designed and hand-woven in partnership with artisans in Portland. By working with weavers who pass down loom crafting skills from parent to child, we help preserve cultural textile roots while utilizing natural, biodegradable fibers.
            </p>
            <Link to="/our-story" style={{ color: 'var(--brand-primary)', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Learn about our sustainability practices <ChevronRight size={16} />
            </Link>
          </div>
          <div>
            <img 
              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600" 
              alt="Artisan weaver" 
              style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }}
            />
          </div>
        </section>

        {/* Related Products Grid */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 style={{ fontSize: '28px', marginBottom: '32px', fontFamily: 'var(--font-serif)', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              You May Also Like
            </h2>
            <div className="grid-products">
              {relatedProducts.map((p) => {
                const hasDisc = p.salePrice !== null;
                const origPrice = p.originalPrice;
                const salePriceVal = p.salePrice;
                const discPercent = hasDisc ? Math.round(((origPrice - (salePriceVal || 0)) / origPrice) * 100) : 0;

                return (
                  <div key={p.id} className="product-card">
                    <Link to={`/products/${p.slug}`} className="product-image-container">
                      {hasDisc && <span className="badge-tag badge-sale">{discPercent}% OFF</span>}
                      {p.stockQuantity === 0 && <span className="badge-tag badge-out-of-stock">Out of Stock</span>}
                      <img src={p.mainImage} alt={p.name} className="product-card-img" />
                    </Link>
                    
                    <div className="product-card-info">
                      <div className="product-card-category">{p.categoryName}</div>
                      <h3 className="product-card-title">
                        <Link to={`/products/${p.slug}`}>{p.name}</Link>
                      </h3>
                      
                      <div className="product-card-price-row">
                        {hasDisc ? (
                          <>
                            <span className="price-current">${salePriceVal?.toFixed(2)}</span>
                            <span className="price-original">${origPrice.toFixed(2)}</span>
                          </>
                        ) : (
                          <span className="price-current">${origPrice.toFixed(2)}</span>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => addToCart(p, 1)}
                        disabled={p.stockQuantity <= 0}
                        className="btn btn-outline-brand btn-sm"
                        style={{ marginTop: '16px', width: '100%' }}
                      >
                        {p.stockQuantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}


      </div>

      <style>{`
        .product-details-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 64px;
          align-items: start;
          margin-bottom: 80px;
        }
        .details-gallery-container {
          height: 500px;
        }
        .details-title {
          font-size: 40px;
        }
        .details-buttons-row {
          display: flex;
          gap: 16px;
        }
        .details-maker-section {
          background-color: #F6EFE6;
          border: 1px solid var(--border-color);
          border-radius: 4px;
          padding: 48px;
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 48px;
          align-items: center;
          margin-bottom: 80px;
        }
        @media (max-width: 768px) {
          .product-details-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
            margin-bottom: 40px !important;
          }
          .details-gallery-container {
            height: 350px !important;
          }
          .details-title {
            font-size: 28px !important;
          }
          .details-maker-section {
            grid-template-columns: 1fr !important;
            padding: 24px !important;
            gap: 24px !important;
            margin-bottom: 40px !important;
          }
        }
        @media (max-width: 480px) {
          .details-gallery-container {
            height: 280px !important;
          }
          .details-buttons-row {
            flex-direction: column !important;
            gap: 12px !important;
          }
        }
      `}</style>

    </div>
  );
};
