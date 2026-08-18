import React, { useEffect, useState } from 'react';
import { getProducts, getCategories, createCategory, createProduct, updateProduct, deleteProduct } from '../../services/db';
import type { Product, Category } from '../../types';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Upload, 
  X, 
  Image as ImageIcon, 
  FolderPlus,
  AlertCircle
} from 'lucide-react';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Add/Edit Product Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Field States
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number | null>(null);
  const [stockQuantity, setStockQuantity] = useState<number>(0);
  const [sku, setSku] = useState('');
  const [featured, setFeatured] = useState(false);
  const [bestSeller, setBestSeller] = useState(false);
  const [newArrival, setNewArrival] = useState(false);
  const [tagsInput, setTagsInput] = useState('');

  // Image System Form States
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  // Category Modal State
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Operations States
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        getProducts(),
        getCategories()
      ]);
      setProducts(p);
      setCategories(c);
    } catch (err) {
      console.error('Failed to load products list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setShortDescription('');
    setCategoryId(categories[0]?.id || '');
    setOriginalPrice(0);
    setSalePrice(null);
    setStockQuantity(10);
    setSku('');
    setFeatured(false);
    setBestSeller(false);
    setNewArrival(true);
    setTagsInput('');
    setImageUrls([]);
    setUrlInput('');
    setNewFiles([]);
    setExistingImages([]);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description);
    setShortDescription(product.shortDescription);
    setCategoryId(product.categoryId);
    setOriginalPrice(product.originalPrice);
    setSalePrice(product.salePrice);
    setStockQuantity(product.stockQuantity);
    setSku(product.sku);
    setFeatured(product.featured);
    setBestSeller(product.bestSeller);
    setNewArrival(product.newArrival);
    setTagsInput(product.tags.join(', '));
    
    // Existing product images loaded
    setExistingImages(product.images);
    setImageUrls([]);
    setUrlInput('');
    setNewFiles([]);
    setFormError('');
    setModalOpen(true);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !newCatSlug) return;
    try {
      await createCategory({
        name: newCatName,
        slug: newCatSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        description: newCatDesc
      });
      setNewCatName('');
      setNewCatSlug('');
      setNewCatDesc('');
      setCatModalOpen(false);
      await loadData();
    } catch (err) {
      console.error('Category creation failed:', err);
    }
  };

  const handleAddImageUrl = () => {
    if (urlInput.trim()) {
      setImageUrls([...imageUrls, urlInput.trim()]);
      setUrlInput('');
    }
  };

  const handleRemoveImageUrl = (idx: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== idx));
  };

  const handleRemoveExistingImage = (url: string) => {
    setExistingImages(existingImages.filter(img => img !== url));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      setNewFiles([...newFiles, ...filesArr]);
    }
  };

  const handleRemoveNewFile = (idx: number) => {
    setNewFiles(newFiles.filter((_, i) => i !== idx));
  };

  const handleDeleteProduct = async (product: Product) => {
    const confirm = window.confirm(`Are you sure you want to delete "${product.name}"?\nPrevious client orders containing this product will not be affected.`);
    if (confirm) {
      try {
        await deleteProduct(product.id);
        await loadData();
      } catch (err) {
        console.error('Deletion failed:', err);
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Val 1: Price bounds check
    if (salePrice !== null && salePrice > originalPrice) {
      setFormError('Pricing Error: Sale price cannot exceed original retail price.');
      return;
    }
    if (originalPrice <= 0) {
      setFormError('Pricing Error: Original price must be greater than $0.');
      return;
    }

    // Val 2: Image presence check
    const totalImagesCount = existingImages.length + newFiles.length + imageUrls.length;
    if (totalImagesCount === 0) {
      setFormError('Image System: At least one product image (upload or URL) is required.');
      return;
    }

    setSaving(true);

    try {
      const selectedCategoryName = categories.find(c => c.id === categoryId)?.name || 'Default';
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

      const productPayload = {
        name,
        slug: sku.toLowerCase().replace(/[^a-z0-9-]/g, '-'), // fallback or generate unique slug based on SKU
        description,
        shortDescription,
        categoryId,
        categoryName: selectedCategoryName,
        originalPrice,
        salePrice: salePrice === 0 ? null : salePrice,
        stockQuantity,
        sku,
        featured,
        bestSeller,
        newArrival,
        tags
      };

      if (editingProduct) {
        // Edit mode
        await updateProduct(
          editingProduct.id,
          productPayload,
          newFiles,
          existingImages,
          imageUrls
        );
      } else {
        // Create mode
        await createProduct(
          productPayload,
          newFiles,
          imageUrls
        );
      }

      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Operation failed. Verify image file sizes and types.');
    } finally {
      setSaving(false);
    }
  };

  // Filter products locally for table
  const filteredProducts = products.filter(p => {
    // Search filter
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const matchName = p.name.toLowerCase().includes(s);
      const matchSku = p.sku.toLowerCase().includes(s);
      if (!matchName && !matchSku) return false;
    }

    // Category filter
    if (categoryFilter && p.categoryId !== categoryFilter) return false;

    // Stock filters
    if (stockFilter === 'low') return p.stockQuantity < 5 && p.stockQuantity > 0;
    if (stockFilter === 'out') return p.stockQuantity === 0;

    return true;
  });

  return (
    <div>
      {/* Top action row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '20px' }}>Product Management ({filteredProducts.length})</h3>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setCatModalOpen(true)} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FolderPlus size={16} /> New Category
          </button>
          <button onClick={openAddModal} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Filters block */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        backgroundColor: '#FFFFFF', 
        padding: '16px', 
        borderRadius: '4px',
        border: '1px solid var(--border-color)',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        
        {/* Search */}
        <div style={{ flexGrow: 1, minWidth: '200px', position: 'relative' }}>
          <input 
            type="text"
            className="input-field"
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', paddingTop: '8px', paddingBottom: '8px' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
        </div>

        {/* Category */}
        <select 
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="input-field"
          style={{ width: '180px', padding: '8px' }}
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {/* Stock status */}
        <select 
          value={stockFilter}
          onChange={e => setStockFilter(e.target.value as any)}
          className="input-field"
          style={{ width: '180px', padding: '8px' }}
        >
          <option value="all">All Inventory</option>
          <option value="low">Low Stock (&lt; 5)</option>
          <option value="out">Out of Stock (0)</option>
        </select>
      </div>

      {/* Main product table */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading products inventory...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 12px', backgroundColor: '#FFFFFF', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>No products match your current search criteria.</p>
        </div>
      ) : (
        <div className="table-wrapper" style={{ marginTop: 0 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Retail Price</th>
                <th>Sale Price</th>
                <th>Stock</th>
                <th>SKU</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '2px', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <img src={p.mainImage} alt={p.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '14px' }}>{p.name}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--brand-primary)', textTransform: 'uppercase', fontWeight: 600 }}>
                        {p.featured && 'Featured'} {p.bestSeller && '• Bestseller'} {p.newArrival && '• New'}
                      </span>
                    </div>
                  </td>
                  <td>{p.categoryName}</td>
                  <td>${p.originalPrice.toFixed(2)}</td>
                  <td>{p.salePrice !== null ? `$${p.salePrice.toFixed(2)}` : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td>
                    {p.stockQuantity === 0 ? (
                      <span className="status-badge status-badge-cancelled">Out of Stock</span>
                    ) : p.stockQuantity < 5 ? (
                      <span className="status-badge status-badge-pending">Low Stock ({p.stockQuantity})</span>
                    ) : (
                      <span className="status-badge status-badge-delivered">In Stock ({p.stockQuantity})</span>
                    )}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{p.sku}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link to={`/products/${p.slug}`} target="_blank" className="btn btn-secondary btn-sm" style={{ padding: '6px' }} title="View Storefront Page">
                        <Eye size={14} />
                      </Link>
                      <button onClick={() => openEditModal(p)} className="btn btn-outline-brand btn-sm" style={{ padding: '6px' }} title="Edit Product">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => handleDeleteProduct(p)} className="btn btn-danger btn-sm" style={{ padding: '6px' }} title="Delete Product">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* C. ADD / EDIT PRODUCT MODAL OVERLAY */}
      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(44,42,41,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '24px' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '4px', width: '100%', maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', position: 'relative' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <h3 style={{ fontSize: '22px', fontFamily: 'var(--font-serif)' }}>
                {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Create New Product'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
            </div>

            {formError && <div className="error-banner" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={16} />{formError}</div>}

            <form onSubmit={handleFormSubmit}>
              
              {/* Row 1: Name & SKU */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Product Title *</label>
                  <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Multicolor Ruffled Hand Fan" />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU Code *</label>
                  <input type="text" className="input-field" value={sku} onChange={e => setSku(e.target.value)} required placeholder="e.g. FAN-RUFF-MUL" />
                </div>
              </div>

              {/* Row 2: Short Description */}
              <div className="form-group">
                <label className="form-label">Short Summary *</label>
                <input type="text" className="input-field" value={shortDescription} onChange={e => setShortDescription(e.target.value)} required placeholder="Brief single-line summary displayed on cards..." />
              </div>

              {/* Row 3: Full Description */}
              <div className="form-group">
                <label className="form-label">Detailed Description *</label>
                <textarea rows={4} className="input-field" value={description} onChange={e => setDescription(e.target.value)} required placeholder="Full item background details..." style={{ resize: 'vertical' }} />
              </div>

              {/* Row 4: Category, Price, Stock */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="input-field" required>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Retail Price ($) *</label>
                  <input type="number" step="0.01" className="input-field" value={originalPrice || ''} onChange={e => setOriginalPrice(Number(e.target.value))} required placeholder="60.00" />
                </div>
                <div className="form-group">
                  <label className="form-label">Sale Price ($)</label>
                  <input type="number" step="0.01" className="input-field" value={salePrice || ''} onChange={e => setSalePrice(e.target.value ? Number(e.target.value) : null)} placeholder="45.00" />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock Quantity *</label>
                  <input type="number" className="input-field" value={stockQuantity} onChange={e => setStockQuantity(Number(e.target.value))} required placeholder="10" />
                </div>
              </div>

              {/* Row 5: Marketing Badges & Tags */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', margin: '16px 0', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <div>
                  <label className="form-label">Promotional Settings</label>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <label className="form-checkbox">
                      <input type="checkbox" checked={featured} onChange={e => setFeatured(e.target.checked)} />
                      <span>Featured</span>
                    </label>
                    <label className="form-checkbox">
                      <input type="checkbox" checked={bestSeller} onChange={e => setBestSeller(e.target.checked)} />
                      <span>Bestseller</span>
                    </label>
                    <label className="form-checkbox">
                      <input type="checkbox" checked={newArrival} onChange={e => setNewArrival(e.target.checked)} />
                      <span>New Arrival</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Search Tags (comma-separated)</label>
                  <input type="text" className="input-field" value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="fan, raffia, multicolor" />
                </div>
              </div>

              {/* Image Manager Section */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginBottom: '24px' }}>
                <h4 className="form-label" style={{ fontSize: '13px', marginBottom: '16px' }}>Image Management</h4>
                
                {/* Visual grid of existing & queued images */}
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  
                  {/* Existing Images */}
                  {existingImages.map((img, idx) => (
                    <div key={`exist-${idx}`} style={{ position: 'relative', width: '80px', height: '80px', border: '1px solid var(--border-color)', padding: '2px', borderRadius: '4px' }}>
                      <img src={img} alt="Existing" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      <button type="button" onClick={() => handleRemoveExistingImage(img)} style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: 'var(--error)', color: '#FFFFFF', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px' }}>
                        <X size={10} />
                      </button>
                    </div>
                  ))}

                  {/* Pasted URL Images */}
                  {imageUrls.map((img, idx) => (
                    <div key={`url-${idx}`} style={{ position: 'relative', width: '80px', height: '80px', border: '1px solid var(--brand-primary)', padding: '2px', borderRadius: '4px' }}>
                      <img src={img} alt="URL Queued" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      <button type="button" onClick={() => handleRemoveImageUrl(idx)} style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: 'var(--error)', color: '#FFFFFF', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px' }}>
                        <X size={10} />
                      </button>
                    </div>
                  ))}

                  {/* Queued files */}
                  {newFiles.map((file, idx) => (
                    <div key={`file-${idx}`} style={{ position: 'relative', width: '80px', height: '80px', border: '1px dashed var(--brand-primary)', padding: '2px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--brand-light)' }}>
                      <ImageIcon size={24} color="var(--brand-primary)" />
                      <span style={{ fontSize: '9px', textAlign: 'center', display: 'block', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', width: '90%' }}>{file.name.substring(0, 10)}</span>
                      <button type="button" onClick={() => handleRemoveNewFile(idx)} style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: 'var(--error)', color: '#FFFFFF', border: 'none', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px' }}>
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Upload & Url addition inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                  
                  {/* Upload box */}
                  <div style={{ border: '2px dashed var(--border-color)', padding: '16px', borderRadius: '4px', textAlign: 'center', position: 'relative' }}>
                    <Upload size={24} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Upload image from computer (Max 5MB)</p>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      onChange={handleFileChange}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                    />
                  </div>

                  {/* URL Paste input */}
                  <div>
                    <label className="form-label" style={{ marginBottom: '4px' }}>Add Image URL</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        className="input-field" 
                        value={urlInput} 
                        onChange={e => setUrlInput(e.target.value)}
                        placeholder="https://example.com/image.jpg" 
                      />
                      <button type="button" onClick={handleAddImageUrl} className="btn btn-outline-brand" style={{ padding: '8px 16px' }}>
                        Add
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                <button type="submit" disabled={saving} className="btn btn-primary" style={{ flexGrow: 1 }}>
                  {saving ? 'Saving changes to database...' : 'Save Product Data'}
                </button>
                <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* D. NEW CATEGORY DIALOG OVERLAY */}
      {catModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(44,42,41,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1001 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '4px', width: '100%', maxWidth: '440px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '18px', fontFamily: 'var(--font-serif)' }}>Add Store Category</h3>
              <button onClick={() => setCatModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
            </div>

            <form onSubmit={handleCreateCategory}>
              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newCatName}
                  onChange={e => { setNewCatName(e.target.value); setNewCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-')); }}
                  required 
                  placeholder="e.g. Traditional Fans" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category URL Slug *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={newCatSlug}
                  onChange={e => setNewCatSlug(e.target.value)}
                  required 
                  placeholder="e.g. traditional-fans" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Brief Description</label>
                <textarea 
                  rows={3}
                  className="input-field" 
                  value={newCatDesc}
                  onChange={e => setNewCatDesc(e.target.value)}
                  placeholder="Brief description of the products in this category..." 
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
                Create Category
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
