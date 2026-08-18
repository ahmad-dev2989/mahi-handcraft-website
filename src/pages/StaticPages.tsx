import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';

// ==========================================
// 1. OUR STORY PAGE
// ==========================================
export const OurStory: React.FC = () => {
  return (
    <div style={{ padding: '60px 0' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '16px' }}>Our Philosophy</h1>
        <p style={{ 
          fontStyle: 'italic', 
          fontSize: '18px', 
          color: 'var(--brand-primary)', 
          textAlign: 'center', 
          marginBottom: '40px',
          fontFamily: 'var(--font-serif)'
        }}>
          "Preserving Craft, One Weave at a Time."
        </p>
        
        <div style={{ marginBottom: '40px' }}>
          <img 
            src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=1200" 
            alt="Handmade workshop" 
            style={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: '4px', marginBottom: '24px' }}
          />
          <h2 style={{ marginBottom: '12px' }}>Modern Traditions</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
            Mahi Handcraft was born out of a deep reverence for the traditional weaving and handicraft techniques of global artisans. In a world dominated by mass production and fast fashion, we aim to slow down and honor the physical labor, time, and history that goes into crafting handmade goods.
          </p>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
            Every weave, basket, clutch, and wall hanging in our shop is selected for its aesthetic and functional quality. We partner directly with artisan families, bypassing large distributors to ensure they receive fair wages and that local handicraft traditions continue to thrive.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', borderTop: '1px solid var(--border-color)', paddingTop: '40px' }}>
          <div>
            <h3 style={{ marginBottom: '8px' }}>100% Natural Fibers</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              We utilize locally harvested raffia, palm, natural wool, and organic linen to create timeless home decor and lifestyle accessories.
            </p>
          </div>
          <div>
            <h3 style={{ marginBottom: '8px' }}>Sustainable Sourcing</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Our materials are sourced using zero-waste techniques, ensuring that each product is fully biodegradable and leaf-to-clutch tracing is preserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


// ==========================================
// 2. CONTACT PAGE
// ==========================================
export const Contact: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Store contact submissions in Firestore
      await addDoc(collection(db, 'contacts'), {
        ...formData,
        createdAt: new Date(),
        status: 'new'
      });
      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      console.error(err);
      setError('Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '60px 0' }}>
      <div className="container">
        <h1 style={{ textAlign: 'center', marginBottom: '40px' }}>Contact Us</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '48px' }}>
          {/* Contact Details */}
          <div>
            <h2 style={{ marginBottom: '16px' }}>Get In Touch</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
              Have questions about our artisan products, custom bulk orders, or shipping timelines? Drop us a line and our small support team will get back to you shortly.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ color: 'var(--brand-primary)' }}><Mail size={24} /></div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600 }}>Email Address</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>support@mahihandcraft.com</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ color: 'var(--brand-primary)' }}><Phone size={24} /></div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600 }}>Phone Number</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>+1 (555) 019-2834</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ color: 'var(--brand-primary)' }}><MapPin size={24} /></div>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600 }}>Artisan Workshop</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>148 Craft Avenue, Suite 10, Portland, OR</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div style={{ backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ marginBottom: '24px' }}>Send a Message</h3>
            
            {success ? (
              <div className="loading-container" style={{ padding: '24px 0' }}>
                <CheckCircle size={48} color="var(--success)" />
                <h4 style={{ marginTop: '12px' }}>Message Sent!</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center' }}>
                  Thank you for reaching out. We will review your inquiry and email you within 24 hours.
                </p>
                <button onClick={() => setSuccess(false)} className="btn btn-secondary btn-sm" style={{ marginTop: '16px' }}>Send Another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                {error && <div className="error-banner">{error}</div>}
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="Jane Doe"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input 
                      type="email" 
                      className="input-field" 
                      placeholder="jane@example.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Inquiry about artisan bags..."
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Message Details</label>
                  <textarea 
                    className="input-field" 
                    rows={5}
                    placeholder="Enter your questions here..."
                    style={{ resize: 'vertical' }}
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%' }}>
                  {loading ? 'Sending...' : <><Send size={16} /> Send Message</>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


// ==========================================
// 3. PRIVACY POLICY PAGE
// ==========================================
export const PrivacyPolicy: React.FC = () => {
  return (
    <div style={{ padding: '60px 0' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <h1 style={{ marginBottom: '24px' }}>Privacy Policy</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Last updated: August 18, 2026</p>
        <p style={{ marginBottom: '16px' }}>
          This Privacy Policy describes how Mahi Handcraft ("we", "us", or "our") collects, uses, and shares your personal information when you visit or make a purchase from our website.
        </p>
        <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px' }}>1. Information We Collect</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
          When you make a purchase or attempt to register an account, we collect certain information from you, including your name, billing address, shipping address, payment method information (Cash on Delivery), email address, and phone number.
        </p>
        <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px' }}>2. How We Use Your Information</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
          We use the Order Information that we collect generally to fulfill any orders placed through the Site (including processing your delivery details, arranging for shipping, and providing you with invoices and/or order confirmations). Additionally, we use this Order Information to communicate with you and screen our orders for potential risk or fraud.
        </p>
        <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px' }}>3. Data Security</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
          We store all customer profiles and order histories securely inside Google Cloud Firestore. We utilize Firebase Authentication for secure email/password account management, ensuring that your password is never stored or read in plain text.
        </p>
      </div>
    </div>
  );
};


// ==========================================
// 4. TERMS & CONDITIONS PAGE
// ==========================================
export const Terms: React.FC = () => {
  return (
    <div style={{ padding: '60px 0' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <h1 style={{ marginBottom: '24px' }}>Terms & Conditions</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>Last updated: August 18, 2026</p>
        <p style={{ marginBottom: '16px' }}>
          Welcome to Mahi Handcraft. By accessing or using our website, you agree to comply with and be bound by the following terms and conditions.
        </p>
        <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px' }}>1. E-Commerce Deliveries</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
          We operate primary storefront transactions through Cash on Delivery (COD). By placing an order, you agree to receive our delivery courier and pay the final order total (comprising subtotals, local delivery/shipping cost, and tax fees) in cash upon physical receipt of the products.
        </p>
        <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px' }}>2. Intellectual Property</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
          All content included on this site, such as designs, product text descriptions, images, graphics, and logos, is the property of Mahi Handcraft and protected by international copyright laws.
        </p>
      </div>
    </div>
  );
};


// ==========================================
// 5. SHIPPING POLICY PAGE
// ==========================================
export const Shipping: React.FC = () => {
  return (
    <div style={{ padding: '60px 0' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <h1 style={{ marginBottom: '24px' }}>Shipping Policy</h1>
        <p style={{ marginBottom: '16px' }}>
          We hand-pack and dispatch all order items from our local workshop.
        </p>
        <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px' }}>Processing Times</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
          Because our products are handcrafted by individual artisans, please allow <strong>1-3 business days</strong> for order confirmation and packaging processing before your items are shipped.
        </p>
        <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px' }}>Shipping Rates & Delivery</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
          We charge a flat shipping rate determined by our store settings (usually $15). We offer free local shipping for orders above $75. Average delivery times range from <strong>3-7 business days</strong> depending on your region.
        </p>
      </div>
    </div>
  );
};


// ==========================================
// 6. RETURNS & REFUND POLICY PAGE
// ==========================================
export const Returns: React.FC = () => {
  return (
    <div style={{ padding: '60px 0' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <h1 style={{ marginBottom: '24px' }}>Returns & Refunds Policy</h1>
        <p style={{ marginBottom: '16px' }}>
          We want you to love your handmade pieces. If you are not completely satisfied, we are here to help.
        </p>
        <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px' }}>30-Day Return Window</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
          You can request a return within <strong>30 days</strong> of receiving your delivery. To be eligible for a return, your item must be unused, in the same condition that you received it, and in its original packaging.
        </p>
        <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '12px' }}>How to Return</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
          Please email our support team at <strong>support@mahihandcraft.com</strong> with your Order ID and photos of the item. Once approved, we will provide instructions for shipping the item back to our workshop. Refunds will be issued back to you once the item has been inspected.
        </p>
      </div>
    </div>
  );
};
