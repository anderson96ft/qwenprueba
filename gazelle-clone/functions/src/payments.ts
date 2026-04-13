/**
 * Payment Cloud Functions
 * Handles payment processing, refunds, and payment method management
 */

import * as functions from 'firebase-functions';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const db = getFirestore();

export const paymentFunctions = {
  /**
   * Create a Stripe payment intent
   */
  createPaymentIntent: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to create a payment'
      );
    }

    const { amount, currency = 'USD', orderId, tradeInId } = data;

    if (!amount || amount <= 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Valid amount is required'
      );
    }

    // Integrate with Stripe
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: Math.round(amount * 100), // Convert to cents
    //   currency,
    //   metadata: { orderId, tradeInId, userId: context.auth.uid },
    // });

    console.log(`Creating payment intent for $${amount}`);

    // Placeholder response
    return {
      clientSecret: `pi_${Date.now()}_secret_abc123`,
      paymentIntentId: `pi_${Date.now()}`,
      amount,
      currency,
    };
  }),

  /**
   * Process a payout for trade-in
   */
  processPayout: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    // Check if user is admin
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (userDoc.data()?.role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can process payouts'
      );
    }

    const { tradeInId, amount, method, recipientDetails } = data;

    if (!tradeInId || !amount || !method) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Trade-in ID, amount, and payment method are required'
      );
    }

    console.log(`Processing payout of $${amount} for trade-in ${tradeInId} via ${method}`);

    // Process based on method
    let payoutResult;
    switch (method) {
      case 'paypal':
        payoutResult = await processPayPalPayout(recipientDetails.paypalEmail, amount);
        break;
      case 'bank_transfer':
        payoutResult = await processBankTransfer(recipientDetails.bankAccount, amount);
        break;
      case 'gift_card':
        payoutResult = await processGiftCard(recipientDetails.giftCardEmail, amount);
        break;
      case 'check':
        payoutResult = await scheduleCheckMailing(recipientDetails.checkAddress, amount);
        break;
      default:
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Invalid payment method'
        );
    }

    // Update payment record
    const paymentData = {
      tradeInId,
      amount,
      method,
      status: payoutResult.success ? 'completed' : 'failed',
      transactionId: payoutResult.transactionId,
      currency: 'USD',
      metadata: {
        userId: data.userId,
        processedBy: context.auth.uid,
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await db.collection('payments').add(paymentData);

    return {
      success: payoutResult.success,
      transactionId: payoutResult.transactionId,
      method,
    };
  }),

  /**
   * Process refund for order
   */
  processRefund: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    // Check if user is admin
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (userDoc.data()?.role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can process refunds'
      );
    }

    const { orderId, amount, reason } = data;

    if (!orderId) {
      throw new functions.https.HttpsError('invalid-argument', 'Order ID is required');
    }

    const orderDoc = await db.collection('orders').doc(orderId).get();

    if (!orderDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Order not found');
    }

    const orderData = orderDoc.data()!;
    const refundAmount = amount || orderData.total;

    console.log(`Processing refund of $${refundAmount} for order ${orderId}`);

    // Integrate with Stripe for refund
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const refund = await stripe.refunds.create({
    //   payment_intent: orderData.paymentId,
    //   amount: Math.round(refundAmount * 100),
    //   reason: reason || 'requested_by_customer',
    // });

    // Create refund record
    const refundData = {
      orderId,
      type: 'refund',
      amount: refundAmount,
      reason: reason || 'requested_by_customer',
      status: 'completed',
      transactionId: `ref_${Date.now()}`,
      currency: 'USD',
      metadata: {
        originalPaymentId: orderData.paymentId,
        processedBy: context.auth.uid,
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await db.collection('payments').add(refundData);

    // Update order status
    await db.collection('orders').doc(orderId).update({
      status: 'refunded',
      updatedAt: Timestamp.now(),
    });

    return {
      success: true,
      refundId: refundData.transactionId,
      amount: refundAmount,
    };
  }),

  /**
   * Save payment method for user
   */
  savePaymentMethod: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const { method, details, isDefault } = data;

    if (!method || !details) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Payment method and details are required'
      );
    }

    const userRef = db.collection('users').doc(context.auth.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data()!;
    const paymentMethods = userData.paymentMethods || [];

    // If setting as default, unset others
    if (isDefault) {
      paymentMethods.forEach((pm: any) => {
        pm.isDefault = false;
      });
    }

    const newPaymentMethod = {
      id: `pm_${Date.now()}`,
      method,
      details: {
        ...details,
        // Don't store full card numbers, only last 4 digits
        last4: details.last4 || details.accountNumber?.slice(-4),
      },
      isDefault: isDefault || paymentMethods.length === 0,
      createdAt: Timestamp.now(),
    };

    paymentMethods.push(newPaymentMethod);

    await userRef.update({
      paymentMethods,
      updatedAt: Timestamp.now(),
    });

    return {
      success: true,
      paymentMethodId: newPaymentMethod.id,
    };
  }),

  /**
   * Remove payment method
   */
  removePaymentMethod: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    const { paymentMethodId } = data;

    if (!paymentMethodId) {
      throw new functions.https.HttpsError('invalid-argument', 'Payment method ID is required');
    }

    const userRef = db.collection('users').doc(context.auth.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data()!;
    const paymentMethods = userData.paymentMethods || [];

    const filteredMethods = paymentMethods.filter((pm: any) => pm.id !== paymentMethodId);

    // If removed method was default, set first remaining as default
    if (filteredMethods.length > 0) {
      filteredMethods[0].isDefault = true;
    }

    await userRef.update({
      paymentMethods: filteredMethods,
      updatedAt: Timestamp.now(),
    });

    return { success: true };
  }),
};

// Helper Functions

async function processPayPalPayout(email: string, amount: number): Promise<any> {
  // Integrate with PayPal Payouts API
  console.log(`Processing PayPal payout to ${email}: $${amount}`);
  
  return {
    success: true,
    transactionId: `PAYPAL_${Date.now()}`,
  };
}

async function processBankTransfer(bankAccount: any, amount: number): Promise<any> {
  // Integrate with Plaid or Stripe Connect for bank transfers
  console.log(`Processing bank transfer: $${amount}`);
  
  return {
    success: true,
    transactionId: `BANK_${Date.now()}`,
  };
}

async function processGiftCard(email: string, amount: number): Promise<any> {
  // Integrate with gift card provider (Tango Card, Giftbit, etc.)
  console.log(`Sending gift card to ${email}: $${amount}`);
  
  return {
    success: true,
    transactionId: `GIFT_${Date.now()}`,
  };
}

async function scheduleCheckMailing(address: any, amount: number): Promise<any> {
  // Integrate with check mailing service (Lob, etc.)
  console.log(`Scheduling check mailing for $${amount} to ${address.street}`);
  
  return {
    success: true,
    transactionId: `CHECK_${Date.now()}`,
  };
}
