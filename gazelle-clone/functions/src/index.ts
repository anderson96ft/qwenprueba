/**
 * Firebase Cloud Functions for Gazelle Clone
 * 
 * Main entry point for all cloud functions
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
initializeApp();

const db = getFirestore();

// Export individual function modules
export { tradeInFunctions } from './trade-in';
export { orderFunctions } from './orders';
export { paymentFunctions } from './payments';
export { notificationFunctions } from './notifications';
export { userFunctions } from './users';

/**
 * HTTP Function: Health Check
 */
export const healthCheck = functions.https.onRequest((req, res) => {
  res.status(200).send({ status: 'ok', timestamp: Timestamp.now().toDate() });
});

/**
 * Scheduled Function: Daily Analytics Aggregation
 * Runs every day at midnight UTC
 */
export const aggregateDailyAnalytics = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    console.log('Running daily analytics aggregation...');
    
    // Aggregate orders, trade-ins, revenue, etc.
    // Implementation details in analytics module
    
    return null;
  });

/**
 * Callable Function: Generate Trade-In Quote
 */
export const generateTradeInQuote = functions.https.onCall(async (data, context) => {
  const { deviceId, condition } = data;
  
  if (!deviceId || !condition) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Device ID and condition are required'
    );
  }
  
  // Get device model
  const deviceRef = db.collection('deviceModels').doc(deviceId);
  const deviceSnap = await deviceRef.get();
  
  if (!deviceSnap.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'Device model not found'
    );
  }
  
  const deviceData = deviceSnap.data()!;
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
    validUntil: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days
  };
});
