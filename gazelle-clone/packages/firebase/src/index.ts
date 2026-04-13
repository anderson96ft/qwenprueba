/**
 * SDK de Firebase para Gazelle Clone
 * Proyecto: telfi-ef311
 * 
 * Este paquete proporciona una capa de abstracción sobre Firebase
 * para todas las operaciones de la aplicación.
 */

// Configuración principal
export { db, auth, storage, functions, analytics } from './config';
export { default as firebaseApp } from './config';

// Tipos de datos
export * from './types';

// Constantes
export * from './constants';

// Servicios
export * from './services/auth.service';
export * from './services/products.service';
export * from './services/orders.service';
export * from './services/tradein.service';
export * from './services/users.service';
export * from './services/storage.service';

// Operaciones Firestore (legacy)
export * from './firestore';

// Autenticación (legacy)
export * from './auth';

// Storage (legacy)
export * from './storage';
