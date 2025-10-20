# Cloud Functions para SpotLoo

Este directorio contiene las Cloud Functions que gestionan automáticamente los puntos y contribuciones de los usuarios.

## Funciones Implementadas

### 1. `onBathroomCreated`
- **Trigger:** Se ejecuta cuando se crea un nuevo documento en `bathrooms/`
- **Acción:** Otorga **15 puntos** al creador del baño
- **Actualiza:** `users/{uid}` → incrementa `points` y `contributions`

### 2. `onRatingCreated`
- **Trigger:** Se ejecuta cuando se crea un nuevo documento en `ratings/`
- **Acción:** Otorga **5 puntos** al usuario que calificó
- **Actualiza:** `users/{uid}` → incrementa `points` y `contributions`

### 3. `onBathroomUpdated`
- **Trigger:** Se ejecuta cuando se actualiza un documento en `bathrooms/`
- **Acción:** Detecta nuevas validaciones y otorga **10 puntos** a cada validador
- **Actualiza:** `users/{uid}` → incrementa `points` y `contributions`

## Instalación

1. Asegúrate de tener Firebase CLI instalado:
```bash
npm install -g firebase-tools
```

2. Inicia sesión en Firebase:
```bash
firebase login
```

3. Inicializa Firebase en el proyecto (si no lo has hecho):
```bash
firebase init
```
Selecciona:
- Functions
- Firestore
- Tu proyecto de Firebase

4. Instala las dependencias de las functions:
```bash
cd functions
npm install
```

## Despliegue

### Desplegar todas las funciones:
```bash
firebase deploy --only functions
```

### Desplegar una función específica:
```bash
firebase deploy --only functions:onBathroomCreated
firebase deploy --only functions:onRatingCreated
firebase deploy --only functions:onBathroomUpdated
```

## Desarrollo Local

Para probar las funciones localmente con el emulador:

```bash
firebase emulators:start
```

Esto iniciará los emuladores de Functions y Firestore para que puedas probar sin afectar la base de datos de producción.

## Logs

Para ver los logs de las funciones en producción:

```bash
firebase functions:log
```

Para una función específica:
```bash
firebase functions:log --only onRatingCreated
```

## Cómo Funciona

1. **Usuario crea un baño** → Se guarda en Firestore → `onBathroomCreated` se dispara automáticamente → Actualiza puntos del creador

2. **Usuario califica un baño** → Se guarda rating en Firestore → `onRatingCreated` se dispara automáticamente → Actualiza puntos del usuario

3. **Usuario valida un baño** → Se actualiza el documento del baño → `onBathroomUpdated` se dispara automáticamente → Detecta nuevos validadores → Actualiza puntos

## Ventajas de usar Cloud Functions

✅ **Seguridad**: Los puntos se actualizan desde el servidor, no desde el cliente
✅ **Confiabilidad**: No depende de que el cliente tenga permisos o conexión
✅ **Consistencia**: Garantiza que siempre se otorguen los puntos correctos
✅ **Auditoría**: Todos los cambios quedan registrados en los logs de Firebase

## Troubleshooting

Si las funciones no se ejecutan:

1. Verifica que estén desplegadas:
```bash
firebase functions:list
```

2. Revisa los logs para ver errores:
```bash
firebase functions:log
```

3. Verifica que tu proyecto tenga el plan Blaze (las functions requieren billing habilitado)

4. Asegúrate de que Firebase Admin tenga los permisos necesarios en las reglas de Firestore


