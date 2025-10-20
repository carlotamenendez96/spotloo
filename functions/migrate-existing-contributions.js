/**
 * Script de Migración - Actualizar Contribuciones Existentes
 * 
 * Este script recalcula los puntos y contribuciones de todos los usuarios
 * basándose en sus ratings y validaciones existentes en Firestore.
 * 
 * ÚSALO SOLO UNA VEZ después de desplegar las Cloud Functions.
 */

const admin = require('firebase-admin');

// Inicializar Firebase Admin
admin.initializeApp({
  // Si estás ejecutando localmente, necesitarás el service account key
  // credential: admin.credential.cert(require('./serviceAccountKey.json'))
});

const db = admin.firestore();
const auth = admin.auth();

// Puntos por cada acción
const POINTS = {
  CREATE_BATHROOM: 15,
  VALIDATION: 10,
  RATING: 5
};

async function migrateContributions() {
  console.log('🚀 Iniciando migración de contribuciones...\n');

  try {
    // 1. Contar baños creados por cada usuario
    console.log('📊 Contando baños creados...');
    const bathrooms = await db.collection('bathrooms').get();
    const bathroomsByUser = {};
    
    bathrooms.forEach(doc => {
      const data = doc.data();
      const createdBy = data.createdBy;
      if (createdBy) {
        bathroomsByUser[createdBy] = (bathroomsByUser[createdBy] || 0) + 1;
      }
    });
    console.log(`✅ Encontrados ${Object.keys(bathroomsByUser).length} usuarios con baños creados\n`);

    // 2. Contar ratings por cada usuario
    console.log('📊 Contando calificaciones...');
    const ratings = await db.collection('ratings').get();
    const ratingsByUser = {};
    
    ratings.forEach(doc => {
      const data = doc.data();
      const userUID = data.userUID;
      if (userUID) {
        ratingsByUser[userUID] = (ratingsByUser[userUID] || 0) + 1;
      }
    });
    console.log(`✅ Encontrados ${Object.keys(ratingsByUser).length} usuarios con calificaciones\n`);

    // 3. Contar validaciones por cada usuario
    console.log('📊 Contando validaciones...');
    const validationsByUser = {};
    
    bathrooms.forEach(doc => {
      const data = doc.data();
      const validations = data.validations || {};
      
      Object.keys(validations).forEach(userId => {
        if (validations[userId] === true) {
          validationsByUser[userId] = (validationsByUser[userId] || 0) + 1;
        }
      });
    });
    console.log(`✅ Encontrados ${Object.keys(validationsByUser).length} usuarios con validaciones\n`);

    // 4. Calcular puntos totales y contribuciones para cada usuario
    console.log('🔄 Calculando puntos totales...');
    const allUserIds = new Set([
      ...Object.keys(bathroomsByUser),
      ...Object.keys(ratingsByUser),
      ...Object.keys(validationsByUser)
    ]);

    const updates = [];
    
    for (const userId of allUserIds) {
      const bathroomsCount = bathroomsByUser[userId] || 0;
      const ratingsCount = ratingsByUser[userId] || 0;
      const validationsCount = validationsByUser[userId] || 0;
      
      const totalContributions = bathroomsCount + ratingsCount + validationsCount;
      const totalPoints = 
        (bathroomsCount * POINTS.CREATE_BATHROOM) +
        (ratingsCount * POINTS.RATING) +
        (validationsCount * POINTS.VALIDATION);

      updates.push({
        userId,
        bathroomsCount,
        ratingsCount,
        validationsCount,
        totalContributions,
        totalPoints
      });
    }

    console.log(`✅ ${updates.length} usuarios para actualizar\n`);

    // 5. Actualizar Firestore
    console.log('💾 Actualizando documentos en Firestore...');
    let successCount = 0;
    let errorCount = 0;

    for (const update of updates) {
      try {
        // Intentar obtener displayName y email de Authentication
        let displayName = 'Usuario';
        let email = '';
        try {
          const userRecord = await auth.getUser(update.userId);
          displayName = userRecord.displayName || 'Usuario';
          email = userRecord.email || '';
        } catch (authError) {
          console.log(`  ⚠️  No se pudo obtener datos de Auth para ${update.userId}`);
        }

        await db.collection('users').doc(update.userId).set({
          uid: update.userId,
          displayName: displayName,
          email: email,
          contributions: update.totalContributions,
          points: update.totalPoints,
          lastActivity: admin.firestore.FieldValue.serverTimestamp(),
          // Opcional: guardar desglose
          stats: {
            bathroomsCreated: update.bathroomsCount,
            ratingsGiven: update.ratingsCount,
            validationsGiven: update.validationsCount
          }
        }, { merge: true });

        console.log(`  ✅ ${displayName || update.userId}:`);
        console.log(`     • Email: ${email}`);
        console.log(`     • Baños: ${update.bathroomsCount}`);
        console.log(`     • Ratings: ${update.ratingsCount}`);
        console.log(`     • Validaciones: ${update.validationsCount}`);
        console.log(`     • Total contribuciones: ${update.totalContributions}`);
        console.log(`     • Total puntos: ${update.totalPoints}`);
        console.log('');

        successCount++;
      } catch (error) {
        console.error(`  ❌ Error actualizando ${update.userId}:`, error.message);
        errorCount++;
      }
    }

    // 6. Resumen final
    console.log('\n' + '='.repeat(50));
    console.log('📈 RESUMEN DE MIGRACIÓN');
    console.log('='.repeat(50));
    console.log(`✅ Usuarios actualizados correctamente: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📊 Total baños en sistema: ${bathrooms.size}`);
    console.log(`📊 Total ratings en sistema: ${ratings.size}`);
    console.log('='.repeat(50));
    console.log('\n🎉 ¡Migración completada!');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Ejecutar migración
migrateContributions();

