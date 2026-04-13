import { Timestamp } from 'firebase/firestore';
import { DeviceCondition, TradeInStatus, PaymentMethod } from './constants';

// User Profile
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'customer' | 'admin' | 'support';
  avatarUrl?: string;
  addresses: Address[];
  paymentMethods: PaymentMethod[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  emailVerified: boolean;
  lastLoginAt?: Timestamp;
}

// Address
export interface Address {
  id: string;
  type: 'home' | 'work' | 'other';
  street: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

// Product (Refurbished Device for Sale)
export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  description: string;
  condition: 'excellent' | 'good' | 'fair';
  price: number;
  originalPrice?: number;
  stock: number;
  images: string[];
  specifications: Record<string, string>;
  warranty: WarrantyInfo;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  featured: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Warranty Info
export interface WarrantyInfo {
  duration: number; // months
  type: 'limited' | 'extended';
  coverage: string[];
}

// Device Model (for Trade-In quotes)
export interface DeviceModel {
  id: string;
  brand: string;
  model: string;
  category: string;
  basePrice: number;
  conditionPrices: {
    excellent: number;
    good: number;
    fair: number;
    broken: number;
  };
  specifications: Record<string, string>;
  imageUrls: string[];
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Trade-In Request
export interface TradeIn {
  id: string;
  userId: string;
  deviceId: string;
  deviceModel: string;
  brand: string;
  condition: DeviceCondition;
  quotedPrice: number;
  finalPrice?: number;
  status: TradeInStatus;
  shippingLabel?: string;
  trackingNumber?: string;
  notes?: string;
  evaluationNotes?: string;
  paymentMethod: PaymentMethod;
  paymentDetails?: {
    paypalEmail?: string;
    giftCardEmail?: string;
    checkAddress?: Address;
  };
  shippedAt?: Timestamp;
  receivedAt?: Timestamp;
  evaluatedAt?: Timestamp;
  paidAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Order
export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  shippingAddress: Address;
  billingAddress: Address;
  paymentMethod: PaymentMethod;
  paymentId?: string;
  trackingNumber?: string;
  carrier?: string;
  shippedAt?: Timestamp;
  deliveredAt?: Timestamp;
  cancelledAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Order Item
export interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  condition: string;
  image: string;
}

// Review
export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  helpful: number;
  notHelpful: number;
  images?: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Category
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  order: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Brand
export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Payment
export interface Payment {
  id: string;
  orderId?: string;
  tradeInId?: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  metadata: Record<string, any>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Shipment
export interface Shipment {
  id: string;
  orderId?: string;
  tradeInId?: string;
  trackingNumber: string;
  carrier: string;
  status: 'label_created' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception';
  estimatedDelivery?: Timestamp;
  deliveredAt?: Timestamp;
  shippingAddress: Address;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Notification
export interface Notification {
  id: string;
  userId: string;
  type: 'order' | 'tradeIn' | 'promotion' | 'system';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: Timestamp;
}

// Admin Log
export interface AdminLog {
  id: string;
  adminId: string;
  action: string;
  entity: string;
  entityId: string;
  details: Record<string, any>;
  ipAddress?: string;
  createdAt: Timestamp;
}
