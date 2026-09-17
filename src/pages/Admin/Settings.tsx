import React, { useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth, getStoredAdminCredentials } from '../../context/AuthContext';
import { getStoreSettings, getCustomersList } from '../../services/db';
import type { StoreSettings, UserProfile } from '../../types';
import { formatPrice, getCurrencySymbol } from '../../utils/formatters';
import { 
  Settings as SettingsIcon, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Globe, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Shield, 
  Key, 
  UserCheck
} from 'lucide-react';

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
  const { updateAdminCredentials, updateUserCredentials } = useAuth();
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

  // ==========================================
  // SECURITY & CREDENTIALS STATE
  // ==========================================
  const [securityTarget, setSecurityTarget] = useState<'ADMIN' | 'USER'>('ADMIN');
  const [securitySaving, setSecuritySaving] = useState(false);
  const [securitySuccess, setSecuritySuccess] = useState('');
  const [securityError, setSecurityError] = useState('');

  // Admin Security fields
  const [adminUsername, setAdminUsername] = useState('');
  const [adminDisplayName, setAdminDisplayName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // User/Customer Security fields
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userConfirmPassword, setUserConfirmPassword] = useState('');
  const [showUserPassword, setShowUserPassword] = useState(false);

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

        // Initialize security admin credentials
        const creds = getStoredAdminCredentials();
        setAdminUsername(creds.username || 'admin');
        setAdminDisplayName(creds.name || 'Administrator');
        setAdminEmail(creds.email || 'admin@mahihandwoven.com');

        // Load users list for credentials management
        try {
          const customers = await getCustomersList();
          setUsersList(customers);
          if (customers.length > 0) {
            setSelectedUserId(customers[0].uid);
            setUserName(customers[0].name);
            setUserEmail(customers[0].email);
          }
        } catch (uErr) {
          console.error('Error fetching customers list:', uErr);
        }
      } catch (err) {
        console.error('Failed to load store settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettingsData();
  }, []);

  const handleUserSelect = (uid: string) => {
    setSelectedUserId(uid);
    const target = usersList.find(u => u.uid === uid);
    if (target) {
      setUserName(target.name);
      setUserEmail(target.email);
      setUserPassword('');
      setUserConfirmPassword('');
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecuritySaving(true);
    setSecuritySuccess('');
    setSecurityError('');

    try {
      if (securityTarget === 'ADMIN') {
        if (!adminUsername.trim()) {
          setSecurityError('Admin username / login handle cannot be empty.');
          setSecuritySaving(false);
          return;
        }
        if (!adminEmail.trim()) {
          setSecurityError('Admin email cannot be empty.');
          setSecuritySaving(false);
          return;
        }
        if (adminPassword) {
          if (adminPassword.length < 6) {
            setSecurityError('New password must be at least 6 characters long.');
            setSecuritySaving(false);
            return;
          }
          if (adminPassword !== adminConfirmPassword) {
            setSecurityError('Passwords do not match. Please verify both fields.');
            setSecuritySaving(false);
            return;
          }
        }

        await updateAdminCredentials({
          username: adminUsername.trim(),
          name: adminDisplayName.trim() || 'Administrator',
          email: adminEmail.trim(),
          password: adminPassword ? adminPassword.trim() : undefined
        });

        setSecuritySuccess('Admin credentials and password updated permanently!');
        setAdminPassword('');
        setAdminConfirmPassword('');
      } else {
        if (!selectedUserId) {
          setSecurityError('Please select a user account to update.');
          setSecuritySaving(false);
          return;
        }
        if (!userName.trim()) {
          setSecurityError('User name cannot be empty.');
          setSecuritySaving(false);
          return;
        }
        if (userPassword) {
          if (userPassword.length < 6) {
            setSecurityError('New password must be at least 6 characters long.');
            setSecuritySaving(false);
            return;
          }
          if (userPassword !== userConfirmPassword) {
            setSecurityError('Passwords do not match. Please verify both fields.');
            setSecuritySaving(false);
            return;
          }
        }

        await updateUserCredentials(selectedUserId, {
          name: userName.trim(),
          email: userEmail.trim(),
          password: userPassword ? userPassword.trim() : undefined
        });

        setUsersList(prev => prev.map(u => u.uid === selectedUserId ? { ...u, name: userName.trim(), email: userEmail.trim() } : u));
        setSecuritySuccess(`User "${userName}" credentials updated permanently!`);
        setUserPassword('');
        setUserConfirmPassword('');
      }
      setTimeout(() => setSecuritySuccess(''), 5000);
    } catch (err: any) {
      console.error(err);
      setSecurityError(err.message || 'Failed to update security credentials.');
    } finally {
      setSecuritySaving(false);
    }
  };

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
  const restWords = storeName.split(' ').slice(1).join(' ') || 'HANDWOVEN';

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
                placeholder="e.g. Mahi Handwoven" 
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

        {/* ========================================== */}
        {/* SECTION 4: SECURITY & CREDENTIALS CARD     */}
        {/* ========================================== */}
        <div style={{ 
          backgroundColor: '#FFFFFF', 
          padding: '28px', 
          borderRadius: '6px', 
          border: '1px solid var(--border-color)', 
          boxShadow: 'var(--shadow-sm)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Shield size={20} color="var(--brand-primary)" /> Security & Account Credentials
            </h3>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: 600, 
              backgroundColor: 'rgba(200, 122, 83, 0.1)', 
              color: 'var(--brand-primary)', 
              padding: '4px 10px', 
              borderRadius: '20px', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em' 
            }}>
              Permanent Updates
            </span>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Permanently modify the login usernames, display names, and access passwords for the administrator or registered customer accounts.
          </p>

          {/* Security Feedback Banners */}
          {securitySuccess && (
            <div style={{ 
              backgroundColor: '#D1FAE5', 
              color: '#065F46', 
              border: '1px solid #A7F3D0',
              padding: '14px 18px', 
              borderRadius: '6px', 
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <CheckCircle2 size={18} color="#059669" />
              <span style={{ fontSize: '13px', fontWeight: 500 }}>{securitySuccess}</span>
            </div>
          )}

          {securityError && (
            <div className="error-banner" style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <AlertCircle size={16} /> {securityError}
            </div>
          )}

          {/* Target Account Mode Switcher */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
            <button
              type="button"
              onClick={() => {
                setSecurityTarget('ADMIN');
                setSecurityError('');
                setSecuritySuccess('');
              }}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '6px',
                border: securityTarget === 'ADMIN' ? '2px solid var(--brand-primary)' : '1px solid var(--border-color)',
                backgroundColor: securityTarget === 'ADMIN' ? 'rgba(200, 122, 83, 0.08)' : '#FAFAF9',
                color: securityTarget === 'ADMIN' ? 'var(--brand-primary)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <Shield size={16} /> Admin Account Credentials
            </button>

            <button
              type="button"
              onClick={() => {
                setSecurityTarget('USER');
                setSecurityError('');
                setSecuritySuccess('');
              }}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '6px',
                border: securityTarget === 'USER' ? '2px solid var(--brand-primary)' : '1px solid var(--border-color)',
                backgroundColor: securityTarget === 'USER' ? 'rgba(200, 122, 83, 0.08)' : '#FAFAF9',
                color: securityTarget === 'USER' ? 'var(--brand-primary)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <UserCheck size={16} /> Registered User / Customer
            </button>
          </div>

          {/* Target: ADMIN CREDENTIALS */}
          {securityTarget === 'ADMIN' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Admin Username / Login ID *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={adminUsername}
                    onChange={e => setAdminUsername(e.target.value)}
                    required
                    placeholder="e.g. admin"
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Used as the username login identifier.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Admin Display Name *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={adminDisplayName}
                    onChange={e => setAdminDisplayName(e.target.value)}
                    required
                    placeholder="e.g. Administrator"
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Displayed in top navigation & session controls.
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Admin Email Address *
                </label>
                <input
                  type="email"
                  className="input-field"
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  required
                  placeholder="admin@mahihandwoven.com"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    New Admin Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      className="input-field"
                      value={adminPassword}
                      onChange={e => setAdminPassword(e.target.value)}
                      placeholder="Leave blank to keep current password"
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword(!showAdminPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)'
                      }}
                    >
                      {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Confirm New Admin Password
                  </label>
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    className="input-field"
                    value={adminConfirmPassword}
                    onChange={e => setAdminConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '6px' }}>
                <button
                  type="button"
                  disabled={securitySaving}
                  onClick={handleSecuritySubmit}
                  className="btn btn-primary"
                  style={{
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Key size={15} /> {securitySaving ? 'Saving...' : 'Save Admin Credentials Permanently'}
                </button>
              </div>
            </div>
          )}

          {/* Target: USER / CUSTOMER CREDENTIALS */}
          {securityTarget === 'USER' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Select User / Customer Account *
                </label>
                <select
                  className="input-field"
                  value={selectedUserId}
                  onChange={e => handleUserSelect(e.target.value)}
                >
                  {usersList.length === 0 ? (
                    <option value="">No registered accounts found</option>
                  ) : (
                    usersList.map(u => (
                      <option key={u.uid} value={u.uid}>
                        {u.name} ({u.email}) — {u.role}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {selectedUserId && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>
                        User Full Name *
                      </label>
                      <input
                        type="text"
                        className="input-field"
                        value={userName}
                        onChange={e => setUserName(e.target.value)}
                        required
                        placeholder="User Full Name"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>
                        User Email Address *
                      </label>
                      <input
                        type="email"
                        className="input-field"
                        value={userEmail}
                        onChange={e => setUserEmail(e.target.value)}
                        required
                        placeholder="user@example.com"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>
                        Set New User Password
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showUserPassword ? 'text' : 'password'}
                          className="input-field"
                          value={userPassword}
                          onChange={e => setUserPassword(e.target.value)}
                          placeholder="Leave blank to keep current password"
                          style={{ paddingRight: '40px' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowUserPassword(!showUserPassword)}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)'
                          }}
                        >
                          {showUserPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>
                        Confirm New User Password
                      </label>
                      <input
                        type={showUserPassword ? 'text' : 'password'}
                        className="input-field"
                        value={userConfirmPassword}
                        onChange={e => setUserConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '6px' }}>
                    <button
                      type="button"
                      disabled={securitySaving}
                      onClick={handleSecuritySubmit}
                      className="btn btn-primary"
                      style={{
                        padding: '10px 20px',
                        fontSize: '13px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <Key size={15} /> {securitySaving ? 'Saving...' : 'Update User Credentials Permanently'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

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
