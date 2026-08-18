import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  runTransaction
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage, isMockMode } from '../lib/firebase';
import type { Product, Category, Order, OrderItem, OrderStatus, StoreSettings, UserProfile } from '../types';

// ==========================================
// MOCK DATA INITIAL SEEDS (Used in offline mode)
// ==========================================

const DEFAULT_MOCK_CATEGORIES: Category[] = [
  { id: 'cat-handbags', name: 'Handbags', slug: 'handbags', description: 'Ethically crafted straw and raffia tote bags.', createdAt: new Date().toISOString() },
  { id: 'cat-home', name: 'Home Accessories', slug: 'home-accessories', description: 'Artisan textile tapestries and basketry.', createdAt: new Date().toISOString() },
  { id: 'cat-traditional', name: 'Traditional Items', slug: 'traditional-items', description: 'Heritage hand fans and seasonal items.', createdAt: new Date().toISOString() }
];

const DEFAULT_MOCK_PRODUCTS: Product[] = [
  {
    id: 'multicolor-ruffled-hand-fan',
    name: 'Multicolor Ruffled Hand Fan',
    slug: 'multicolor-ruffled-hand-fan',
    description: 'A striking traditional fan hand-woven from colored palm leaves. Perfect as a handheld breeze provider or an elegant wall decoration.',
    shortDescription: 'Hand-woven palm leaf decorative ruff fan.',
    categoryId: 'cat-traditional',
    categoryName: 'Traditional Items',
    originalPrice: 60.00,
    salePrice: 45.00,
    images: ['https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&q=80&w=600'],
    mainImage: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&q=80&w=600',
    stockQuantity: 12,
    sku: 'FAN-RUFF-MUL',
    availability: 'in-stock',
    featured: true,
    bestSeller: true,
    newArrival: true,
    tags: ['fan', 'woven', 'palm', 'multicolor'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'artisan-market-tote',
    name: 'Artisan Market Tote',
    slug: 'artisan-market-tote',
    description: 'A spacious and highly durable tote bag made of high-quality raffia fibers. Features sturdy leather straps for carrying grocery items or beach essentials.',
    shortDescription: 'Spacious hand-woven raffia beach and market tote.',
    categoryId: 'cat-handbags',
    categoryName: 'Handbags',
    originalPrice: 85.00,
    salePrice: 65.00,
    images: ['https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600'],
    mainImage: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600',
    stockQuantity: 8,
    sku: 'TOTE-MKT-ART',
    availability: 'in-stock',
    featured: true,
    bestSeller: true,
    newArrival: false,
    tags: ['tote', 'raffia', 'handbag', 'market'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'geometric-wall-hanging',
    name: 'Geometric Wall Hanging',
    slug: 'geometric-wall-hanging',
    description: 'An intricate wall hanging featuring geometric patterns. Hand-spun from organic virgin wool and colored using plant-based pigments.',
    shortDescription: 'Intricate hand-spun organic virgin wool tapestry.',
    categoryId: 'cat-home',
    categoryName: 'Home Accessories',
    originalPrice: 120.00,
    salePrice: null,
    images: ['https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=600'],
    mainImage: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=600',
    stockQuantity: 4,
    sku: 'WALL-GEO-TAP',
    availability: 'in-stock',
    featured: true,
    bestSeller: false,
    newArrival: true,
    tags: ['wall', 'hanging', 'wool', 'tapestry'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'raffia-clutch',
    name: 'Raffia Clutch',
    slug: 'raffia-clutch',
    description: 'A sleek, lightweight envelope clutch made of finely woven raffia. Ideal for evening gatherings or carrying daily travel items.',
    shortDescription: 'Elegant hand-woven envelope clutch with magnetic clasp.',
    categoryId: 'cat-handbags',
    categoryName: 'Handbags',
    originalPrice: 55.00,
    salePrice: null,
    images: ['https://images.unsplash.com/photo-1566150905458-1bf1fc15aae9?auto=format&fit=crop&q=80&w=600'],
    mainImage: 'https://images.unsplash.com/photo-1566150905458-1bf1fc15aae9?auto=format&fit=crop&q=80&w=600',
    stockQuantity: 15,
    sku: 'CLU-ENV-RAF',
    availability: 'in-stock',
    featured: false,
    bestSeller: true,
    newArrival: false,
    tags: ['clutch', 'raffia', 'purse', 'handbag'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'handwoven-basket',
    name: 'Handwoven Basket',
    slug: 'handwoven-basket',
    description: 'A sturdy, decorative utility basket woven from sweetgrass. Perfect for storing towels, keys, or highlighting organic greenery.',
    shortDescription: 'Sturdy sweetgrass basket with handles.',
    categoryId: 'cat-home',
    categoryName: 'Home Accessories',
    originalPrice: 75.00,
    salePrice: 50.00,
    images: ['https://images.unsplash.com/photo-1531835551805-16d864c8d311?auto=format&fit=crop&q=80&w=600'],
    mainImage: 'https://images.unsplash.com/photo-1531835551805-16d864c8d311?auto=format&fit=crop&q=80&w=600',
    stockQuantity: 0,
    sku: 'BSK-UTL-SWE',
    availability: 'out-of-stock',
    featured: false,
    bestSeller: false,
    newArrival: true,
    tags: ['basket', 'sweetgrass', 'storage'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const DEFAULT_MOCK_SETTINGS: StoreSettings = {
  storeName: 'Mahi Handcraft',
  storeEmail: 'contact@mahihandcraft.com',
  storePhone: '+1 (555) 019-2834',
  currency: 'USD',
  shippingCost: 15,
  taxRate: 5,
  socialLinks: {
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
    pinterest: 'https://pinterest.com',
    twitter: 'https://twitter.com'
  }
};


// ==========================================
// 1. IMAGE UPLOAD SERVICES
// ==========================================

export const uploadProductImage = async (file: File): Promise<string> => {
  if (isMockMode) {
    // Return local Base64 URL so the user can upload and test images offline!
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image.');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image size must be less than 5MB.');
  }

  const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  const storageRef = ref(storage, `products/${filename}`);
  
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type
  });
  
  return getDownloadURL(snapshot.ref);
};

export const deleteImageFromStorage = async (imageUrl: string): Promise<void> => {
  if (isMockMode) return; // No storage deletion needed offline
  try {
    if (imageUrl.includes('firebasestorage.googleapis.com')) {
      const storageRef = ref(storage, imageUrl);
      await deleteObject(storageRef);
    }
  } catch (error) {
    console.error('Failed to delete image from storage:', error);
  }
};


// ==========================================
// 2. CATEGORIES SERVICES
// ==========================================

export const getCategories = async (): Promise<Category[]> => {
  if (isMockMode) {
    const data = localStorage.getItem('mahi_mock_categories');
    if (!data) {
      localStorage.setItem('mahi_mock_categories', JSON.stringify(DEFAULT_MOCK_CATEGORIES));
      return DEFAULT_MOCK_CATEGORIES;
    }
    return JSON.parse(data) as Category[];
  }

  const querySnapshot = await getDocs(query(collection(db, 'categories'), orderBy('name')));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Category));
};

export const createCategory = async (category: Omit<Category, 'id' | 'createdAt'>): Promise<string> => {
  if (isMockMode) {
    const list = await getCategories();
    const id = `cat_${Date.now()}`;
    const newCat = { ...category, id, createdAt: new Date().toISOString() };
    list.push(newCat);
    localStorage.setItem('mahi_mock_categories', JSON.stringify(list));
    return id;
  }

  const docRef = await addDoc(collection(db, 'categories'), {
    ...category,
    createdAt: new Date()
  });
  return docRef.id;
};

export const updateCategory = async (id: string, category: Partial<Category>): Promise<void> => {
  if (isMockMode) {
    const list = await getCategories();
    const updated = list.map(c => c.id === id ? { ...c, ...category } : c);
    localStorage.setItem('mahi_mock_categories', JSON.stringify(updated));
    return;
  }
  await updateDoc(doc(db, 'categories', id), {
    ...category
  });
};

export const deleteCategory = async (id: string): Promise<void> => {
  if (isMockMode) {
    const list = await getCategories();
    const filtered = list.filter(c => c.id !== id);
    localStorage.setItem('mahi_mock_categories', JSON.stringify(filtered));
    return;
  }
  await deleteDoc(doc(db, 'categories', id));
};


// ==========================================
// 3. PRODUCTS SERVICES
// ==========================================

export const getProducts = async (): Promise<Product[]> => {
  if (isMockMode) {
    const data = localStorage.getItem('mahi_mock_products');
    if (!data) {
      localStorage.setItem('mahi_mock_products', JSON.stringify(DEFAULT_MOCK_PRODUCTS));
      return DEFAULT_MOCK_PRODUCTS;
    }
    // Parse products and sort by date descending
    const list = JSON.parse(data) as Product[];
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  const querySnapshot = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Product));
};

export const getProductBySlug = async (slug: string): Promise<Product | null> => {
  if (isMockMode) {
    const list = await getProducts();
    return list.find(p => p.slug === slug) || null;
  }

  const q = query(collection(db, 'products'), where('slug', '==', slug));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  const docSnap = querySnapshot.docs[0];
  return {
    id: docSnap.id,
    ...docSnap.data()
  } as Product;
};

export const createProduct = async (
  productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'images' | 'mainImage' | 'availability'>,
  imageFiles: File[],
  imageUrls: string[]
): Promise<string> => {
  if (isMockMode) {
    const uploadedUrls: string[] = [];
    for (const file of imageFiles) {
      const url = await uploadProductImage(file);
      uploadedUrls.push(url);
    }
    const allImages = [...uploadedUrls, ...imageUrls];
    if (allImages.length === 0) {
      throw new Error('At least one product image is required.');
    }

    const list = await getProducts();
    const id = productData.sku.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const newProduct: Product = {
      ...productData,
      id,
      images: allImages,
      mainImage: allImages[0],
      availability: productData.stockQuantity > 0 ? 'in-stock' : 'out-of-stock',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    list.push(newProduct);
    localStorage.setItem('mahi_mock_products', JSON.stringify(list));
    return id;
  }

  const uploadedUrls: string[] = [];
  for (const file of imageFiles) {
    const url = await uploadProductImage(file);
    uploadedUrls.push(url);
  }

  const allImages = [...uploadedUrls, ...imageUrls];
  if (allImages.length === 0) {
    throw new Error('At least one product image is required.');
  }

  const newDocRef = doc(collection(db, 'products'));
  const product: Product = {
    ...productData,
    id: newDocRef.id,
    images: allImages,
    mainImage: allImages[0],
    availability: productData.stockQuantity > 0 ? 'in-stock' : 'out-of-stock',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await setDoc(newDocRef, product);
  return newDocRef.id;
};

export const updateProduct = async (
  id: string,
  productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'images' | 'mainImage' | 'availability'>,
  newImageFiles: File[],
  remainingImages: string[],
  newImageUrls: string[]
): Promise<void> => {
  if (isMockMode) {
    const list = await getProducts();
    const newlyUploadedUrls: string[] = [];
    for (const file of newImageFiles) {
      const url = await uploadProductImage(file);
      newlyUploadedUrls.push(url);
    }
    const allImages = [...remainingImages, ...newlyUploadedUrls, ...newImageUrls];
    if (allImages.length === 0) {
      throw new Error('At least one product image is required.');
    }

    const updated = list.map(p => {
      if (p.id === id) {
        return {
          ...p,
          ...productData,
          images: allImages,
          mainImage: allImages[0],
          availability: productData.stockQuantity > 0 ? 'in-stock' : 'out-of-stock',
          updatedAt: new Date().toISOString()
        } as Product;
      }
      return p;
    });
    localStorage.setItem('mahi_mock_products', JSON.stringify(updated));
    return;
  }

  const productRef = doc(db, 'products', id);
  const snap = await getDoc(productRef);
  if (!snap.exists()) throw new Error('Product not found.');
  const oldProduct = snap.data() as Product;

  const deletedImages = oldProduct.images.filter(img => !remainingImages.includes(img));
  for (const delImg of deletedImages) {
    await deleteImageFromStorage(delImg);
  }

  const newlyUploadedUrls: string[] = [];
  for (const file of newImageFiles) {
    const url = await uploadProductImage(file);
    newlyUploadedUrls.push(url);
  }

  const allImages = [...remainingImages, ...newlyUploadedUrls, ...newImageUrls];
  if (allImages.length === 0) {
    throw new Error('At least one product image is required.');
  }

  await updateDoc(productRef, {
    ...productData,
    images: allImages,
    mainImage: allImages[0],
    availability: productData.stockQuantity > 0 ? 'in-stock' : 'out-of-stock',
    updatedAt: new Date()
  });
};

export const deleteProduct = async (id: string): Promise<void> => {
  if (isMockMode) {
    const list = await getProducts();
    const filtered = list.filter(p => p.id !== id);
    localStorage.setItem('mahi_mock_products', JSON.stringify(filtered));
    return;
  }

  const productRef = doc(db, 'products', id);
  const snap = await getDoc(productRef);
  if (snap.exists()) {
    const product = snap.data() as Product;
    for (const imgUrl of product.images) {
      await deleteImageFromStorage(imgUrl);
    }
  }
  await deleteDoc(productRef);
};


// ==========================================
// 4. ORDERS & CHECKOUT SERVICES
// ==========================================

export const getOrders = async (customerId?: string): Promise<Order[]> => {
  if (isMockMode) {
    const data = localStorage.getItem('mahi_mock_orders') || '[]';
    const list = JSON.parse(data) as Order[];
    const sorted = list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (customerId) {
      return sorted.filter(o => o.customerId === customerId);
    }
    return sorted;
  }

  let q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  if (customerId) {
    q = query(collection(db, 'orders'), where('customerId', '==', customerId), orderBy('createdAt', 'desc'));
  }
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    orderId: doc.id,
    ...doc.data()
  } as Order));
};

