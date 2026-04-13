/**
 * Order Cloud Functions
 * Handles order creation, processing, shipping, and fulfillment
 */

import * as functions from 'firebase-functions';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const db = getFirestore();

export const orderFunctions = {
  /**
   * Create a new order
   */
  createOrder: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to create an order'
      );
    }

    const { items, shippingAddress, billingAddress, paymentMethod } = data;

    if (!items || items.length === 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Order must contain at least one item'
      );
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.08; // 8% tax rate (adjust based on location)
    const shipping = subtotal > 50 ? 0 : 9.99; // Free shipping over $50
    const discount = data.discount || 0;
    const total = subtotal + tax + shipping - discount;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const orderData = {
      userId: context.auth.uid,
      orderNumber,
      items,
      subtotal,
      tax,
      shipping,
      discount,
      total,
      status: 'pending',
      shippingAddress,
      billingAddress,
      paymentMethod,
      paymentId: null,
      trackingNumber: null,
      carrier: null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const orderRef = await db.collection('orders').add(orderData);

    // Process payment
    const paymentResult = await processPayment(orderRef.id, total, paymentMethod);

    // Update order with payment ID
    await orderRef.update({
      paymentId: paymentResult.paymentId,
      status: paymentResult.success ? 'processing' : 'pending',
    });

    // Decrease product stock
    for (const item of items) {
      await decreaseProductStock(item.productId, item.quantity);
    }

    // Send confirmation email
    await sendOrderConfirmation(orderRef.id);

    return {
      orderId: orderRef.id,
      orderNumber,
      total,
      status: 'processing',
    };
  }),

  /**
   * Update order status (Admin only)
   */
  updateOrderStatus: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    // Check if user is admin
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (userDoc.data()?.role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can update order status'
      );
    }

    const { orderId, status, trackingNumber, carrier } = data;

    if (!orderId || !status) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Order ID and status are required'
      );
    }

    const updateData: any = {
      status,
      updatedAt: Timestamp.now(),
    };

    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }

    if (carrier) {
      updateData.carrier = carrier;
    }

    if (status === 'shipped') {
      updateData.shippedAt = Timestamp.now();
      
      // Create shipment record
      await createShipmentRecord(orderId, trackingNumber, carrier);
    } else if (status === 'delivered') {
      updateData.deliveredAt = Timestamp.now();
    } else if (status === 'cancelled') {
      updateData.cancelledAt = Timestamp.now();
      
      // Restore product stock
      const orderDoc = await db.collection('orders').doc(orderId).get();
      const orderData = orderDoc.data()!;
      for (const item of orderData.items) {
        await increaseProductStock(item.productId, item.quantity);
      }
      
      // Process refund
      await processRefund(orderId);
    }

    await db.collection('orders').doc(orderId).update(updateData);

    // Send notification to user
    await sendOrderStatusNotification(orderId, status);

    return { success: true, orderId, status };
  }),

  /**
   * Cancel order (User can cancel within 1 hour of placement)
   */
  cancelOrder: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const { orderId } = data;

    if (!orderId) {
      throw new functions.https.HttpsError('invalid-argument', 'Order ID is required');
    }

    const orderDoc = await db.collection('orders').doc(orderId).get();

    if (!orderDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Order not found');
    }

    const orderData = orderDoc.data()!;

    if (orderData.userId !== context.auth.uid) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You can only cancel your own orders'
      );
    }

    if (orderData.status !== 'pending' && orderData.status !== 'processing') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Order cannot be cancelled at this stage'
      );
    }

    // Check if within 1 hour of placement
    const oneHourAgo = Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000));
    if (orderData.createdAt < oneHourAgo) {
      throw new functions.https.HttpsError(
        'deadline-exceeded',
        'Orders can only be cancelled within 1 hour of placement'
      );
    }

    // Update order status
    await db.collection('orders').doc(orderId).update({
      status: 'cancelled',
      cancelledAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Restore product stock
    for (const item of orderData.items) {
      await increaseProductStock(item.productId, item.quantity);
    }

    // Process refund
    await processRefund(orderId);

    // Send cancellation confirmation
    await sendOrderCancellationEmail(orderId);

    return { success: true, orderId };
  }),
};

