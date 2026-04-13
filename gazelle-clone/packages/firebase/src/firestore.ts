import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  QueryConstraint,
  DocumentData,
} from 'firebase/firestore';
import { db } from './config';
import { COLLECTIONS } from './constants';
import { Product, DeviceModel, TradeIn, Order, Review, User } from './types';

// Generic CRUD Operations
export const createDocument = async <T>(
  collectionName: string,
  data: T & { id?: string }
): Promise<string> => {
  const docRef = doc(collection(db, collectionName));
  const documentData = {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  await setDoc(docRef, documentData);
  return docRef.id;
};

export const getDocument = async <T>(collectionName: string, id: string): Promise<T | null> => {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T;
  }
  return null;
};

export const updateDocument = async <T>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<void> => {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
};

export const deleteDocument = async (collectionName: string, id: string): Promise<void> => {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
};

export const queryDocuments = async <T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> => {
  const q = query(collection(db, collectionName), ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
};

// Product Operations
export const getProducts = async (
  filters?: {
    category?: string;
    brand?: string;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
    featured?: boolean;
  },
  pageSize: number = 20,
  lastVisible?: any
): Promise<{ products: Product[]; lastVisible: any; hasMore: boolean }> => {
  const constraints: QueryConstraint[] = [];

  if (filters?.category) {
    constraints.push(where('category', '==', filters.category));
  }

  if (filters?.brand) {
    constraints.push(where('brand', '==', filters.brand));
  }

  if (filters?.condition) {
    constraints.push(where('condition', '==', filters.condition));
  }

  if (filters?.featured) {
    constraints.push(where('featured', '==', true));
  }

  constraints.push(orderBy('createdAt', 'desc'));
  constraints.push(limit(pageSize + 1));

  if (lastVisible) {
    constraints.push(startAfter(lastVisible));
  }

  const products = await queryDocuments<Product>(COLLECTIONS.PRODUCTS, constraints);

  let lastVisibleDoc = null;
  let hasMore = false;

  if (products.length > pageSize) {
    lastVisibleDoc = products[products.length - 1];
    products.pop();
    hasMore = true;
  }

  return { products, lastVisible: lastVisibleDoc, hasMore };
};

export const getProductBySku = async (sku: string): Promise<Product | null> => {
  const constraints = [where('sku', '==', sku)];
  const products = await queryDocuments<Product>(COLLECTIONS.PRODUCTS, constraints);
  return products.length > 0 ? products[0] : null;
};

// Device Model Operations (for Trade-In)
export const getDeviceModels = async (brand?: string, category?: string): Promise<DeviceModel[]> => {
  const constraints: QueryConstraint[] = [where('isActive', '==', true)];

  if (brand) {
    constraints.push(where('brand', '==', brand));
  }

  if (category) {
    constraints.push(where('category', '==', category));
  }

  return await queryDocuments<DeviceModel>(COLLECTIONS.DEVICE_MODELS, constraints);
};

export const getTradeInQuote = async (
  deviceId: string,
  condition: string
): Promise<number | null> => {
  const device = await getDocument<DeviceModel>(COLLECTIONS.DEVICE_MODELS, deviceId);
  if (!device) return null;

  const priceMap = device.conditionPrices;
  switch (condition) {
    case 'excellent':
      return priceMap.excellent;
    case 'good':
      return priceMap.good;
    case 'fair':
      return priceMap.fair;
    case 'broken':
      return priceMap.broken;
    default:
      return priceMap.good;
  }
};

// Trade-In Operations
export const createTradeIn = async (tradeInData: Omit<TradeIn, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  return await createDocument<TradeIn>(COLLECTIONS.TRADE_INS, tradeInData);
};

export const getUserTradeIns = async (userId: string): Promise<TradeIn[]> => {
  const constraints = [
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  ];
  return await queryDocuments<TradeIn>(COLLECTIONS.TRADE_INS, constraints);
};

export const updateTradeInStatus = async (
  tradeInId: string,
  status: TradeIn['status'],
  additionalData?: Partial<TradeIn>
): Promise<void> => {
  await updateDocument<TradeIn>(COLLECTIONS.TRADE_INS, tradeInId, {
    status,
    ...additionalData,
  });
};

// Order Operations
export const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  return await createDocument<Order>(COLLECTIONS.ORDERS, orderData);
};

export const getUserOrders = async (userId: string): Promise<Order[]> => {
  const constraints = [
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  ];
  return await queryDocuments<Order>(COLLECTIONS.ORDERS, constraints);
};

export const getOrderById = async (orderId: string): Promise<Order | null> => {
  return await getDocument<Order>(COLLECTIONS.ORDERS, orderId);
};

export const updateOrderStatus = async (
  orderId: string,
  status: Order['status'],
  additionalData?: Partial<Order>
): Promise<void> => {
  await updateDocument<Order>(COLLECTIONS.ORDERS, orderId, {
    status,
    ...additionalData,
  });
};

// Review Operations
export const createReview = async (reviewData: Omit<Review, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const reviewId = await createDocument<Review>(COLLECTIONS.REVIEWS, reviewData);
  
  // Update product rating
  const product = await getDocument<Product>(COLLECTIONS.PRODUCTS, reviewData.productId);
  if (product) {
    const newReviewCount = product.reviewCount + 1;
    const newRating = ((product.rating * product.reviewCount) + reviewData.rating) / newReviewCount;
    await updateDocument<Product>(COLLECTIONS.PRODUCTS, reviewData.productId, {
      rating: newRating,
      reviewCount: newReviewCount,
    });
  }
  
  return reviewId;
};

export const getProductReviews = async (productId: string): Promise<Review[]> => {
  const constraints = [
    where('productId', '==', productId),
    orderBy('createdAt', 'desc'),
  ];
  return await queryDocuments<Review>(COLLECTIONS.REVIEWS, constraints);
};

// User Operations
export const createUserProfile = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  return await createDocument<User>(COLLECTIONS.USERS, userData);
};

export const getUserProfile = async (userId: string): Promise<User | null> => {
  return await getDocument<User>(COLLECTIONS.USERS, userId);
};

export const updateUserProfile = async (userId: string, userData: Partial<User>): Promise<void> => {
  await updateDocument<User>(COLLECTIONS.USERS, userId, userData);
};

// Search Operations
export const searchProducts = async (searchTerm: string): Promise<Product[]> => {
  // Note: Firestore doesn't support full-text search natively
  // For production, integrate with Algolia or ElasticSearch
  const allProducts = await queryDocuments<Product>(COLLECTIONS.PRODUCTS, [
    where('isActive', '==', true),
  ]);
  
  const term = searchTerm.toLowerCase();
  return allProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(term) ||
      product.brand.toLowerCase().includes(term) ||
      product.model.toLowerCase().includes(term) ||
      product.description.toLowerCase().includes(term)
  );
};
