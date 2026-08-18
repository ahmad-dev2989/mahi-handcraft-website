import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Layouts
import { StoreLayout } from './layouts/StoreLayout';
import { AdminLayout } from './layouts/AdminLayout';

// Storefront Pages
import { Home } from './pages/Home';
import { Shop } from './pages/Shop';
import { ProductDetails } from './pages/ProductDetails';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { AuthPages } from './pages/AuthPages';
import { Account } from './pages/Account';

// Static Informational Pages
import { 
  OurStory, 
  Contact, 
  PrivacyPolicy, 
  Terms, 
  Shipping, 
  Returns 
} from './pages/StaticPages';

// Admin Pages
import { Dashboard } from './pages/Admin/Dashboard';
import { Products } from './pages/Admin/Products';
import { Orders } from './pages/Admin/Orders';
import { Customers } from './pages/Admin/Customers';
import { Settings } from './pages/Admin/Settings';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Customer Storefront Routes */}
            <Route path="/" element={<StoreLayout />}>
              <Route index element={<Home />} />
              <Route path="shop" element={<Shop />} />
              <Route path="products/:slug" element={<ProductDetails />} />
              <Route path="cart" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              
              {/* Authenticated Customer Routes */}
              <Route path="account" element={<Account />} />
              
              {/* Authentication Routes */}
              <Route path="login" element={<AuthPages />} />
              <Route path="signup" element={<Navigate to="/login" replace />} />
              <Route path="forgot-password" element={<Navigate to="/login" replace />} />
              
              {/* Static Informational Routes */}
              <Route path="our-story" element={<OurStory />} />
              <Route path="contact" element={<Contact />} />
              <Route path="privacy-policy" element={<PrivacyPolicy />} />
              <Route path="terms" element={<Terms />} />
              <Route path="shipping" element={<Shipping />} />
              <Route path="returns" element={<Returns />} />
            </Route>

            {/* Admin Management Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Products />} />
              <Route path="orders" element={<Orders />} />
              <Route path="customers" element={<Customers />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
