import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getProducts, getCategories } from '../services/db';
import type { Product, Category } from '../types';
import { useCart } from '../context/CartContext';
import { Filter, RotateCcw, SlidersHorizontal, Search } from 'lucide-react';

export const Shop: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<number>(300);
  const [onlySale, setOnlySale] = useState<boolean>(false);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('featured');

  // Load Categories & URL query parameters
  useEffect(() => {
    const initData = async () => {
      try {
        const [loadedProducts, loadedCategories] = await Promise.all([
          getProducts(),
          getCategories()
        ]);
        setProducts(loadedProducts);
        setCategories(loadedCategories);

        // Sync URL search queries if they exist
        const urlSearch = searchParams.get('search');
        if (urlSearch) {
          setSearchQuery(urlSearch);
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

  // Handle clearing all filters
  const handleClearFilters = () => {
    setSelectedCategory('');
    setSearchQuery('');
    setMaxPrice(300);
    setOnlySale(false);
    setOnlyInStock(false);
    setSortBy('featured');
    setSearchParams({});
  };

  // Filter & Sort Logic (Performed in memory for speed & simplicity)
  const filteredProducts = products
    .filter((product) => {
      // Category filter
      if (selectedCategory && product.categoryId !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const queryText = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(queryText);
        const matchesDesc = product.description.toLowerCase().includes(queryText);
        const matchesCat = product.categoryName.toLowerCase().includes(queryText);
        const matchesTags = product.tags.some(t => t.toLowerCase().includes(queryText));
        if (!matchesName && !matchesDesc && !matchesCat && !matchesTags) return false;
      }

      // Max price
      const price = product.salePrice !== null ? product.salePrice : product.originalPrice;
      if (price > maxPrice) return false;

      // Sale filter
      if (onlySale && product.salePrice === null) return false;

      // In stock filter
      if (onlyInStock && product.stockQuantity <= 0) return false;

      return true;
    })
    .sort((a, b) => {
      const priceA = a.salePrice !== null ? a.salePrice : a.originalPrice;
      const priceB = b.salePrice !== null ? b.salePrice : b.originalPrice;

      switch (sortBy) {
        case 'newest':
          // Sort by date descending
          return new Date(b.createdAt.seconds * 1000 || b.createdAt).getTime() - new Date(a.createdAt.seconds * 1000 || a.createdAt).getTime();
        case 'price-asc':
          return priceA - priceB;
        case 'price-desc':
          return priceB - priceA;
        case 'bestseller':
          // True/featured first
          return (b.bestSeller ? 1 : 0) - (a.bestSeller ? 1 : 0);
        case 'featured':
        default:
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      }
    });

  return (
    <div style={{ padding: '60px 0' }}>
      <div className="container">
        
        {/* Page Title & Details */}
        <div style={{ marginBottom: '40px', borderBottom: '1px solid var(--border-color)', paddingBottom: '24px' }}>
          <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>Store Collection</h1>
          <p style={{ color: 'var(--text-muted)' }}>Explore our catalog of custom artisan pieces handcrafted using organic materials.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '48px' }}>
          
          {/* A. SIDEBAR FILTERS */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
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

            {/* 1. Search input */}
            <div>
              <label className="form-label">Search Keywords</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Baskets, fans..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ paddingRight: '40px' }}
                />
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', right: '12px', top: '14px' }} />
              </div>
            </div>

            {/* 2. Category selection */}
            <div>
              <label className="form-label">Product Category</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label className="form-checkbox" style={{ fontWeight: !selectedCategory ? 600 : 400 }}>
                  <input 
                    type="radio" 
                    name="category" 
                    checked={!selectedCategory} 
                    onChange={() => setSelectedCategory('')} 
                  />
                  <span>All Categories</span>
                </label>
                {categories.map(cat => (
                  <label key={cat.id} className="form-checkbox" style={{ fontWeight: selectedCategory === cat.id ? 600 : 400 }}>
                    <input 
                      type="radio" 
                      name="category" 
                      checked={selectedCategory === cat.id} 
                      onChange={() => setSelectedCategory(cat.id)} 
                    />
                    <span>{cat.name}</span>
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
          </aside>

          {/* B. PRODUCT LISTINGS */}
          <div>
            
            {/* Header: Total products found + sorting */}
            <div style={{ 
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
                <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sort By:</span>
                <select 
                  value={sortBy} 
                  onChange={e => setSortBy(e.target.value)}
                  className="input-field"
                  style={{ padding: '6px 12px', fontSize: '13px', width: '180px' }}
                >
                  <option value="featured">Featured Masterpieces</option>
                  <option value="newest">New Arrivals</option>
                  <option value="bestseller">Best Sellers</option>
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
    </div>
  );
};
