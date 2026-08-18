import React, { useEffect, useState } from 'react';
import { getStoreSettings, updateStoreSettings } from '../../services/db';
import type { StoreSettings } from '../../types';
import { Settings as SettingsIcon, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export const Settings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [storeName, setStoreName] = useState('');
  const [storeEmail, setStoreEmail] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [shippingCost, setShippingCost] = useState<number>(15);
  const [taxRate, setTaxRate] = useState<number>(5);
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [pinterest, setPinterest] = useState('');
  const [twitter, setTwitter] = useState('');

  useEffect(() => {
    const fetchSettingsData = async () => {
      setLoading(true);
      try {
        const data = await getStoreSettings();
        if (data) {
          setStoreName(data.storeName || '');
          setStoreEmail(data.storeEmail || '');
          setStorePhone(data.storePhone || '');
          setCurrency(data.currency || 'USD');
          setShippingCost(data.shippingCost ?? 15);
          setTaxRate(data.taxRate ?? 5);
          setInstagram(data.socialLinks?.instagram || '');
          setFacebook(data.socialLinks?.facebook || '');
          setPinterest(data.socialLinks?.pinterest || '');
          setTwitter(data.socialLinks?.twitter || '');
        }
      } catch (err) {
        console.error('Failed to load store settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettingsData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setErrorMsg('');

    // Field validation
    if (!storeName || !storeEmail || shippingCost < 0 || taxRate < 0) {
      setErrorMsg('Please enter valid settings. Shipping fee and tax percentage cannot be negative.');
      setSaving(false);
      return;
    }

    try {
      const settingsPayload: StoreSettings = {
        storeName,
        storeEmail,
        storePhone,
        currency,
        shippingCost,
        taxRate,
        socialLinks: {
          instagram,
          facebook,
          pinterest,
          twitter
        }
      };

      await updateStoreSettings(settingsPayload);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to update settings in database.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading store configurations...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '640px' }}>
      
      {/* Success banner */}
      {success && (
        <div style={{ 
          backgroundColor: '#D1FAE5', 
          color: '#065F46', 
          border: '1px solid #A7F3D0',
          padding: '16px 20px', 
          borderRadius: '4px', 
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={18} />
          <span>Store settings saved successfully!</span>
        </div>
      )}

      {/* Error banner */}
      {errorMsg && <div className="error-banner" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertCircle size={16} />{errorMsg}</div>}

      <form onSubmit={handleSubmit} style={{ backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '4px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '24px' }}>
          <SettingsIcon size={18} color="var(--brand-primary)" /> Store Configuration
        </h3>

        {/* Section 1: Basic Info */}
        <div className="form-group">
          <label className="form-label">Store Brand Name *</label>
          <input 
            type="text" 
            className="input-field" 
            value={storeName} 
            onChange={e => setStoreName(e.target.value)} 
            required 
            placeholder="e.g. Mahi Handcraft" 
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Store Contact Email *</label>
            <input 
              type="email" 
              className="input-field" 
              value={storeEmail} 
              onChange={e => setStoreEmail(e.target.value)} 
              required 
              placeholder="contact@mahihandcraft.com" 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Store Contact Phone</label>
            <input 
              type="tel" 
              className="input-field" 
              value={storePhone} 
              onChange={e => setStorePhone(e.target.value)} 
              placeholder="+1 (555) 019-2834" 
            />
          </div>
        </div>

        {/* Section 2: Pricing, Delivery & Tax Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '12px' }}>
          <div className="form-group">
            <label className="form-label">Currency Symbol *</label>
            <select 
              value={currency} 
              onChange={e => setCurrency(e.target.value)} 
              className="input-field"
            >
              <option value="USD">USD ($)</option>
              <option value="CAD">CAD ($)</option>
              <option value="GBP">GBP (£)</option>
              <option value="EUR">EUR (€)</option>
              <option value="AUD">AUD ($)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Flat Shipping Fee ($) *</label>
            <input 
              type="number" 
              min={0}
              className="input-field" 
              value={shippingCost} 
              onChange={e => setShippingCost(Number(e.target.value))} 
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Est. Tax Rate (%) *</label>
            <input 
              type="number" 
              min={0}
              step="0.1"
              className="input-field" 
              value={taxRate} 
              onChange={e => setTaxRate(Number(e.target.value))} 
              required 
            />
          </div>
        </div>

        {/* Section 3: Social Links */}
        <h4 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '20px 0 12px 0', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          Social Media Handles
        </h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Instagram Link</label>
            <input 
              type="url" 
              className="input-field" 
              value={instagram} 
              onChange={e => setInstagram(e.target.value)} 
              placeholder="https://instagram.com/mahi" 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Facebook Link</label>
            <input 
              type="url" 
              className="input-field" 
              value={facebook} 
              onChange={e => setFacebook(e.target.value)} 
              placeholder="https://facebook.com/mahi" 
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Pinterest Link</label>
            <input 
              type="url" 
              className="input-field" 
              value={pinterest} 
              onChange={e => setPinterest(e.target.value)} 
              placeholder="https://pinterest.com/mahi" 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Twitter Link</label>
            <input 
              type="url" 
              className="input-field" 
              value={twitter} 
              onChange={e => setTwitter(e.target.value)} 
              placeholder="https://twitter.com/mahi" 
            />
          </div>
        </div>

        {/* Action Button */}
        <button type="submit" disabled={saving} className="btn btn-primary" style={{ width: '100%', marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
          {saving ? 'Saving changes...' : <><Save size={16} /> Save Configurations</>}
        </button>

      </form>
    </div>
  );
};
