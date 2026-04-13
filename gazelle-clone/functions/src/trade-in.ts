/**
 * Trade-In Cloud Functions
 * Handles trade-in quote generation, evaluation, and payment processing
 */

import * as functions from 'firebase-functions';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';

const db = getFirestore();

export const tradeInFunctions = {
  /**
   * Create a new trade-in request
   */
  createTradeIn: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to create a trade-in'
      );
    }

    const { deviceId, deviceModel, brand, condition, quotedPrice, paymentMethod, paymentDetails } = data;

    if (!deviceId || !condition || !quotedPrice) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Device ID, condition, and quoted price are required'
      );
    }

    const tradeInData = {
      userId: context.auth.uid,
      deviceId,
      deviceModel,
      brand,
      condition,
      quotedPrice,
      finalPrice: null,
      status: 'quoted',
      paymentMethod,
      paymentDetails: paymentDetails || null,
      notes: data.notes || '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const tradeInRef = await db.collection('tradeIns').add(tradeInData);

    // Generate shipping label URL (integrate with Shippo, EasyPost, etc.)
    const shippingLabelUrl = await generateShippingLabel(context.auth.uid, tradeInRef.id);

    await tradeInRef.update({
      shippingLabel: shippingLabelUrl,
    });

    return {
      tradeInId: tradeInRef.id,
      shippingLabel: shippingLabelUrl,
      nextSteps: [
        'Print the shipping label',
        'Pack your device securely',
        'Drop off at the nearest shipping location',
        'We will evaluate your device upon receipt',
        'You will receive payment within 3-5 business days after approval',
      ],
    };
  }),

  /**
   * Update trade-in status (Admin only)
   */
  updateTradeInStatus: functions.https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }

    // Check if user is admin
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (userDoc.data()?.role !== 'admin') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only admins can update trade-in status'
      );
    }

    const { tradeInId, status, finalPrice, evaluationNotes } = data;

    if (!tradeInId || !status) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Trade-in ID and status are required'
      );
    }

    const updateData: any = {
      status,
      updatedAt: Timestamp.now(),
    };

    if (finalPrice !== undefined) {
      updateData.finalPrice = finalPrice;
    }

    if (evaluationNotes) {
      updateData.evaluationNotes = evaluationNotes;
    }

    if (status === 'received') {
      updateData.receivedAt = Timestamp.now();
      updateData.status = 'evaluating';
    } else if (status === 'approved' || status === 'rejected') {
      updateData.evaluatedAt = Timestamp.now();
    } else if (status === 'paid') {
      updateData.paidAt = Timestamp.now();
      
      // Process payment
      await processTradeInPayment(tradeInId);
    }

    await db.collection('tradeIns').doc(tradeInId).update(updateData);

    // Send notification to user
    await sendTradeInStatusNotification(tradeInId, status);

    return { success: true, tradeInId, status };
  }),

  /**
   * Get trade-in quote by device and condition
   */
  getQuote: functions.https.onCall(async (data, context) => {
    const { deviceId, condition } = data;

    if (!deviceId || !condition) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Device ID and condition are required'
      );
    }

    const deviceDoc = await db.collection('deviceModels').doc(deviceId).get();

    if (!deviceDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Device model not found');
    }

    const deviceData = deviceDoc.data()!;
    const priceMap = deviceData.conditionPrices;

    let quote: number;
    switch (condition) {
      case 'excellent':
        quote = priceMap.excellent;
        break;
      case 'good':
        quote = priceMap.good;
        break;
      case 'fair':
        quote = priceMap.fair;
        break;
      case 'broken':
        quote = priceMap.broken;
        break;
      default:
        quote = priceMap.good;
    }

    return {
      deviceId,
      condition,
      quote,
      validUntil: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    };
  }),
};

// Helper Functions

async function generateShippingLabel(userId: string, tradeInId: string): Promise<string> {
  // Integrate with shipping provider (Shippo, EasyPost, USPS API, etc.)
  // This is a placeholder implementation
  console.log(`Generating shipping label for trade-in ${tradeInId}`);
  
  // In production, call shipping API and return the label URL
  return `https://example.com/shipping-labels/${tradeInId}.pdf`;
}

async function processTradeInPayment(tradeInId: string): Promise<void> {
  const tradeInDoc = await db.collection('tradeIns').doc(tradeInId).get();
  const tradeInData = tradeInDoc.data()!;

  const paymentData = {
    tradeInId,
    amount: tradeInData.finalPrice || tradeInData.quotedPrice,
    method: tradeInData.paymentMethod,
    status: 'pending',
    currency: 'USD',
    metadata: {
      userId: tradeInData.userId,
      paymentDetails: tradeInData.paymentDetails,
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  await db.collection('payments').add(paymentData);

  // Process payment based on method (PayPal, bank transfer, gift card, check)
  // Implementation depends on payment provider integration
  console.log(`Processing payment for trade-in ${tradeInId}`);
}

async function sendTradeInStatusNotification(tradeInId: string, status: string): Promise<void> {
  const tradeInDoc = await db.collection('tradeIns').doc(tradeInId).get();
  const tradeInData = tradeInDoc.data()!;

  const notificationData = {
    userId: tradeInData.userId,
    type: 'tradeIn',
    title: getNotificationTitle(status),
    message: getNotificationMessage(status, tradeInData.deviceModel),
    read: false,
    actionUrl: `/trade-ins/${tradeInId}`,
    createdAt: Timestamp.now(),
  };

  await db.collection('notifications').add(notificationData);

  // Also send email notification
  // await sendEmail(...);
}

function getNotificationTitle(status: string): string {
  const titles: Record<string, string> = {
    received: 'Device Received',
    evaluating: 'Device Being Evaluated',
    approved: 'Trade-In Approved!',
    rejected: 'Trade-In Update',
    paid: 'Payment Sent',
  };
  return titles[status] || 'Trade-In Status Update';
}

function getNotificationMessage(status: string, deviceModel: string): string {
  const messages: Record<string, string> = {
    received: `Your ${deviceModel} has been received and is being evaluated.`,
    evaluating: `Your ${deviceModel} is currently being evaluated by our team.`,
    approved: `Great news! Your ${deviceModel} has been approved. Payment will be processed soon.`,
    rejected: `Your ${deviceModel} evaluation is complete. Please check your account for details.`,
    paid: 'Your payment has been sent! Thank you for trading in with us.',
  };
  return messages[status] || 'Your trade-in status has been updated.';
}
