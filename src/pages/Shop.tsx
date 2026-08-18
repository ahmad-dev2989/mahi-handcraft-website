import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getProducts, getCategories } from '../services/db';
import type { Product, Category } from '../types';
import { useCart } from '../context/CartContext';
import { Filter, RotateCcw, SlidersHorizontal, Search, X, Check } from 'lucide-react';

export const Shop: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();

  // Mobile Filters Drawer Toggle
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<number>(300);
  const [onlySale, setOnlySale] = useState<boolean>(false);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('featured');

  // Load categories and sync url params
  useEffect(() => {
    const initData = async () => {
      try {
        const [loadedProducts, loadedCategories] = await Promise.all([
          getProducts(),
          getCategories()
        ]);
        setProducts(loadedProducts);
        setCategories(loadedCategories);

        const urlSearch = searchParams.get('search');
        if (urlSearch) {
          setSearchQuery(urlSearch);
        }
        
        const urlCat = searchParams.get('category');
        if (urlCat) {
          setSelectedCategory(urlCat);
        }

        const urlFilter = searchParams.get('filter');
        if (urlFilter) {
          if (urlFilter === 'featured') setSortBy('featured');
          else if (urlFilter === 'bestseller') setSortBy('bestseller');
          else if (urlFilter === 'new') setSortBy('newest');
        }
      } catch (err) {
        console.error('Failed to load shop data:', err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [searchParams]);

  // Lock body scroll when mobile filter drawer is open
  useEffect(() => {
    if (mobileFiltersOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileFiltersOpen]);

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSearchQuery('');
    setMaxPrice(300);
    setOnlySale(false);
    setOnlyInStock(false);
    setSortBy('featured');
    setSearchParams({});
  };

  const filteredProducts = products
    .filter((product) => {
      if (selectedCategory && product.categoryId !== selectedCategory) return false;

      if (searchQuery.trim()) {
        const queryText = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(queryText);
        const matchesDesc = product.description.toLowerCase().includes(queryText);
        const matchesCat = product.categoryName.toLowerCase().includes(queryText);
        const matchesTags = product.tags.some(t => t.toLowerCase().includes(queryText));
        if (!matchesName && !matchesDesc && !matchesCat && !matchesTags) return false;
      }

      const price = product.salePrice !== null ? product.salePrice : product.originalPrice;
      if (price > maxPrice) return false;

      if (onlySale && product.salePrice === null) return false;
      if (onlyInStock && product.stockQuantity <= 0) return false;

      return true;
    })
    .sort((a, b) => {
      const priceA = a.salePrice !== null ? a.salePrice : a.originalPrice;
      const priceB = b.salePrice !== null ? b.salePrice : b.originalPrice;

      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'price-asc':
          return priceA - priceB;
        case 'price-desc':
          return priceB - priceA;
        case 'bestseller':
          return (b.bestSeller ? 1 : 0) - (a.bestSeller ? 1 : 0);
        case 'featured':
        default:
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      }
    });

  // Filter content component (shared between desktop sidebar and mobile drawer)
  const FilterContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* 1. Search */}
      <div>
        <label className="form-label">Search Keywords</label>
        <div style={{ position: 'relative' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Search catalog..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingRight: '40px' }}
          />
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', right: '12px', top: '14px' }} />
        </div>
      </div>

      {/* 2. Category selection */}
      <div>
        <label className="form-label">Categories</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label className="form-checkbox" style={{ fontWeight: !selectedCategory ? 600 : 400 }}>
            <input 
              type="radio" 
              name="category" 
              checked={!selectedCategory} 
              onChange={() => setSelectedCategory('')} 
              style={{ display: 'none' }}
            />
            <span style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              color: !selectedCategory ? 'var(--brand-primary)' : 'var(--text-main)', 
              fontWeight: !selectedCategory ? 600 : 400 
            }}>
              {!selectedCategory ? <Check size={14} /> : null} All Categories
            </span>
          </label>
          {categories.map(cat => (
            <label key={cat.id} className="form-checkbox" style={{ fontWeight: selectedCategory === cat.id ? 600 : 400 }}>
              <input 
                type="radio" 
                name="category" 
                checked={selectedCategory === cat.id} 
                onChange={() => setSelectedCategory(cat.id)} 
                style={{ display: 'none' }}
              />
              <span style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', 
                color: selectedCategory === cat.id ? 'var(--brand-primary)' : 'var(--text-main)', 
                fontWeight: selectedCategory === cat.id ? 600 : 400 
              }}>
                {selectedCategory === cat.id ? <Check size={14} /> : null} {cat.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* 3. Price Filter */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label className="form-label" style={{ margin: 0 }}>Max Price</label>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--brand-primary)' }}>${maxPrice}</span>
        </div>
        <input 
          type="range" 
          min={10} 
          max={300} 
          step={5} 
          value={maxPrice} 
          onChange={e => setMaxPrice(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--brand-primary)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>
          <span>$10</span>
          <span>$300</span>
        </div>
      </div>

      {/* 4. Marketing filters */}
      <div>
        <label className="form-label">Promotions & Stock</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label className="form-checkbox">
            <input 
              type="checkbox" 
              checked={onlySale} 
              onChange={e => setOnlySale(e.target.checked)} 
            />
            <span>Special Offers / Sale</span>
          </label>
          
          <label className="form-checkbox">
            <input 
              type="checkbox" 
              checked={onlyInStock} 
              onChange={e => setOnlyInStock(e.target.checked)} 
            />
            <span>Hide Out of Stock</span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '60px 0' }}>
      <div className="container">
        
        {/* Page Title */}
        <div style={{ marginBottom: '40px', borderBottom: '1px solid var(--border-color)', paddingBottom: '24px' }}>
          <h1 style={{ fontSize: '36px', marginBottom: '8px', fontFamily: 'var(--font-serif)' }}>Store Collection</h1>
          <p style={{ color: 'var(--text-muted)' }}>Explore our catalog of custom artisan pieces handcrafted using organic materials.</p>
        </div>

        {/* Floating Mobile Filter Trigger */}
        <div className="mobile-filter-bar" style={{ 
          display: 'none', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          backgroundColor: '#FFFFFF', 
          border: '1px solid var(--border-color)', 
          padding: '12px 16px', 
          borderRadius: '4px',
          marginBottom: '24px' 
        }}>
          <button 
            onClick={() => setMobileFiltersOpen(true)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
          >
            <SlidersHorizontal size={14} /> Filter & Sort
          </button>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            <strong>{filteredProducts.length}</strong> items
          </span>
        </div>

        {/* Layout split */}
        <div className="shop-layout-grid" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '48px' }}>
          
          {/* A. DESKTOP SIDEBAR FILTERS */}
          <aside className="shop-desktop-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <SlidersHorizontal size={18} /> Filters
              </h3>
              <button 
                onClick={handleClearFilters}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '12px', 
                  fontWeight: 600, 
                  color: 'var(--brand-primary)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  cursor: 'pointer' 
                }}
              >
                <RotateCcw size={12} /> Clear All
              </button>
            </div>

            <FilterContent />
          </aside>

          {/* B. PRODUCT LISTINGS */}
          <div>
            
            {/* Header: Total products found + sorting (desktop view header) */}
            <div className="shop-header-desktop" style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '32px',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-color)',
              padding: '12px 24px',
              borderRadius: '4px'
            }}>
              <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Showing <strong>{filteredProducts.length}</strong> products
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Sort By:</span>
                <select 
                  value={sortBy} 
                  onChange={e => setSortBy(e.target.value)}
                  className="input-field"
                  style={{ padding: '8px 12px', fontSize: '13px', width: '180px', border: '1px solid var(--border-color)' }}
                >
                  <option value="featured">Featured</option>
                  <option value="newest">Newest</option>
                  <option value="bestseller">Best Selling</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading catalog...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '80px 24px', 
                border: '1px dashed var(--border-color)', 
                borderRadius: '4px',
                backgroundColor: '#FFFFFF'
              }}>
                <Filter size={36} color="var(--brand-primary)" style={{ marginBottom: '16px' }} />
                <h3 style={{ marginBottom: '8px' }}>No products found.</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
                  No items matched your current filters. Try expanding your search query or clearing filter options.
                </p>
                <button onClick={handleClearFilters} className="btn btn-primary btn-sm">Clear All Filters</button>
              </div>
            ) : (
              <div className="grid-products">
                {filteredProducts.map((product) => {
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
        </div>
      </div>

      {/* C. MOBILE FILTER DRAWER OVERLAY */}
      {mobileFiltersOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh',
          backgroundColor: 'rgba(44, 42, 41, 0.4)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          zIndex: 1000, display: 'flex', justifyContent: 'flex-start'
        }} onClick={() => setMobileFiltersOpen(false)}>
          
          <div style={{
            width: '85%', maxWidth: '320px', height: '100%', backgroundColor: '#FFFFFF',
            padding: '32px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column'
          }} onClick={e => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Filter size={18} /> Filters & Sort
              </h3>
              <button onClick={() => setMobileFiltersOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            {/* Mobile Sort Dropdown */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Sort Products</label>
              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                className="input-field"
                style={{ padding: '12px' }}
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="bestseller">Best Selling</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>

            <FilterContent />

            <div style={{ display: 'flex', gap: '12px', marginTop: '40px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
              <button onClick={() => setMobileFiltersOpen(false)} className="btn btn-primary btn-sm" style={{ flexGrow: 1 }}>
                Apply Filters
              </button>
              <button 
                onClick={() => { handleClearFilters(); setMobileFiltersOpen(false); }} 
                className="btn btn-secondary btn-sm"
                style={{ padding: '10px' }}
              >
                Reset
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Inline styles for responsive layout mapping */}
      <style>{`
        @media (max-width: 768px) {
          .shop-layout-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .shop-desktop-sidebar {
            display: none !important;
          }
          .shop-header-desktop {
            display: none !important;
          }
          .mobile-filter-bar {
            display: flex !important;
          }
        }
      `}</style>

    </div>
  );
};
