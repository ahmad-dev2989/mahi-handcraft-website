export interface ShippingAddress {
  name: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
  createdAt: any;
  updatedAt: any;
  phone?: string;
  shippingAddress?: ShippingAddress;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: any;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  categoryId: string;
  categoryName: string;
  originalPrice: number;
  salePrice: number | null; // null if no discount
  images: string[];
  mainImage: string;
  stockQuantity: number;
  sku: string;
  availability: 'in-stock' | 'out-of-stock';
  featured: boolean;
  bestSeller: boolean;
  newArrival: boolean;
  tags: string[];
  createdAt: any;
  updatedAt: any;
}

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  quantity: number;
  originalPrice: number;
  salePrice: number | null;
  purchasePrice: number; // Historical price when purchased
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Refunded';

export interface Order {
  orderId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'COD';
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  orderStatus: OrderStatus;
  createdAt: any;
  updatedAt: any;
}

export interface StoreSettings {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  currency: string;
  shippingCost: number;
  taxRate: number; // as percentage, e.g. 5 for 5%
  socialLinks: {
    instagram: string;
    facebook: string;
    pinterest: string;
    twitter: string;
  };
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
}
