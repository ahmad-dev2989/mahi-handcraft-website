import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { CartItem, Product, StoreSettings } from '../types';

interface CartContextType {
  cartItems: CartItem[];
  settings: StoreSettings;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

const defaultSettings: StoreSettings = {
  storeName: 'Mahi Handcraft',
  storeEmail: 'contact@mahiframework.com',
  storePhone: '+1 (555) 019-2834',
  currency: 'USD',
  shippingCost: 15,
  taxRate: 5, // 5%
  socialLinks: {
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
    pinterest: 'https://pinterest.com',
    twitter: 'https://twitter.com'
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const localData = localStorage.getItem('mahi_cart');
    return localData ? JSON.parse(localData) : [];
  });
  
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem('mahi_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Load store settings dynamically from Firestore
  useEffect(() => {
    const settingsDocRef = doc(db, 'storeSettings', 'settings');
    
    // Set up a listener for settings changes
    const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as StoreSettings);
      } else {
        // If settings doc doesn't exist, create/initialize it with defaults
        setSettings(defaultSettings);
      }
    }, (error) => {
      console.error('Error listening to store settings:', error);
    });

    return unsubscribe;
  }, []);

  const addToCart = (product: Product, quantity: number) => {
    if (product.stockQuantity <= 0) return;

    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.productId === product.id);
      
      let newQuantity = quantity;
      if (existingItem) {
        newQuantity = existingItem.quantity + quantity;
      }
      
      // Cap at stock quantity
      if (newQuantity > product.stockQuantity) {
        newQuantity = product.stockQuantity;
      }

      if (existingItem) {
        return prevItems.map((item) => 
          item.productId === product.id 
            ? { ...item, quantity: newQuantity } 
            : item
        );
      } else {
        return [...prevItems, { productId: product.id, product, quantity: newQuantity }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCartItems((prevItems) => {
      const item = prevItems.find((i) => i.productId === productId);
      if (!item) return prevItems;

      let newQuantity = quantity;
      if (newQuantity <= 0) {
        return prevItems.filter((i) => i.productId !== productId);
      }

      // Cap at stock quantity
      if (newQuantity > item.product.stockQuantity) {
        newQuantity = item.product.stockQuantity;
      }

      return prevItems.map((i) => 
        i.productId === productId 
          ? { ...i, quantity: newQuantity } 
          : i
      );
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Calculations (Use salePrice if it exists, otherwise originalPrice)
  const subtotal = cartItems.reduce((acc, item) => {
    const price = item.product.salePrice !== null ? item.product.salePrice : item.product.originalPrice;
    return acc + price * item.quantity;
  }, 0);

  // If subtotal is 0, shipping is 0
  const shipping = subtotal > 0 ? settings.shippingCost : 0;
  const tax = subtotal * (settings.taxRate / 100);
  const total = subtotal + shipping + tax;

  const value = {
    cartItems,
    settings,
    subtotal,
    shipping,
    tax,
    total,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
