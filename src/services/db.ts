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
import { db, storage } from '../lib/firebase';
import type { Product, Category, Order, OrderItem, OrderStatus, StoreSettings, UserProfile } from '../types';

// ==========================================
// 1. IMAGE UPLOAD SERVICES
// ==========================================

export const uploadProductImage = async (file: File): Promise<string> => {
  // 1. Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image.');
  }

  // 2. Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image size must be less than 5MB.');
  }

  // Create a unique filename
  const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  const storageRef = ref(storage, `products/${filename}`);
  
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type
  });
  
  return getDownloadURL(snapshot.ref);
};

export const deleteImageFromStorage = async (imageUrl: string): Promise<void> => {
  try {
    // Only delete if it belongs to our Firebase Storage bucket
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
  const querySnapshot = await getDocs(query(collection(db, 'categories'), orderBy('name')));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Category));
};

export const createCategory = async (category: Omit<Category, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, 'categories'), {
    ...category,
    createdAt: new Date()
  });
  return docRef.id;
};

export const updateCategory = async (id: string, category: Partial<Category>): Promise<void> => {
  await updateDoc(doc(db, 'categories', id), {
    ...category
  });
};

export const deleteCategory = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'categories', id));
};


// ==========================================
// 3. PRODUCTS SERVICES
// ==========================================

export const getProducts = async (): Promise<Product[]> => {
  // Fetch all products, sorted by createdAt
  const querySnapshot = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Product));
};

export const getProductBySlug = async (slug: string): Promise<Product | null> => {
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
  // 1. Upload files
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
  // Get existing product to delete removed images from Storage
  const productRef = doc(db, 'products', id);
  const snap = await getDoc(productRef);
  if (!snap.exists()) throw new Error('Product not found.');
  const oldProduct = snap.data() as Product;

  // 1. Find deleted images
  const deletedImages = oldProduct.images.filter(img => !remainingImages.includes(img));
  for (const delImg of deletedImages) {
    await deleteImageFromStorage(delImg);
  }

  // 2. Upload new files
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
  const productRef = doc(db, 'products', id);
  const snap = await getDoc(productRef);
  if (snap.exists()) {
    const product = snap.data() as Product;
    // Delete all images in Storage
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
  if (itemsInput.length === 0) throw new Error('Cart is empty.');

  const orderDocRef = doc(collection(db, 'orders'));

  // Run transaction to read and update products & create the order
  return await runTransaction(db, async (transaction) => {
    // 1. Fetch Store Settings to get authoritative shipping cost and tax rate
    const settingsDocRef = doc(db, 'storeSettings', 'settings');
    const settingsSnap = await transaction.get(settingsDocRef);
    const storeSettings = settingsSnap.exists() 
      ? (settingsSnap.data() as StoreSettings) 
      : { shippingCost: 15, taxRate: 5 }; // default fallbacks

    // 2. Fetch and check all products
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

      // Validate stock availability
      if (product.stockQuantity < input.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Only ${product.stockQuantity} items left.`);
      }

      // Authoritative pricing check
      const actualPrice = product.salePrice !== null ? product.salePrice : product.originalPrice;
      calculatedSubtotal += actualPrice * input.quantity;

      orderItems.push({
        productId: product.id,
        name: product.name,
        image: product.mainImage,
        quantity: input.quantity,
        originalPrice: product.originalPrice,
        salePrice: product.salePrice,
        purchasePrice: actualPrice // Snapshot historical price
      });

      // Update product stock and availability
      const newStock = product.stockQuantity - input.quantity;
      transaction.update(doc(db, 'products', product.id), {
        stockQuantity: newStock,
        availability: newStock > 0 ? 'in-stock' : 'out-of-stock',
        updatedAt: new Date()
      });
    }

    // 3. Compute final totals authoritatively
    const shipping = calculatedSubtotal > 0 ? storeSettings.shippingCost : 0;
    const tax = calculatedSubtotal * (storeSettings.taxRate / 100);
    const total = calculatedSubtotal + shipping + tax;

    // Create order document data
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
      discount: 0, // Expandable for promo codes
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
  const orderRef = doc(db, 'orders', orderId);

  await runTransaction(db, async (transaction) => {
    const orderSnap = await transaction.get(orderRef);
    if (!orderSnap.exists()) throw new Error('Order not found.');
    const order = orderSnap.data() as Order;
    const oldStatus = order.orderStatus;

    if (oldStatus === newStatus) return;

    // Check if status is transitioning to Cancelled or Refunded
    const wasInventoryDecremented = !['Cancelled', 'Refunded'].includes(oldStatus);
    const isNewStatusRefundingInventory = ['Cancelled', 'Refunded'].includes(newStatus);

    if (wasInventoryDecremented && isNewStatusRefundingInventory) {
      // Return items to inventory
      for (const item of order.items) {
        const prodRef = doc(db, 'products', item.productId);
        const prodSnap = await transaction.get(prodRef);
        if (prodSnap.exists()) {
          const product = prodSnap.data() as Product;
          const restoredStock = product.stockQuantity + item.quantity;
          transaction.update(prodRef, {
            stockQuantity: restoredStock,
            availability: 'in-stock', // Return to stock
            updatedAt: new Date()
          });
        }
      }
    } 
    // If transitioning back from Cancelled/Refunded to an active status, re-decrement stock
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

    // Update payment status automatically for Delivered/Refunded
    let paymentStatus = order.paymentStatus;
    if (newStatus === 'Delivered') {
      paymentStatus = 'Paid';
    } else if (newStatus === 'Refunded') {
      paymentStatus = 'Failed'; // Or Refunded
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
  const querySnapshot = await getDocs(query(collection(db, 'users'), orderBy('name')));
  return querySnapshot.docs.map(doc => ({
    ...doc.data()
  } as UserProfile));
};


// ==========================================
// 6. STORE SETTINGS SERVICES
// ==========================================

export const getStoreSettings = async (): Promise<StoreSettings | null> => {
  const docSnap = await getDoc(doc(db, 'storeSettings', 'settings'));
  if (!docSnap.exists()) return null;
  return docSnap.data() as StoreSettings;
};

export const updateStoreSettings = async (settings: StoreSettings): Promise<void> => {
  await setDoc(doc(db, 'storeSettings', 'settings'), settings);
};
