/**
 * Cloud Functions for SpotLoo - VERSIÓN SEGURA Y OPTIMIZADA
 * 
 * Versión mejorada con:
 * - Validaciones adicionales
 * - Prevención de duplicados
 * - Manejo de errores robusto
 * - Logs detallados para auditoría
 */

const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const { logger } = require('firebase-functions/v2');

// Inicializar Firebase Admin
initializeApp();
const db = getFirestore();
const auth = getAuth();

// Puntos por cada acción
const POINTS = {
  CREATE_BATHROOM: 15,
  VALIDATION: 10,
  RATING: 5
};

// Límites de seguridad
const LIMITS = {
  MAX_POINTS_PER_DAY: 500, // Máximo de puntos que un usuario puede ganar por día
  MAX_RATINGS_PER_DAY: 50,  // Máximo de ratings por día
  MAX_VALIDATIONS_PER_DAY: 30 // Máximo de validaciones por día
};

/**
 * Verifica si un usuario ha excedido límites diarios (prevención de abuso)
 */
async function checkDailyLimits(userId, action) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data() || {};
    const dailyStats = userData.dailyStats || {};
    const lastReset = dailyStats.lastReset?.toDate() || new Date(0);
    
    // Si es un nuevo día, resetear contadores
    if (lastReset < today) {
      return { allowed: true, shouldReset: true };
    }
    
    // Verificar límites según la acción
    const currentCount = dailyStats[action] || 0;
    const limit = LIMITS[`MAX_${action.toUpperCase()}S_PER_DAY`] || 100;
    
    if (currentCount >= limit) {
      logger.warn(`User ${userId} exceeded daily limit for ${action}`, {
        currentCount,
        limit
      });
      return { allowed: false, shouldReset: false };
    }
    
    return { allowed: true, shouldReset: false };
  } catch (error) {
    logger.error('Error checking daily limits:', error);
    // En caso de error, permitir la acción (fail-open)
    return { allowed: true, shouldReset: false };
  }
}

/**
 * Actualiza puntos del usuario con validaciones de seguridad
 */
async function updateUserPoints(userId, points, action, metadata = {}) {
  try {
    // Verificar límites diarios
    const limitCheck = await checkDailyLimits(userId, action);
    
    if (!limitCheck.allowed) {
      logger.warn(`Action blocked - daily limit exceeded`, {
        userId,
        action,
        metadata
      });
      return false;
    }
    
    // Obtener datos del usuario de Authentication
    let displayName = 'Usuario';
    let email = '';
    try {
      const userRecord = await auth.getUser(userId);
      displayName = userRecord.displayName || 'Usuario';
      email = userRecord.email || '';
    } catch (authError) {
      logger.warn('Could not fetch user data from Auth:', authError.message);
    }
    
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    const updateData = {
      points: FieldValue.increment(points),
      contributions: FieldValue.increment(1),
      lastActivity: FieldValue.serverTimestamp()
    };
    
    // Si el documento no existe, crear con todos los datos
    if (!userDoc.exists) {
      updateData.displayName = displayName;
      updateData.email = email;
      updateData.uid = userId;
      updateData.createdAt = FieldValue.serverTimestamp();
    } else {
      // Si existe pero no tiene displayName, solo agregarlo (sin tocar createdAt)
      const userData = userDoc.data();
      if (!userData?.displayName) {
        updateData.displayName = displayName;
      }
      if (!userData?.email) {
        updateData.email = email;
      }
      if (!userData?.uid) {
        updateData.uid = userId;
      }
      // NUNCA tocar createdAt si el documento ya existe
    }
    
    // Actualizar o resetear estadísticas diarias
    if (limitCheck.shouldReset) {
      updateData.dailyStats = {
        lastReset: FieldValue.serverTimestamp(),
        [action]: 1
      };
    } else {
      updateData[`dailyStats.${action}`] = FieldValue.increment(1);
    }
    
    await userRef.set(updateData, { merge: true });
    
    // Log para auditoría
    logger.info('Points awarded successfully', {
      userId,
      points,
      action,
      metadata,
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    logger.error('Error updating user points:', error, {
      userId,
      points,
      action,
      metadata
    });
    throw error;
  }
}

/**
 * Se dispara cuando se crea un nuevo baño
 * Otorga 15 puntos al creador
 */
exports.onBathroomCreated = onDocumentCreated('bathrooms/{bathroomId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    logger.warn('No data associated with bathroom creation event');
    return;
  }

  const bathroomData = snapshot.data();
  const bathroomId = event.params.bathroomId;
  const createdBy = bathroomData.createdBy;

  // Validaciones
  if (!createdBy) {
    logger.warn('Bathroom has no creator', { bathroomId });
    return;
  }

  // Validar que el baño tenga los campos requeridos
  if (!bathroomData.title || !bathroomData.coordinates) {
    logger.error('Bathroom missing required fields', { bathroomId });
    return;
  }

  try {
    const success = await updateUserPoints(
      createdBy, 
      POINTS.CREATE_BATHROOM, 
      'bathroom',
      { bathroomId, title: bathroomData.title }
    );
    
    if (success) {
      logger.info(`Awarded ${POINTS.CREATE_BATHROOM} points for bathroom creation`, {
        userId: createdBy,
        bathroomId
      });
    }
  } catch (error) {
    logger.error('Error in onBathroomCreated:', error, {
      bathroomId,
      createdBy
    });
  }
});

