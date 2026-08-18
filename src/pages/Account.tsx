import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getOrders } from '../services/db';
import type { Order, OrderStatus } from '../types';
import { User, Receipt, Calendar, Clock, LogOut, CheckCircle } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export const Account: React.FC = () => {
  const { profile, logout, updateProfileData } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const navigate = useNavigate();

  // Profile Edit Form State
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState({
    name: '',
    addressLine: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States'
  });
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setEditName(profile.name || '');
      setEditPhone(profile.phone || '');
      if (profile.shippingAddress) {
        setEditAddress({
          name: profile.shippingAddress.name || '',
          addressLine: profile.shippingAddress.addressLine || '',
          city: profile.shippingAddress.city || '',
          state: profile.shippingAddress.state || '',
          postalCode: profile.shippingAddress.postalCode || '',
          country: profile.shippingAddress.country || 'United States'
        });
      }

      // Fetch customer orders
      const fetchCustomerOrders = async () => {
        setLoadingOrders(true);
        try {
          const list = await getOrders(profile.uid);
          setOrders(list);
        } catch (err) {
          console.error('Failed to load orders:', err);
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchCustomerOrders();
    }
  }, [profile]);

  if (!profile) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setUpdateSuccess(false);
    try {
      await updateProfileData({
        name: editName,
        phone: editPhone,
        shippingAddress: editAddress
      });
      setUpdateSuccess(true);
      setEditMode(false);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err) {
      console.error('Profile update failed:', err);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusClass = (status: OrderStatus) => {
    switch (status) {
      case 'Pending': return 'status-badge-pending';
      case 'Confirmed': return 'status-badge-confirmed';
      case 'Processing': return 'status-badge-processing';
      case 'Shipped': return 'status-badge-shipped';
      case 'Delivered': return 'status-badge-delivered';
      case 'Cancelled': return 'status-badge-cancelled';
      case 'Refunded': return 'status-badge-refunded';
      default: return '';
    }
  };

  return (
    <div style={{ padding: '60px 0' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid var(--border-color)', paddingBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '36px', marginBottom: '4px', fontFamily: 'var(--font-serif)' }}>My Account</h1>
            <p style={{ color: 'var(--text-muted)' }}>Manage your personal details and view your order history.</p>
          </div>
          <button 
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--error)', borderColor: 'var(--error)' }}
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>

        {updateSuccess && (
          <div style={{ 
            backgroundColor: '#D1FAE5', 
            color: '#065F46', 
            border: '1px solid #A7F3D0',
            padding: '12px 20px', 
            borderRadius: '4px', 
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle size={16} />
            <span>Profile information updated successfully!</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '48px', alignItems: 'start' }}>
          
          {/* A. ACCOUNT PROFILE PANEL */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '4px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <User size={18} color="var(--brand-primary)" /> Profile Details
            </h3>

            {editMode ? (
              <form onSubmit={handleUpdateProfile}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="input-field"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input 
                    type="tel" 
                    className="input-field"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <h4 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '24px 0 12px 0', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  Default Shipping Address
                </h4>

                <div className="form-group">
                  <label className="form-label">Recipient Name</label>
                  <input 
                    type="text" 
                    className="input-field"
                    value={editAddress.name}
                    onChange={e => setEditAddress({ ...editAddress, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Street Address</label>
                  <input 
                    type="text" 
                    className="input-field"
                    value={editAddress.addressLine}
                    onChange={e => setEditAddress({ ...editAddress, addressLine: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input 
                      type="text" 
                      className="input-field"
                      value={editAddress.city}
                      onChange={e => setEditAddress({ ...editAddress, city: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input 
                      type="text" 
                      className="input-field"
                      value={editAddress.state}
                      onChange={e => setEditAddress({ ...editAddress, state: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Zip Code</label>
                    <input 
                      type="text" 
                      className="input-field"
                      value={editAddress.postalCode}
                      onChange={e => setEditAddress({ ...editAddress, postalCode: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Country</label>
                    <input 
                      type="text" 
                      className="input-field"
                      value={editAddress.country}
                      onChange={e => setEditAddress({ ...editAddress, country: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button type="submit" disabled={updating} className="btn btn-primary btn-sm" style={{ flexGrow: 1 }}>
                    {updating ? 'Saving...' : 'Save Profile'}
                  </button>
                  <button type="button" onClick={() => setEditMode(false)} className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Name</span>
                  <strong>{profile.name}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Email</span>
                  <strong>{profile.email}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', display: 'block' }}>Phone</span>
                  <strong>{profile.phone || 'No phone number provided'}</strong>
                </div>
                
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                    Shipping Address
                  </span>
                  {profile.shippingAddress ? (
                    <div style={{ lineHeight: '1.5' }}>
                      <p><strong>{profile.shippingAddress.name}</strong></p>
                      <p>{profile.shippingAddress.addressLine}</p>
                      <p>{profile.shippingAddress.city}, {profile.shippingAddress.state} {profile.shippingAddress.postalCode}</p>
                      <p>{profile.shippingAddress.country}</p>
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No address saved.</p>
                  )}
                </div>

                <button onClick={() => setEditMode(true)} className="btn btn-outline-brand btn-sm" style={{ width: '100%', marginTop: '8px' }}>
                  Edit Profile Information
                </button>
              </div>
            )}
          </div>

          {/* B. ORDER HISTORY PANEL */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '4px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <Receipt size={18} color="var(--brand-primary)" /> Purchase History
            </h3>

            {loadingOrders ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading your orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 12px' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>You haven't placed any orders yet.</p>
                <Link to="/shop" className="btn btn-primary btn-sm">Explore Shop</Link>
              </div>
            ) : (
              <div className="table-wrapper" style={{ marginTop: 0 }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Total</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      // Format Date
                      const dateObj = order.createdAt.seconds 
                        ? new Date(order.createdAt.seconds * 1000) 
                        : new Date(order.createdAt);
                      
                      return (
                        <tr key={order.orderId}>
                          <td style={{ fontWeight: 600, fontSize: '13px' }}>#{order.orderId.substring(0, 8)}...</td>
                          <td style={{ fontSize: '13px' }}>{dateObj.toLocaleDateString()}</td>
                          <td>
                            <span className={`status-badge ${getStatusClass(order.orderStatus)}`}>
                              {order.orderStatus}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>${order.total.toFixed(2)}</td>
                          <td>
                            <button 
                              onClick={() => setSelectedOrder(order)}
                              className="btn btn-outline-brand btn-sm"
                              style={{ padding: '4px 8px', fontSize: '11px', textTransform: 'capitalize' }}
                            >
                              Open Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* C. ORDER DETAILS OVERLAY MODAL */}
      {selectedOrder && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          backgroundColor: 'rgba(44,42,41,0.6)', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          zIndex: 1000,
          padding: '24px'
        }}>
          <div style={{ 
            backgroundColor: '#FFFFFF', 
            borderRadius: '4px', 
            width: '100%', 
            maxWidth: '680px', 
            maxHeight: '90vh', 
            overflowY: 'auto',
            padding: '32px',
            boxShadow: 'var(--shadow-md)',
            position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '22px', fontFamily: 'var(--font-serif)', margin: 0 }}>Order Details</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  ID: #{selectedOrder.orderId}
                </p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </div>

            {/* Date & Status Meta */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', backgroundColor: 'var(--brand-light)', padding: '16px', borderRadius: '4px', marginBottom: '24px', fontSize: '13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} color="var(--brand-primary)" />
                <span>
                  <strong>Date:</strong> {selectedOrder.createdAt.seconds 
                    ? new Date(selectedOrder.createdAt.seconds * 1000).toLocaleString() 
                    : new Date(selectedOrder.createdAt).toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="var(--brand-primary)" />
                <span>
                  <strong>Order Status:</strong>{' '}
                  <span className={`status-badge ${getStatusClass(selectedOrder.orderStatus)}`}>
                    {selectedOrder.orderStatus}
                  </span>
                </span>
              </div>
            </div>

            {/* Address Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px', fontSize: '13px' }}>
              <div>
                <h4 style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Shipping Address
                </h4>
                <p><strong>{selectedOrder.shippingAddress.name}</strong></p>
                <p>{selectedOrder.shippingAddress.addressLine}</p>
                <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}</p>
                <p>{selectedOrder.shippingAddress.country}</p>
              </div>
              <div>
                <h4 style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Billing & Contact
                </h4>
                <p><strong>Phone:</strong> {selectedOrder.customerPhone}</p>
                <p><strong>Email:</strong> {selectedOrder.customerEmail}</p>
                <p><strong>Payment Method:</strong> Cash on Delivery (COD)</p>
                <p><strong>Payment Status:</strong> {selectedOrder.paymentStatus}</p>
              </div>
            </div>

            {/* Items Breakdown Table */}
            <h4 style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Purchased Items
            </h4>
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden', marginBottom: '24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-main)' }}>
                    <th style={{ padding: '12px' }}>Item</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Price</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', border: '1px solid var(--border-color)', padding: '2px', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img src={item.image} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        </div>
                        <span style={{ fontWeight: 500 }}>{item.name}</span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>${item.purchasePrice.toFixed(2)}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>
                        ${(item.purchasePrice * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '13px', gap: '8px' }}>
              <div style={{ display: 'flex', width: '240px', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Items Subtotal:</span>
                <span>${selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', width: '240px', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Shipping Cost:</span>
                <span>{selectedOrder.shipping === 0 ? 'Free' : `$${selectedOrder.shipping.toFixed(2)}`}</span>
              </div>
              <div style={{ display: 'flex', width: '240px', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Local Tax:</span>
                <span>${selectedOrder.tax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', width: '240px', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '16px', fontWeight: 600 }}>
                <span>Order Total:</span>
                <span style={{ color: 'var(--brand-primary)' }}>${selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
