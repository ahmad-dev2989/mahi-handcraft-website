import React, { useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext';
import { getStoreSettings } from '../../services/db';
import type { StoreSettings } from '../../types';
import { formatPrice, getCurrencySymbol } from '../../utils/formatters';
import { Settings as SettingsIcon, Save, CheckCircle2, AlertCircle, Globe, Eye, Sparkles } from 'lucide-react';

const COMMON_CURRENCIES = [
  { code: 'USD', label: 'USD ($) - US Dollar' },
  { code: 'EUR', label: 'EUR (€) - Euro' },
  { code: 'GBP', label: 'GBP (£) - British Pound' },
  { code: 'CAD', label: 'CAD ($) - Canadian Dollar' },
  { code: 'AUD', label: 'AUD ($) - Australian Dollar' },
  { code: 'INR', label: 'INR (₹) - Indian Rupee' },
  { code: 'PKR', label: 'PKR (Rs) - Pakistani Rupee' },
  { code: 'JPY', label: 'JPY (¥) - Japanese Yen' },
  { code: 'AED', label: 'AED - UAE Dirham' },
  { code: 'SAR', label: 'SAR - Saudi Riyal' },
  { code: 'CUSTOM', label: 'Custom Symbol / Code...' }
];

export const Settings: React.FC = () => {
  const { settings: currentSettings, updateSettings } = useCart();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [storeName, setStoreName] = useState('');
  const [storeEmail, setStoreEmail] = useState('');
  const [storePhone, setStorePhone] = useState('');
  
  // Currency fields
  const [currencyPreset, setCurrencyPreset] = useState('USD');
  const [customCurrency, setCustomCurrency] = useState('');

  // Delivery & Tax
  const [shippingCost, setShippingCost] = useState<number>(15);
  const [taxRate, setTaxRate] = useState<number>(5);

  // Social Links
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [pinterest, setPinterest] = useState('');
  const [twitter, setTwitter] = useState('');

  useEffect(() => {
    const fetchSettingsData = async () => {
      setLoading(true);
      try {
        const data = (await getStoreSettings()) || currentSettings;
        if (data) {
          setStoreName(data.storeName || '');
          setStoreEmail(data.storeEmail || '');
          setStorePhone(data.storePhone || '');
          
          const rawCurrency = data.currency || 'USD';
          const matchPreset = COMMON_CURRENCIES.find(c => c.code === rawCurrency);
          if (matchPreset && matchPreset.code !== 'CUSTOM') {
            setCurrencyPreset(matchPreset.code);
            setCustomCurrency('');
          } else {
            setCurrencyPreset('CUSTOM');
            setCustomCurrency(rawCurrency);
          }

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

  const activeCurrency = currencyPreset === 'CUSTOM' ? (customCurrency.trim() || 'USD') : currencyPreset;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setErrorMsg('');

    if (!storeName.trim()) {
      setErrorMsg('Store Brand Name cannot be empty.');
      setSaving(false);
      return;
    }

    if (!storeEmail.trim()) {
      setErrorMsg('Store Contact Email cannot be empty.');
      setSaving(false);
      return;
    }

    if (shippingCost < 0 || taxRate < 0) {
      setErrorMsg('Shipping fee and tax rate cannot be negative.');
      setSaving(false);
      return;
    }

    try {
      const settingsPayload: StoreSettings = {
        storeName: storeName.trim(),
        storeEmail: storeEmail.trim(),
        storePhone: storePhone.trim(),
        currency: activeCurrency,
        shippingCost,
        taxRate,
        socialLinks: {
          instagram,
          facebook,
          pinterest,
          twitter
        }
      };

      await updateSettings(settingsPayload);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
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

  // Splitting store name for logo preview
  const firstWord = storeName.split(' ')[0] || 'MAHI';
  const restWords = storeName.split(' ').slice(1).join(' ') || 'HANDCRAFT';

  return (
    <div style={{ maxWidth: '800px' }}>
      
      {/* Page Title */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <SettingsIcon size={24} color="var(--brand-primary)" /> Global Store Settings
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          Permanently update your website name, currency symbol, tax rules, and store contact details.
        </p>
      </div>

      {/* Success banner */}
      {success && (
        <div style={{ 
          backgroundColor: '#D1FAE5', 
          color: '#065F46', 
          border: '1px solid #A7F3D0',
          padding: '16px 20px', 
          borderRadius: '6px', 
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <CheckCircle2 size={20} color="#059669" />
          <div>
            <strong>Changes Saved Permanently!</strong>
            <p style={{ fontSize: '13px', margin: 0, marginTop: '2px' }}>
              Website name and currency have been updated dynamically across all storefront pages and products.
            </p>
          </div>
        </div>
      )}

      {/* Error banner */}
      {errorMsg && (
        <div className="error-banner" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        
        {/* ========================================== */}
        {/* SECTION 1: WEBSITE NAME & CURRENCY CARD    */}
        {/* ========================================== */}
        <div style={{ 
          backgroundColor: '#FFFFFF', 
          padding: '28px', 
          borderRadius: '6px', 
          border: '2px solid var(--brand-primary)', 
          boxShadow: '0 4px 12px rgba(200, 122, 83, 0.08)',
          position: 'relative'
        }}>
          <div style={{ 
            position: 'absolute', 
            top: '-12px', 
            left: '24px', 
            backgroundColor: 'var(--brand-primary)', 
            color: '#FFFFFF', 
            fontSize: '11px', 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            letterSpacing: '0.1em',
            padding: '2px 10px', 
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Sparkles size={12} /> Primary Website Identity
          </div>

          <h3 style={{ fontSize: '18px', marginBottom: '6px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Globe size={20} color="var(--brand-primary)" /> Website Name & Currency Configuration
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
            Changing these settings permanently changes the website brand title shown in headers, footers, meta tags, and sets the currency applied to all product catalog prices and cart totals.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            {/* Website Name Input */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                Website Brand Name *
              </label>
              <input 
                type="text" 
                className="input-field" 
                value={storeName} 
                onChange={e => setStoreName(e.target.value)} 
                required 
                placeholder="e.g. Mahi Handcraft" 
                style={{ fontSize: '15px', fontWeight: 500 }}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Replaces store title in header logo, footer, browser tab, emails, & static pages.
              </span>
            </div>

            {/* Website Currency Input */}
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 600 }}>
                Website Currency *
              </label>
              <select 
                value={currencyPreset} 
                onChange={e => setCurrencyPreset(e.target.value)} 
                className="input-field"
                style={{ fontSize: '14px' }}
              >
                {COMMON_CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>

              {currencyPreset === 'CUSTOM' && (
                <input 
                  type="text" 
                  className="input-field" 
                  value={customCurrency} 
                  onChange={e => setCustomCurrency(e.target.value)} 
                  placeholder="e.g. PKR, ₹, €, CHF, Rs" 
                  style={{ marginTop: '8px', fontSize: '14px' }}
                  required
                />
              )}

              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Active Symbol: <strong>"{getCurrencySymbol(activeCurrency)}"</strong> (Applied to all product prices across storefront)
              </span>
            </div>

          </div>

          {/* Real-time Interactive Preview Box */}
          <div style={{ 
            backgroundColor: '#FAF7F2', 
            border: '1px solid #E5DEC9', 
            borderRadius: '6px', 
            padding: '16px 20px', 
            marginTop: '20px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
              <Eye size={14} /> Real-Time Storefront Live Preview
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', fontSize: '13px' }}>
              
              {/* Preview 1: Logo */}
              <div style={{ backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Header Logo Preview</span>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {firstWord} <span style={{ color: 'var(--brand-primary)' }}>{restWords}</span>
                </span>
              </div>

              {/* Preview 2: Product Price */}
              <div style={{ backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Product Tag Preview</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <strong style={{ fontSize: '16px', color: 'var(--brand-primary)' }}>{formatPrice(45.00, activeCurrency)}</strong>
                  <span style={{ fontSize: '12px', textDecoration: 'line-through', color: 'var(--text-muted)' }}>{formatPrice(60.00, activeCurrency)}</span>
                </div>
              </div>

              {/* Preview 3: Cart Total */}
              <div style={{ backgroundColor: '#FFFFFF', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Checkout Total Preview</span>
                <strong style={{ fontSize: '16px', color: 'var(--text-main)' }}>Total: {formatPrice(125.00, activeCurrency)}</strong>
              </div>

            </div>
          </div>

        </div>

        {/* ========================================== */}
        {/* SECTION 2: CONTACT & SHIPPING / TAX DETAILS */}
        {/* ========================================== */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '28px', borderRadius: '6px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            Store Contact & Order Fulfillment Rates
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">Store Contact Email *</label>
              <input 
                type="email" 
                className="input-field" 
                value={storeEmail} 
                onChange={e => setStoreEmail(e.target.value)} 
                required 
                placeholder="contact@example.com" 
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Flat Shipping Fee ({getCurrencySymbol(activeCurrency)}) *</label>
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
              <label className="form-label">Estimated Tax Rate (%) *</label>
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
        </div>

        {/* ========================================== */}
        {/* SECTION 3: SOCIAL MEDIA LINKS              */}
        {/* ========================================== */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '28px', borderRadius: '6px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            Social Media Links
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group">
              <label className="form-label">Instagram URL</label>
              <input 
                type="url" 
                className="input-field" 
                value={instagram} 
                onChange={e => setInstagram(e.target.value)} 
                placeholder="https://instagram.com/yourstore" 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Facebook URL</label>
              <input 
                type="url" 
                className="input-field" 
                value={facebook} 
                onChange={e => setFacebook(e.target.value)} 
                placeholder="https://facebook.com/yourstore" 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Pinterest URL</label>
              <input 
                type="url" 
                className="input-field" 
                value={pinterest} 
                onChange={e => setPinterest(e.target.value)} 
                placeholder="https://pinterest.com/yourstore" 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Twitter / X URL</label>
              <input 
                type="url" 
                className="input-field" 
                value={twitter} 
                onChange={e => setTwitter(e.target.value)} 
                placeholder="https://twitter.com/yourstore" 
              />
            </div>
          </div>
        </div>

        {/* Action Submit Button */}
        <button 
          type="submit" 
          disabled={saving} 
          className="btn btn-primary" 
          style={{ 
            padding: '14px 24px', 
            fontSize: '15px', 
            fontWeight: 600, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '10px',
            boxShadow: 'var(--shadow-md)' 
          }}
        >
          {saving ? 'Saving changes...' : <><Save size={18} /> Save Website Name & Settings</>}
        </button>

      </form>
    </div>
  );
};
