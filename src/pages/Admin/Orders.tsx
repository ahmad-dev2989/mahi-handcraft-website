import React, { useEffect, useState } from 'react';
import { getOrders, updateOrderStatus } from '../../services/db';
import type { Order, OrderStatus } from '../../types';
import { 
  Search, 
  Eye, 
  Mail, 
  Phone, 
  MapPin, 
  DollarSign,
  AlertCircle,
  Clock,
  CheckCircle2
} from 'lucide-react';

export const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected Order Detail Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const loadOrdersList = async () => {
    setLoading(true);
    try {
      const list = await getOrders();
      setOrders(list);
    } catch (err) {
      console.error('Failed to load orders inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrdersList();
  }, []);

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingStatus(true);
    setStatusError('');
    setUpdateSuccess(false);

    try {
      // Calls updateOrderStatus service which runs a transaction to return stock if Cancelled/Refunded
      await updateOrderStatus(orderId, newStatus);
      
      // Update selected order details on screen
      const updatedList = await getOrders();
      setOrders(updatedList);
      const newOrderDetails = updatedList.find(o => o.orderId === orderId);
      if (newOrderDetails) {
        setSelectedOrder(newOrderDetails);
      }
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000);
    } catch (err: any) {
      console.error('Status transition failed:', err);
      setStatusError(err.message || 'Failed to update order status. Please check inventory levels.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadgeClass = (status: OrderStatus) => {
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

  // Filter orders locally
  const filteredOrders = orders.filter(order => {
    // Search
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      const matchId = order.orderId.toLowerCase().includes(s);
      const matchCust = order.customerName.toLowerCase().includes(s);
      if (!matchId && !matchCust) return false;
    }

    // Status filter
    if (statusFilter && order.orderStatus !== statusFilter) return false;

    return true;
  });

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ margin: 0, fontSize: '20px' }}>Order Records ({filteredOrders.length})</h3>
      </div>

      {/* Filter Row */}
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
        <div style={{ flexGrow: 1, minWidth: '200px', position: 'relative' }}>
          <input 
            type="text"
            className="input-field"
            placeholder="Search by Order ID or Customer name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '36px', paddingTop: '8px', paddingBottom: '8px' }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--text-muted)' }} />
        </div>

        <select 
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="input-field"
          style={{ width: '180px', padding: '8px' }}
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Refunded">Refunded</option>
        </select>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading customer orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 12px', backgroundColor: '#FFFFFF', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
          <p style={{ color: 'var(--text-muted)' }}>No customer orders match your query.</p>
        </div>
      ) : (
        <div className="table-wrapper" style={{ marginTop: 0 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Placement Date</th>
                <th>Payment Status</th>
                <th>Order Status</th>
                <th>Total Value</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(o => {
                const dateObj = o.createdAt.seconds 
                  ? new Date(o.createdAt.seconds * 1000) 
                  : new Date(o.createdAt);
                
                return (
                  <tr key={o.orderId}>
                    <td style={{ fontWeight: 600, fontSize: '13px' }}>#{o.orderId.substring(0, 8)}...</td>
                    <td>
                      <div>
                        <strong>{o.customerName}</strong>
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>{o.customerEmail}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '13px' }}>{dateObj.toLocaleDateString()} {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>
                      <span className={`status-badge ${o.paymentStatus === 'Paid' ? 'status-badge-delivered' : o.paymentStatus === 'Failed' ? 'status-badge-cancelled' : 'status-badge-pending'}`}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(o.orderStatus)}`}>
                        {o.orderStatus}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>${o.total.toFixed(2)}</td>
                    <td>
                      <button 
                        onClick={() => { setSelectedOrder(o); setStatusError(''); setUpdateSuccess(false); }}
                        className="btn btn-outline-brand btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px' }}
                      >
                        <Eye size={14} /> Open
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* C. SELECTED ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(44,42,41,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '24px' }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '4px', width: '100%', maxWidth: '780px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', position: 'relative' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '22px', fontFamily: 'var(--font-serif)' }}>Customer Order Management</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>ID: #{selectedOrder.orderId}</span>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
            </div>

            {/* Error notifications */}
            {statusError && <div className="error-banner" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={16} />{statusError}</div>}
            {updateSuccess && (
              <div style={{ backgroundColor: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0', padding: '12px 20px', borderRadius: '4px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <CheckCircle2 size={16} />
                <span>Order details and status saved successfully!</span>
              </div>
            )}

            {/* Status Modification Dashboard Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', backgroundColor: 'var(--brand-light)', padding: '20px', borderRadius: '4px', marginBottom: '24px' }}>
              
              {/* Left: Change Status Dropdown */}
              <div>
                <label className="form-label">Set Order Status</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select 
                    value={selectedOrder.orderStatus} 
                    onChange={e => handleStatusUpdate(selectedOrder.orderId, e.target.value as OrderStatus)}
                    disabled={updatingStatus}
                    className="input-field"
                    style={{ padding: '8px 12px', fontSize: '14px', flexGrow: 1 }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                  * Transitioning to 'Cancelled' or 'Refunded' automatically returns product stock to the inventory database.
                </span>
              </div>

              {/* Right: Payment details */}
              <div style={{ fontSize: '13px', borderLeft: '1px solid var(--border-color)', paddingLeft: '24px' }}>
                <h4 style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Transaction State</h4>
                <p style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <DollarSign size={16} color="var(--brand-primary)" />
                  <span><strong>Method:</strong> Cash on Delivery (COD)</span>
                </p>
                <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} color="var(--brand-primary)" />
                  <span><strong>Payment status:</strong> {selectedOrder.paymentStatus}</span>
                </p>
              </div>

            </div>

            {/* Customer Details Block */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '24px', fontSize: '13px' }}>
              <div>
                <h4 style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Customer Contact</h4>
                <p><strong>Name:</strong> {selectedOrder.customerName}</p>
                <p style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '4px 0' }}><Mail size={12} /> {selectedOrder.customerEmail}</p>
                <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={12} /> {selectedOrder.customerPhone}</p>
              </div>

              <div>
                <h4 style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Shipping Destination</h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <MapPin size={16} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--brand-primary)' }} />
                  <div>
                    <p><strong>{selectedOrder.shippingAddress.name}</strong></p>
                    <p>{selectedOrder.shippingAddress.addressLine}</p>
                    <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}</p>
                    <p>{selectedOrder.shippingAddress.country}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <h4 style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>Items Purchase Record</h4>
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden', marginBottom: '24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-main)' }}>
                    <th style={{ padding: '12px' }}>Product</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>SKU / ID</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Quantity</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Price snapshot</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', border: '1px solid var(--border-color)', padding: '2px', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <img src={item.image} alt={item.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        </div>
                        <span style={{ fontWeight: 500 }}>{item.name}</span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontFamily: 'monospace', fontSize: '11px' }}>{item.productId.substring(0, 10)}...</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>${item.purchasePrice.toFixed(2)}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>${(item.purchasePrice * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '13px', gap: '8px' }}>
              <div style={{ display: 'flex', width: '240px', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Items Subtotal:</span>
                <span>${selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', width: '240px', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Shipping cost:</span>
                <span>{selectedOrder.shipping === 0 ? 'Free' : `$${selectedOrder.shipping.toFixed(2)}`}</span>
              </div>
              <div style={{ display: 'flex', width: '240px', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Local Tax:</span>
                <span>${selectedOrder.tax.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', width: '240px', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '12px', fontSize: '16px', fontWeight: 600 }}>
                <span>Order Grand Total:</span>
                <span style={{ color: 'var(--brand-primary)' }}>${selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
