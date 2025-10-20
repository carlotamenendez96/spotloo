/**
 * Cloud Functions for SpotLoo
 * 
 * Estas funciones se ejecutan automáticamente cuando ocurren ciertos eventos
 * en Firestore, actualizando los puntos y contribuciones de los usuarios.
 */

const { onDocumentCreated, onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

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

/**
 * Se dispara cuando se crea un nuevo baño
 * Otorga 15 puntos al creador
 */
exports.onBathroomCreated = onDocumentCreated('bathrooms/{bathroomId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.log('No data associated with the event');
    return;
  }

  const bathroomData = snapshot.data();
  const createdBy = bathroomData.createdBy;

  // Si no hay creador, salir
  if (!createdBy) {
    console.log('Bathroom has no creator');
    return;
  }

  try {
    // Obtener datos del usuario de Authentication
    let displayName = 'Usuario';
    let email = '';
    try {
      const userRecord = await auth.getUser(createdBy);
      displayName = userRecord.displayName || 'Usuario';
      email = userRecord.email || '';
    } catch (authError) {
      console.warn('Could not fetch user data from Auth:', authError.message);
    }

    // Actualizar puntos y contribuciones del usuario
    const userRef = db.collection('users').doc(createdBy);
    const userDoc = await userRef.get();
    
    const updateData = {
      points: FieldValue.increment(POINTS.CREATE_BATHROOM),
      contributions: FieldValue.increment(1),
      lastActivity: FieldValue.serverTimestamp()
    };
    
    // Si el documento no existe, crear con todos los datos
    if (!userDoc.exists) {
      updateData.displayName = displayName;
      updateData.email = email;
      updateData.uid = createdBy;
      updateData.createdAt = FieldValue.serverTimestamp();
    } else {
      // Si existe pero no tiene displayName, solo agregarlo (sin tocar createdAt)
      const userData = userDoc.data();
      if (!userData.displayName) {
        updateData.displayName = displayName;
      }
      if (!userData.email) {
        updateData.email = email;
      }
      if (!userData.uid) {
        updateData.uid = createdBy;
      }
      // NUNCA tocar createdAt si el documento ya existe
    }
    
    await userRef.set(updateData, { merge: true });

    console.log(`Awarded ${POINTS.CREATE_BATHROOM} points to user ${createdBy} (${displayName}) for creating bathroom`);
  } catch (error) {
    console.error('Error awarding points for bathroom creation:', error);
  }
});

/**
 * Se dispara cuando se crea un nuevo rating
 * Otorga 5 puntos al usuario que calificó
 */
exports.onRatingCreated = onDocumentCreated('ratings/{ratingId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.log('No data associated with the event');
    return;
  }

  const ratingData = snapshot.data();
  const userUID = ratingData.userUID;

  // Si no hay usuario, salir
  if (!userUID) {
    console.log('Rating has no user');
    return;
  }

  try {
    // Obtener datos del usuario de Authentication
    let displayName = 'Usuario';
    let email = '';
    try {
      const userRecord = await auth.getUser(userUID);
      displayName = userRecord.displayName || 'Usuario';
      email = userRecord.email || '';
    } catch (authError) {
      console.warn('Could not fetch user data from Auth:', authError.message);
    }

    // Actualizar puntos y contribuciones del usuario
    const userRef = db.collection('users').doc(userUID);
    const userDoc = await userRef.get();
    
    const updateData = {
      points: FieldValue.increment(POINTS.RATING),
      contributions: FieldValue.increment(1),
      lastActivity: FieldValue.serverTimestamp()
    };
    
    // Si el documento no existe, crear con todos los datos
    if (!userDoc.exists) {
      updateData.displayName = displayName;
      updateData.email = email;
      updateData.uid = userUID;
      updateData.createdAt = FieldValue.serverTimestamp();
    } else {
      // Si existe pero no tiene displayName, solo agregarlo (sin tocar createdAt)
      const userData = userDoc.data();
      if (!userData.displayName) {
        updateData.displayName = displayName;
      }
      if (!userData.email) {
        updateData.email = email;
      }
      if (!userData.uid) {
        updateData.uid = userUID;
      }
      // NUNCA tocar createdAt si el documento ya existe
    }
    
    await userRef.set(updateData, { merge: true });

    console.log(`Awarded ${POINTS.RATING} points to user ${userUID} (${displayName}) for rating`);
  } catch (error) {
    console.error('Error awarding points for rating:', error);
  }
});

/**
 * Se dispara cuando se actualiza un baño
 * Otorga 10 puntos a cada usuario que validó (solo se otorga una vez por usuario)
 */
exports.onBathroomUpdated = onDocumentUpdated('bathrooms/{bathroomId}', async (event) => {
  const beforeData = event.data.before.data();
  const afterData = event.data.after.data();

  // Verificar si el campo validations cambió
  const beforeValidations = beforeData.validations || {};
  const afterValidations = afterData.validations || {};

  // Encontrar nuevas validaciones (usuarios que no estaban antes)
  const newValidators = Object.keys(afterValidations).filter(
    userId => !beforeValidations[userId] && afterValidations[userId] === true
  );

  if (newValidators.length === 0) {
    console.log('No new validations found');
    return;
  }

  console.log(`Found ${newValidators.length} new validators:`, newValidators);

  // Otorgar puntos a cada nuevo validador
  const promises = newValidators.map(async (userId) => {
    try {
      // Obtener datos del usuario de Authentication
      let displayName = 'Usuario';
      let email = '';
      try {
        const userRecord = await auth.getUser(userId);
        displayName = userRecord.displayName || 'Usuario';
        email = userRecord.email || '';
      } catch (authError) {
        console.warn('Could not fetch user data from Auth:', authError.message);
      }

      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      const updateData = {
        points: FieldValue.increment(POINTS.VALIDATION),
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
        if (!userData.displayName) {
          updateData.displayName = displayName;
        }
        if (!userData.email) {
          updateData.email = email;
        }
        if (!userData.uid) {
          updateData.uid = userId;
        }
        // NUNCA tocar createdAt si el documento ya existe
      }
      
      await userRef.set(updateData, { merge: true });

      console.log(`Awarded ${POINTS.VALIDATION} points to user ${userId} (${displayName}) for validation`);
    } catch (error) {
      console.error(`Error awarding points to user ${userId}:`, error);
    }
  });

  await Promise.all(promises);
});

