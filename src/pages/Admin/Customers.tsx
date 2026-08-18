import React, { useEffect, useState } from 'react';
import { getCustomersList, getOrders } from '../../services/db';
import type { UserProfile, Order } from '../../types';
import { Search, Eye } from 'lucide-react';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<UserProfile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selected Customer Modal State (to view history)
  const [selectedCustomer, setSelectedCustomer] = useState<UserProfile | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);

  useEffect(() => {
    const loadCustomerData = async () => {
      setLoading(true);
      try {
        const [cList, oList] = await Promise.all([
          getCustomersList(),
          getOrders()
        ]);
        setCustomers(cList);
        setOrders(oList);
      } catch (err) {
        console.error('Failed to load customers data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCustomerData();
  }, []);

  // Set customer orders list when selected
  useEffect(() => {
    if (selectedCustomer) {
      const list = orders.filter(o => o.customerId === selectedCustomer.uid);
      setCustomerOrders(list);
    } else {
      setCustomerOrders([]);
    }
  }, [selectedCustomer, orders]);

  // Compute metrics per user locally
  const getUserStats = (uid: string) => {
    const userOrders = orders.filter(o => o.customerId === uid);
    const activeOrders = userOrders.filter(o => !['Cancelled', 'Refunded'].includes(o.orderStatus));
    const totalSpent = activeOrders.reduce((sum, o) => sum + o.total, 0);
    return {
      count: userOrders.length,
      spent: totalSpent
    };
  };

  // Filter local customer list
  const filteredCustomers = customers.filter(c => {
    // Only show customer accounts in list (exclude admins if needed, but display all customers)
    if (c.role !== 'CUSTOMER') return false;

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const matchName = c.name.toLowerCase().includes(s);
      const matchEmail = c.email.toLowerCase().includes(s);
      if (!matchName && !matchEmail) return false;
    }

    return true;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '20px' }}>Customer Accounts ({filteredCustomers.length})</h3>
      </div>

      {/* Search Input */}
      <div style={{ 
        display: 'flex', 
        backgroundColor: '#FFFFFF', 
        padding: '16px', 
        borderRadius: '4px',
        border: '1px solid var(--border-color)',
        marginBottom: '24px'
      }}>
        <div style={{ flexGrow: 1, position: 'relative' }}>
          <input 
            type="text"
            className="input-field"
            placeholder="Search by customer name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', paddingTop: '8px', paddingBottom: '8px' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
        </div>
      </div>

      {/* Customer list table */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading registered customers...</p>
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 12px', backgroundColor: '#FFFFFF', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
          <p style={{ color: 'var(--text-muted)' }}>No customer accounts match your search.</p>
        </div>
      ) : (
        <div className="table-wrapper" style={{ marginTop: 0 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Email Address</th>
                <th>Registration Date</th>
                <th>Orders Placed</th>
                <th>Total Spent</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(c => {
                const stats = getUserStats(c.uid);
                
                // Format date
                const regDate = c.createdAt.seconds 
                  ? new Date(c.createdAt.seconds * 1000) 
                  : new Date(c.createdAt);

                return (
                  <tr key={c.uid}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.email}</td>
                    <td style={{ fontSize: '13px' }}>{regDate.toLocaleDateString()}</td>
                    <td style={{ textAlign: 'center' }}>{stats.count}</td>
                    <td style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>${stats.spent.toFixed(2)}</td>
                    <td>
                      <button 
                        onClick={() => setSelectedCustomer(c)}
                        className="btn btn-outline-brand btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px' }}
                      >
                        <Eye size={14} /> History
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer Purchase History details Modal overlay */}
      {selectedCustomer && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(44,42,41,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '24px' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '4px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', position: 'relative' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontFamily: 'var(--font-serif)' }}>Order History: {selectedCustomer.name}</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Email: {selectedCustomer.email}</span>
              </div>
              <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
            </div>

            {/* Address Info Details */}
            <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '24px', fontSize: '13px' }}>
              <h4 style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Saved Address Profile</h4>
              {selectedCustomer.shippingAddress ? (
                <div style={{ lineHeight: '1.5' }}>
                  <p><strong>{selectedCustomer.shippingAddress.name}</strong></p>
                  <p>{selectedCustomer.shippingAddress.addressLine}</p>
                  <p>{selectedCustomer.shippingAddress.city}, {selectedCustomer.shippingAddress.state} {selectedCustomer.shippingAddress.postalCode}</p>
                  <p>{selectedCustomer.shippingAddress.country}</p>
                  <p style={{ marginTop: '4px' }}><strong>Phone:</strong> {selectedCustomer.phone}</p>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>This customer has not saved a shipping address yet.</p>
              )}
            </div>

            {/* Orders Sub-list */}
            <h4 style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>Order Records ({customerOrders.length})</h4>
            
            {customerOrders.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>No orders found for this customer.</p>
            ) : (
              <div className="table-wrapper" style={{ marginTop: 0 }}>
                <table className="admin-table" style={{ fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerOrders.map(o => {
                      const dateObj = o.createdAt.seconds 
                        ? new Date(o.createdAt.seconds * 1000) 
                        : new Date(o.createdAt);
                      
                      return (
                        <tr key={o.orderId}>
                          <td style={{ fontWeight: 600 }}>#{o.orderId.substring(0, 8)}...</td>
                          <td>{dateObj.toLocaleDateString()}</td>
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