/**
 * Se dispara cuando se crea un nuevo rating
 * Otorga 5 puntos al usuario que calificó
 */
exports.onRatingCreated = onDocumentCreated('ratings/{ratingId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    logger.warn('No data associated with rating creation event');
    return;
  }

  const ratingData = snapshot.data();
  const ratingId = event.params.ratingId;
  const userUID = ratingData.userUID;
  const bathroomID = ratingData.bathroomID;

  // Validaciones
  if (!userUID) {
    logger.warn('Rating has no user', { ratingId });
    return;
  }

  if (!bathroomID) {
    logger.warn('Rating has no bathroom reference', { ratingId });
    return;
  }

  // Validar que el rating sea válido (1-5)
  if (ratingData.rating < 1 || ratingData.rating > 5) {
    logger.error('Invalid rating value', { ratingId, rating: ratingData.rating });
    return;
  }

  try {
    // Verificar que el baño existe
    const bathroomDoc = await db.collection('bathrooms').doc(bathroomID).get();
    if (!bathroomDoc.exists) {
      logger.error('Bathroom not found for rating', { bathroomID, ratingId });
      return;
    }

    // Verificar que no es el creador calificando su propio baño
    const bathroomData = bathroomDoc.data();
    if (bathroomData.createdBy === userUID) {
      logger.warn('User trying to rate own bathroom', { userUID, bathroomID });
      return;
    }

    const success = await updateUserPoints(
      userUID, 
      POINTS.RATING, 
      'rating',
      { bathroomID, ratingId, ratingValue: ratingData.rating }
    );
    
    if (success) {
      logger.info(`Awarded ${POINTS.RATING} points for rating`, {
        userId: userUID,
        bathroomID,
        ratingId
      });
    }
  } catch (error) {
    logger.error('Error in onRatingCreated:', error, {
      ratingId,
      userUID,
      bathroomID
    });
  }
});

/**
 * Se dispara cuando se actualiza un baño
 * Otorga 10 puntos a cada usuario que validó (solo se otorga una vez por usuario)
 */
exports.onBathroomUpdated = onDocumentUpdated('bathrooms/{bathroomId}', async (event) => {
  const beforeData = event.data.before.data();
  const afterData = event.data.after.data();
  const bathroomId = event.params.bathroomId;

  // Verificar si el campo validations cambió
  const beforeValidations = beforeData.validations || {};
  const afterValidations = afterData.validations || {};

  // Encontrar nuevas validaciones (usuarios que no estaban antes)
  const newValidators = Object.keys(afterValidations).filter(
    userId => !beforeValidations[userId] && afterValidations[userId] === true
  );

  if (newValidators.length === 0) {
    return;
  }

  logger.info(`Processing ${newValidators.length} new validations for bathroom`, {
    bathroomId,
    newValidators
  });

  // Verificar que el baño no sea del validador
  const bathroomCreator = afterData.createdBy;

  // Otorgar puntos a cada nuevo validador
  const promises = newValidators.map(async (userId) => {
    // No otorgar puntos si el usuario valida su propio baño
    if (userId === bathroomCreator) {
      logger.warn('User trying to validate own bathroom', { userId, bathroomId });
      return;
    }

    try {
      const success = await updateUserPoints(
        userId, 
        POINTS.VALIDATION, 
        'validation',
        { bathroomId, title: afterData.title }
      );

      if (success) {
        logger.info(`Awarded ${POINTS.VALIDATION} points for validation`, {
          userId,
          bathroomId
        });
      }
    } catch (error) {
      logger.error(`Error awarding points to validator ${userId}:`, error, {
        bathroomId
      });
    }
  });

  await Promise.all(promises);
});

