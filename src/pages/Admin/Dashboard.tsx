import React, { useEffect, useState } from 'react';
import { getOrders, getProducts, getCustomersList, getCategories, createCategory } from '../../services/db';
import type { Order, Product, UserProfile } from '../../types';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  TrendingUp, 
  Receipt, 
  Clock, 
  Users, 
  ShoppingBag, 
  AlertTriangle, 
  Database,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Seed State
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [o, p, c] = await Promise.all([
        getOrders(),
        getProducts(),
        getCustomersList()
      ]);
      setOrders(o);
      setProducts(p);
      setCustomers(c);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate Metrics
  const activeOrders = orders.filter(o => !['Cancelled', 'Refunded'].includes(o.orderStatus));
  const totalSales = activeOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrdersCount = orders.filter(o => o.orderStatus === 'Pending').length;
  const lowStockCount = products.filter(p => p.stockQuantity < 5).length;

  const handleSeedData = async () => {
    setSeeding(true);
    setSeedSuccess(false);
    try {
      // 1. Fetch categories or create them if empty
      let categories = await getCategories();
      let handbagCatId = categories.find(c => c.name === 'Handbags')?.id || '';
      let homeCatId = categories.find(c => c.name === 'Home Accessories')?.id || '';
      let tradCatId = categories.find(c => c.name === 'Traditional Items')?.id || '';

      if (!handbagCatId) {
        handbagCatId = await createCategory({
          name: 'Handbags',
          slug: 'handbags',
          description: 'Ethically crafted straw and raffia tote bags.'
        });
      }
      if (!homeCatId) {
        homeCatId = await createCategory({
          name: 'Home Accessories',
          slug: 'home-accessories',
          description: 'Artisan textile tapestries and basketry.'
        });
      }
      if (!tradCatId) {
        tradCatId = await createCategory({
          name: 'Traditional Items',
          slug: 'traditional-items',
          description: 'Heritage hand fans and seasonal items.'
        });
      }

      // Default demo products seed list
      const demoProducts = [
        {
          name: 'Multicolor Ruffled Hand Fan',
          slug: 'multicolor-ruffled-hand-fan',
          description: 'A striking traditional fan hand-woven from colored palm leaves. Perfect as a handheld breeze provider or an elegant wall decoration.',
          shortDescription: 'Hand-woven palm leaf decorative ruff fan.',
          categoryId: tradCatId,
          categoryName: 'Traditional Items',
          originalPrice: 60.00,
          salePrice: 45.00,
          stockQuantity: 12,
          sku: 'FAN-RUFF-MUL',
          featured: true,
          bestSeller: true,
          newArrival: true,
          tags: ['fan', 'woven', 'palm', 'multicolor']
        },
        {
          name: 'Artisan Market Tote',
          slug: 'artisan-market-tote',
          description: 'A spacious and highly durable tote bag made of high-quality raffia fibers. Features sturdy leather straps for carrying grocery items or beach essentials.',
          shortDescription: 'Spacious hand-woven raffia beach and market tote.',
          categoryId: handbagCatId,
          categoryName: 'Handbags',
          originalPrice: 85.00,
          salePrice: 65.00,
          stockQuantity: 8,
          sku: 'TOTE-MKT-ART',
          featured: true,
          bestSeller: true,
          newArrival: false,
          tags: ['tote', 'raffia', 'handbag', 'market']
        },
        {
          name: 'Geometric Wall Hanging',
          slug: 'geometric-wall-hanging',
          description: 'An intricate wall hanging featuring geometric patterns. Hand-spun from organic virgin wool and colored using plant-based pigments.',
          shortDescription: 'Intricate hand-spun organic virgin wool tapestry.',
          categoryId: homeCatId,
          categoryName: 'Home Accessories',
          originalPrice: 120.00,
          salePrice: null,
          stockQuantity: 4,
          sku: 'WALL-GEO-TAP',
          featured: true,
          bestSeller: false,
          newArrival: true,
          tags: ['wall', 'hanging', 'wool', 'tapestry']
        },
        {
          name: 'Raffia Clutch',
          slug: 'raffia-clutch',
          description: 'A sleek, lightweight envelope clutch made of finely woven raffia. Ideal for evening gatherings or carrying daily travel items.',
          shortDescription: 'Elegant hand-woven envelope clutch with magnetic clasp.',
          categoryId: handbagCatId,
          categoryName: 'Handbags',
          originalPrice: 55.00,
          salePrice: null,
          stockQuantity: 15,
          sku: 'CLU-ENV-RAF',
          featured: false,
          bestSeller: true,
          newArrival: false,
          tags: ['clutch', 'raffia', 'purse', 'handbag']
        },
        {
          name: 'Handwoven Basket',
          slug: 'handwoven-basket',
          description: 'A sturdy, decorative utility basket woven from sweetgrass. Perfect for storing towels, keys, or highlighting organic greenery.',
          shortDescription: 'Sturdy sweetgrass basket with handles.',
          categoryId: homeCatId,
          categoryName: 'Home Accessories',
          originalPrice: 75.00,
          salePrice: 50.00,
          stockQuantity: 0, // Mark out of stock to test out-of-stock edge cases!
          sku: 'BSK-UTL-SWE',
          featured: false,
          bestSeller: false,
          newArrival: true,
          tags: ['basket', 'sweetgrass', 'storage']
        }
      ];

      // Seed images mapping (using elegant handcraft photos from Unsplash)
      const imageMapping: Record<string, string> = {
        'multicolor-ruffled-hand-fan': 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&q=80&w=600',
        'artisan-market-tote': 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600',
        'geometric-wall-hanging': 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=600',
        'raffia-clutch': 'https://images.unsplash.com/photo-1566150905458-1bf1fc15aae9?auto=format&fit=crop&q=80&w=600',
        'handwoven-basket': 'https://images.unsplash.com/photo-1531835551805-16d864c8d311?auto=format&fit=crop&q=80&w=600'
      };

      // Write each product if it doesn't already exist (by slug)
      const existingProducts = await getProducts();
      for (const demo of demoProducts) {
        const exists = existingProducts.some(p => p.slug === demo.slug);
        if (!exists) {
          const docRef = doc(db, 'products', demo.slug); // Set ID as slug for easy lookup
          const imageUrl = imageMapping[demo.slug];
          
          await setDoc(docRef, {
            ...demo,
            id: demo.slug,
            images: [imageUrl],
            mainImage: imageUrl,
            availability: demo.stockQuantity > 0 ? 'in-stock' : 'out-of-stock',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }

      setSeedSuccess(true);
      await fetchData(); // reload statistics
    } catch (err) {
      console.error('Seeding error:', err);
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading database metrics...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Seed Success Alert */}
      {seedSuccess && (
        <div style={{ 
          backgroundColor: '#D1FAE5', 
          color: '#065F46', 
          border: '1px solid #A7F3D0',
          padding: '16px 20px', 
          borderRadius: '4px', 
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={20} />
          <span>Demo categories and products have been seeded successfully!</span>
        </div>
      )}

      {/* A. STATS GRID CARD DECK */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        
        {/* Metric 1 */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '4px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'var(--brand-light)', color: 'var(--brand-primary)', padding: '12px', borderRadius: '4px' }}><TrendingUp size={24} /></div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Total Sales</span>
            <strong style={{ fontSize: '20px' }}>${totalSales.toFixed(2)}</strong>
          </div>
        </div>

        {/* Metric 2 */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '4px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'var(--brand-light)', color: 'var(--brand-primary)', padding: '12px', borderRadius: '4px' }}><Receipt size={24} /></div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Total Orders</span>
            <strong style={{ fontSize: '20px' }}>{orders.length}</strong>
          </div>
        </div>

        {/* Metric 3 */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '4px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ backgroundColor: '#FEF3C7', color: '#D97706', padding: '12px', borderRadius: '4px' }}><Clock size={24} /></div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Pending Orders</span>
            <strong style={{ fontSize: '20px' }}>{pendingOrdersCount}</strong>
          </div>
        </div>

        {/* Metric 4 */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '4px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'var(--brand-light)', color: 'var(--brand-primary)', padding: '12px', borderRadius: '4px' }}><Users size={24} /></div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Customers</span>
            <strong style={{ fontSize: '20px' }}>{customers.length}</strong>
          </div>
        </div>

        {/* Metric 5 */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '4px', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'var(--brand-light)', color: 'var(--brand-primary)', padding: '12px', borderRadius: '4px' }}><ShoppingBag size={24} /></div>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Products</span>
            <strong style={{ fontSize: '20px' }}>{products.length}</strong>
          </div>
        </div>

        {/* Metric 6 */}
        {lowStockCount > 0 && (
          <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', padding: '24px', borderRadius: '4px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ backgroundColor: '#FCA5A5', color: '#DC2626', padding: '12px', borderRadius: '4px' }}><AlertTriangle size={24} /></div>
            <div>
              <span style={{ fontSize: '12px', color: '#B91C1C', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>Low Stock Items</span>
              <strong style={{ fontSize: '20px', color: '#B91C1C' }}>{lowStockCount}</strong>
            </div>
          </div>
        )}

      </div>

      {/* B. MIDDLE SECTION: SEED UTILITY & QUICK LINKS */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr', gap: '32px' }}>
        
        {/* Recent Orders Overview */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', padding: '32px', borderRadius: '4px', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '18px' }}>Recent Order Submissions</h3>
            <Link to="/admin/orders" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              All Orders <ArrowRight size={14} />
            </Link>
          </div>

          {orders.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '12px 0' }}>No customer orders have been received yet.</p>
          ) : (
            <div className="table-wrapper" style={{ marginTop: 0, border: 'none' }}>
              <table className="admin-table" style={{ fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map(o => (
                    <tr key={o.orderId}>
                      <td style={{ fontWeight: 600 }}>#{o.orderId.substring(0, 8)}...</td>
                      <td>{o.customerName}</td>
                      <td>
                        <span style={{ fontSize: '9px', padding: '2px 6px' }} className={`status-badge ${
                          o.orderStatus === 'Pending' ? 'status-badge-pending' :
                          o.orderStatus === 'Delivered' ? 'status-badge-delivered' :
                          o.orderStatus === 'Cancelled' ? 'status-badge-cancelled' : 'status-badge-processing'
                        }`}>
                          {o.orderStatus}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>${o.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Database seed action panel */}
        <div style={{ 
          backgroundColor: '#FAF7F2', 
          border: '1px dashed var(--brand-primary)', 
          padding: '32px', 
          borderRadius: '4px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center' 
        }}>
          <Database size={36} color="var(--brand-primary)" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Seed Store Database</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.5' }}>
            Populate your Cloud Firestore database with demo categories (Handbags, Home Accessories) and the 5 default artisan product listings. Does not overwrite existing records.
          </p>
          
          <button 
            onClick={handleSeedData} 
            disabled={seeding}
            className="btn btn-primary"
            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}
          >
            {seeding ? 'Seeding collections...' : <><Database size={16} /> Seed Demo Products</>}
          </button>
        </div>

      </div>
    </div>
  );
};