// Helper Functions

async function processPayment(orderId: string, amount: number, paymentMethod: string): Promise<any> {
  // Integrate with Stripe, PayPal, or other payment processor
  console.log(`Processing payment for order ${orderId}: $${amount}`);
  
  // Placeholder implementation
  return {
    success: true,
    paymentId: `pay_${Date.now()}`,
  };
}

async function decreaseProductStock(productId: string, quantity: number): Promise<void> {
  const productRef = db.collection('products').doc(productId);
  const productDoc = await productRef.get();
  
  if (productDoc.exists) {
    const currentStock = productDoc.data()?.stock || 0;
    await productRef.update({
      stock: Math.max(0, currentStock - quantity),
      updatedAt: Timestamp.now(),
    });
  }
}

async function increaseProductStock(productId: string, quantity: number): Promise<void> {
  const productRef = db.collection('products').doc(productId);
  const productDoc = await productRef.get();
  
  if (productDoc.exists) {
    const currentStock = productDoc.data()?.stock || 0;
    await productRef.update({
      stock: currentStock + quantity,
      updatedAt: Timestamp.now(),
    });
  }
}

async function createShipmentRecord(orderId: string, trackingNumber: string, carrier: string): Promise<void> {
  const orderDoc = await db.collection('orders').doc(orderId).get();
  const orderData = orderDoc.data()!;

  const shipmentData = {
    orderId,
    trackingNumber,
    carrier,
    status: 'in_transit',
    estimatedDelivery: Timestamp.fromDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)), // 5 days
    shippingAddress: orderData.shippingAddress,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await db.collection('shipments').add(shipmentData);
}

async function processRefund(orderId: string): Promise<void> {
  // Integrate with payment processor to process refund
  console.log(`Processing refund for order ${orderId}`);
  
  // Create refund record
  await db.collection('payments').add({
    orderId,
    type: 'refund',
    status: 'pending',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
}

async function sendOrderConfirmation(orderId: string): Promise<void> {
  const orderDoc = await db.collection('orders').doc(orderId).get();
  const orderData = orderDoc.data()!;

  const notificationData = {
    userId: orderData.userId,
    type: 'order',
    title: 'Order Confirmed!',
    message: `Your order ${orderData.orderNumber} has been confirmed.`,
    read: false,
    actionUrl: `/orders/${orderId}`,
    createdAt: Timestamp.now(),
  };

  await db.collection('notifications').add(notificationData);

  // Also send email confirmation
  // await sendEmail(...);
}

async function sendOrderStatusNotification(orderId: string, status: string): Promise<void> {
  const orderDoc = await db.collection('orders').doc(orderId).get();
  const orderData = orderDoc.data()!;

  const notificationData = {
    userId: orderData.userId,
    type: 'order',
    title: getOrderStatusTitle(status),
    message: getOrderStatusMessage(status, orderData.orderNumber),
    read: false,
    actionUrl: `/orders/${orderId}`,
    createdAt: Timestamp.now(),
  };

  await db.collection('notifications').add(notificationData);
}

async function sendOrderCancellationEmail(orderId: string): Promise<void> {
  // Send cancellation confirmation email
  console.log(`Sending cancellation email for order ${orderId}`);
}

function getOrderStatusTitle(status: string): string {
  const titles: Record<string, string> = {
    processing: 'Order Processing',
    shipped: 'Order Shipped!',
    delivered: 'Order Delivered!',
    cancelled: 'Order Cancelled',
    refunded: 'Refund Processed',
  };
  return titles[status] || 'Order Status Update';
}

function getOrderStatusMessage(status: string, orderNumber: string): string {
  const messages: Record<string, string> = {
    processing: `Your order ${orderNumber} is being prepared for shipment.`,
    shipped: `Great news! Your order ${orderNumber} has been shipped.`,
    delivered: `Your order ${orderNumber} has been delivered. Enjoy your purchase!`,
    cancelled: `Your order ${orderNumber} has been cancelled. A refund will be processed if applicable.`,
    refunded: `Your refund for order ${orderNumber} has been processed.`,
  };
  return messages[status] || 'Your order status has been updated.';
}
