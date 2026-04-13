// Firestore Collections
export const COLLECTIONS = {
  USERS: 'users',
  PRODUCTS: 'products',
  ORDERS: 'orders',
  TRADE_INS: 'tradeIns',
  REVIEWS: 'reviews',
  CATEGORIES: 'categories',
  BRANDS: 'brands',
  DEVICE_MODELS: 'deviceModels',
  PAYMENTS: 'payments',
  SHIPMENTS: 'shipments',
  NOTIFICATIONS: 'notifications',
  ADMIN_LOGS: 'adminLogs',
} as const;

// Device Conditions for Trade-In
export const DEVICE_CONDITIONS = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  BROKEN: 'broken',
} as const;

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

// Trade-In Status
export const TRADE_IN_STATUS = {
  QUOTED: 'quoted',
  RECEIVED: 'received',
  EVALUATING: 'evaluating',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PAID: 'paid',
} as const;

// Payment Methods
export const PAYMENT_METHODS = {
  CREDIT_CARD: 'credit_card',
  PAYPAL: 'paypal',
  BANK_TRANSFER: 'bank_transfer',
  GIFT_CARD: 'gift_card',
  CHECK: 'check',
} as const;

// User Roles
export const USER_ROLES = {
  CUSTOMER: 'customer',
  SELLER: 'seller',
  ADMIN: 'admin',
  SUPPORT: 'support',
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];
export type DeviceCondition = typeof DEVICE_CONDITIONS[keyof typeof DEVICE_CONDITIONS];
export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];
export type TradeInStatus = typeof TRADE_IN_STATUS[keyof typeof TRADE_IN_STATUS];
export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