export const getOrderById = async (orderId: string): Promise<Order | null> => {
  if (isMockMode) {
    const list = await getOrders();
    return list.find(o => o.orderId === orderId) || null;
  }

  const docSnap = await getDoc(doc(db, 'orders', orderId));
  if (!docSnap.exists()) return null;
  return {
    orderId: docSnap.id,
    ...docSnap.data()
  } as Order;
};

interface CheckoutItemInput {
  productId: string;
  quantity: number;
}

export const createOrder = async (
  customerId: string,
  customerDetails: { name: string; email: string; phone: string },
  shippingAddress: Order['shippingAddress'],
  itemsInput: CheckoutItemInput[]
): Promise<string> => {
  if (isMockMode) {
    const productsList = await getProducts();
    const settings = await getStoreSettings() || DEFAULT_MOCK_SETTINGS;
    
    const orderItems: OrderItem[] = [];
    let calculatedSubtotal = 0;

    // 1. Process items and decrement stock
    const updatedProducts = productsList.map(p => {
      const inputItem = itemsInput.find(input => input.productId === p.id);
      if (inputItem) {
        if (p.stockQuantity < inputItem.quantity) {
          throw new Error(`Insufficient stock for ${p.name}. Only ${p.stockQuantity} items left.`);
        }
        
        const price = p.salePrice !== null ? p.salePrice : p.originalPrice;
        calculatedSubtotal += price * inputItem.quantity;
        
        orderItems.push({
          productId: p.id,
          name: p.name,
          image: p.mainImage,
          quantity: inputItem.quantity,
          originalPrice: p.originalPrice,
          salePrice: p.salePrice,
          purchasePrice: price
        });

        const newStock = p.stockQuantity - inputItem.quantity;
        return {
          ...p,
          stockQuantity: newStock,
          availability: newStock > 0 ? 'in-stock' : 'out-of-stock',
          updatedAt: new Date().toISOString()
        } as Product;
      }
      return p;
    });

    // Save updated stock levels offline
    localStorage.setItem('mahi_mock_products', JSON.stringify(updatedProducts));

    // Calculate totals
    const shipping = calculatedSubtotal > 0 ? settings.shippingCost : 0;
    const tax = calculatedSubtotal * (settings.taxRate / 100);
    const total = calculatedSubtotal + shipping + tax;

    const orderId = `order_${Date.now()}`;
    const newOrder: Order = {
      orderId,
      customerId,
      customerName: customerDetails.name,
      customerEmail: customerDetails.email,
      customerPhone: customerDetails.phone,
      shippingAddress,
      items: orderItems,
      subtotal: calculatedSubtotal,
      shipping,
      tax,
      discount: 0,
      total,
      paymentMethod: 'COD',
      paymentStatus: 'Pending',
      orderStatus: 'Pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const ordersList = await getOrders();
    ordersList.push(newOrder);
    localStorage.setItem('mahi_mock_orders', JSON.stringify(ordersList));
    return orderId;
  }

  if (itemsInput.length === 0) throw new Error('Cart is empty.');

  const orderDocRef = doc(collection(db, 'orders'));

  return await runTransaction(db, async (transaction) => {
    const settingsDocRef = doc(db, 'storeSettings', 'settings');
    const settingsSnap = await transaction.get(settingsDocRef);
    const storeSettings = settingsSnap.exists() 
      ? (settingsSnap.data() as StoreSettings) 
      : { shippingCost: 15, taxRate: 5 };

    const productRefs = itemsInput.map(item => doc(db, 'products', item.productId));
    const productSnaps = await Promise.all(productRefs.map(ref => transaction.get(ref)));

    const orderItems: OrderItem[] = [];
    let calculatedSubtotal = 0;

    for (let i = 0; i < itemsInput.length; i++) {
      const input = itemsInput[i];
      const snap = productSnaps[i];

      if (!snap.exists()) {
        throw new Error(`Product with ID ${input.productId} does not exist.`);
      }

      const product = snap.data() as Product;

      if (product.stockQuantity < input.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Only ${product.stockQuantity} items left.`);
      }

      const actualPrice = product.salePrice !== null ? product.salePrice : product.originalPrice;
      calculatedSubtotal += actualPrice * input.quantity;

      orderItems.push({
        productId: product.id,
        name: product.name,
        image: product.mainImage,
        quantity: input.quantity,
        originalPrice: product.originalPrice,
        salePrice: product.salePrice,
        purchasePrice: actualPrice
      });

      const newStock = product.stockQuantity - input.quantity;
      transaction.update(doc(db, 'products', product.id), {
        stockQuantity: newStock,
        availability: newStock > 0 ? 'in-stock' : 'out-of-stock',
        updatedAt: new Date()
      });
    }

    const shipping = calculatedSubtotal > 0 ? storeSettings.shippingCost : 0;
    const tax = calculatedSubtotal * (storeSettings.taxRate / 100);
    const total = calculatedSubtotal + shipping + tax;

    const newOrder: Omit<Order, 'orderId'> = {
      customerId,
      customerName: customerDetails.name,
      customerEmail: customerDetails.email,
      customerPhone: customerDetails.phone,
      shippingAddress,
      items: orderItems,
      subtotal: calculatedSubtotal,
      shipping,
      tax,
      discount: 0,
      total,
      paymentMethod: 'COD',
      paymentStatus: 'Pending',
      orderStatus: 'Pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    transaction.set(orderDocRef, newOrder);
    return orderDocRef.id;
  });
};

export const updateOrderStatus = async (orderId: string, newStatus: OrderStatus): Promise<void> => {
  if (isMockMode) {
    const ordersList = await getOrders();
    const productsList = await getProducts();
    const order = ordersList.find(o => o.orderId === orderId);
    if (!order) throw new Error('Order not found.');
    const oldStatus = order.orderStatus;

    if (oldStatus === newStatus) return;

    // Check inventory returning transitions
    const wasInventoryDecremented = !['Cancelled', 'Refunded'].includes(oldStatus);
    const isNewStatusRefundingInventory = ['Cancelled', 'Refunded'].includes(newStatus);

    let updatedProducts = [...productsList];
    if (wasInventoryDecremented && isNewStatusRefundingInventory) {
      // Restore stock
      updatedProducts = productsList.map(p => {
        const item = order.items.find(i => i.productId === p.id);
        if (item) {
          const restoredStock = p.stockQuantity + item.quantity;
          return {
            ...p,
            stockQuantity: restoredStock,
            availability: 'in-stock',
            updatedAt: new Date().toISOString()
          } as Product;
        }
        return p;
      });
    } else if (!wasInventoryDecremented && !isNewStatusRefundingInventory) {
      // Re-decrement stock
      updatedProducts = productsList.map(p => {
        const item = order.items.find(i => i.productId === p.id);
        if (item) {
          if (p.stockQuantity < item.quantity) {
            throw new Error(`Cannot reactivate order. Product ${p.name} does not have enough stock.`);
          }
          const deductedStock = p.stockQuantity - item.quantity;
          return {
            ...p,
            stockQuantity: deductedStock,
            availability: deductedStock > 0 ? 'in-stock' : 'out-of-stock',
            updatedAt: new Date().toISOString()
          } as Product;
        }
        return p;
      });
    }

    // Save updated stock offline
    localStorage.setItem('mahi_mock_products', JSON.stringify(updatedProducts));

    // Update payment details automatically
    let paymentStatus = order.paymentStatus;
    if (newStatus === 'Delivered') {
      paymentStatus = 'Paid';
    } else if (newStatus === 'Refunded') {
      paymentStatus = 'Failed';
    }

    const updatedOrders = ordersList.map(o => {
      if (o.orderId === orderId) {
        return {
          ...o,
          orderStatus: newStatus,
          paymentStatus,
          updatedAt: new Date().toISOString()
        } as Order;
      }
      return o;
    });

    localStorage.setItem('mahi_mock_orders', JSON.stringify(updatedOrders));
    return;
  }

  const orderRef = doc(db, 'orders', orderId);

  await runTransaction(db, async (transaction) => {
    const orderSnap = await transaction.get(orderRef);
    if (!orderSnap.exists()) throw new Error('Order not found.');
    const order = orderSnap.data() as Order;
    const oldStatus = order.orderStatus;

    if (oldStatus === newStatus) return;

    const wasInventoryDecremented = !['Cancelled', 'Refunded'].includes(oldStatus);
    const isNewStatusRefundingInventory = ['Cancelled', 'Refunded'].includes(newStatus);

    if (wasInventoryDecremented && isNewStatusRefundingInventory) {
      for (const item of order.items) {
        const prodRef = doc(db, 'products', item.productId);
        const prodSnap = await transaction.get(prodRef);
        if (prodSnap.exists()) {
          const product = prodSnap.data() as Product;
          const restoredStock = product.stockQuantity + item.quantity;
          transaction.update(prodRef, {
            stockQuantity: restoredStock,
            availability: 'in-stock',
            updatedAt: new Date()
          });
        }
      }
    } 
    else if (!wasInventoryDecremented && !isNewStatusRefundingInventory) {
      for (const item of order.items) {
        const prodRef = doc(db, 'products', item.productId);
        const prodSnap = await transaction.get(prodRef);
        if (prodSnap.exists()) {
          const product = prodSnap.data() as Product;
          if (product.stockQuantity < item.quantity) {
            throw new Error(`Cannot reactivate order. Product ${product.name} does not have enough stock.`);
          }
          const deductedStock = product.stockQuantity - item.quantity;
          transaction.update(prodRef, {
            stockQuantity: deductedStock,
            availability: deductedStock > 0 ? 'in-stock' : 'out-of-stock',
            updatedAt: new Date()
          });
        }
      }
    }

    let paymentStatus = order.paymentStatus;
    if (newStatus === 'Delivered') {
      paymentStatus = 'Paid';
    } else if (newStatus === 'Refunded') {
      paymentStatus = 'Failed';
    }

    transaction.update(orderRef, {
      orderStatus: newStatus,
      paymentStatus,
      updatedAt: new Date()
    });
  });
};


// ==========================================
// 5. CUSTOMER & USER MANAGEMENT
// ==========================================

export const getCustomersList = async (): Promise<UserProfile[]> => {
  if (isMockMode) {
    const mockUsersRaw = localStorage.getItem('mahi_mock_users') || '[]';
    return JSON.parse(mockUsersRaw) as UserProfile[];
  }

  const querySnapshot = await getDocs(query(collection(db, 'users'), orderBy('name')));
  return querySnapshot.docs.map(doc => ({
    ...doc.data()
  } as UserProfile));
};


// ==========================================
// 6. STORE SETTINGS SERVICES
// ==========================================

export const getStoreSettings = async (): Promise<StoreSettings | null> => {
  if (isMockMode) {
    const data = localStorage.getItem('mahi_mock_settings');
    if (!data) {
      localStorage.setItem('mahi_mock_settings', JSON.stringify(DEFAULT_MOCK_SETTINGS));
      return DEFAULT_MOCK_SETTINGS;
    }
    return JSON.parse(data) as StoreSettings;
  }

  const docSnap = await getDoc(doc(db, 'storeSettings', 'settings'));
  if (!docSnap.exists()) return null;
  return docSnap.data() as StoreSettings;
};

export const updateStoreSettings = async (settings: StoreSettings): Promise<void> => {
  if (isMockMode) {
    localStorage.setItem('mahi_mock_settings', JSON.stringify(settings));
    return;
  }
  await setDoc(doc(db, 'storeSettings', 'settings'), settings);
};
