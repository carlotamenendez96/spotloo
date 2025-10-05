¡Por supuesto! Con toda la información que hemos recopilado sobre la arquitectura (Firebase, Mapbox) y la especificación funcional, aquí tienes un **Funcional Detallado** de la aplicación **SpotLoo**, desglosado por vistas, flujos de usuario y lógica de backend.

Este documento sirve como el plan definitivo para el desarrollo del frontend y la lógica de negocio.

---

## Funcional Detallado de SpotLoo

**Objetivo:** Crear una aplicación web que permita a los usuarios localizar, validar y contribuir con información sobre baños públicos, incentivando la calidad mediante un sistema de puntos y ranking.

### 1. Arquitectura y Tecnologías Clave

| Componente | Función | Tecnologías |
| :--- | :--- | :--- |
| **Backend** | Almacenamiento de datos, autenticación y lógica de negocio. | **Firebase Firestore** (`bathrooms`, `users`, `ratings`), **Firebase Authentication**, **Firebase Storage**, **Cloud Functions**. |
| **Frontend** | Interfaz de usuario, visualización de mapas. | JavaScript/Framework (React/Vue), **Mapbox GL JS** (Mapas y Geocodificación), **Tailwind CSS** (Estilos). |
| **Seguridad** | Reglas de acceso a datos. | **Reglas de Seguridad de Firestore**. |

---

### 2. Vistas Principales de la Aplicación

La aplicación se centra en una vista principal (el mapa) y modales para las interacciones clave.

| Vista | URL/Estado | Componentes Clave |
| :--- | :--- | :--- |
| **1. Carga Inicial** | `/` (al inicio) | **Modal de Búsqueda de Ciudad**, **Header Fijo** (deshabilitado). |
| **2. Vista Principal (Mapa)** | `/` | **Header Fijo**, **Mapa de Mapbox**, **Botón Flotante "Añadir Baño"** (solo logueado). |
| **Modales de Interacción**| N/A | Modal de Detalle/Validación, Modal de Autenticación, Modal de Contribución. |
| **3. Perfil/Ranking** | `/ranking` | Vista de Ranking Global y por País, Perfil de Usuario. |

---

### 3. Flujo 1: Búsqueda y Visualización (MVP - No Logueado)

| Paso | Acción del Usuario | Reacción de SpotLoo | Lógica de Firebase/Mapbox |
| :--- | :--- | :--- | :--- |
| **3.1** | **Carga la Aplicación** | Muestra el **Modal de Búsqueda Inicial** (`"Ingresa una ciudad"`). | N/A (Bloquea la lectura de Firestore hasta obtener la ubicación). |
| **3.2** | **Busca Ciudad** (vía Modal o Header) | El mapa se centra y hace zoom en la ubicación solicitada. | **Mapbox Geocoding API** convierte el texto a coordenadas. |
| **3.3** | **Visualiza el Mapa** | Carga y muestra marcadores en el mapa. Los pines son verdes (validado) o amarillos con `?` (pendiente). | **Firestore Query:** Lee la colección `/bathrooms` dentro del rango de coordenadas visible. |
| **3.4** | **Clic en Marcador** | Abre el **Modal de Detalle del Baño**. | Carga todos los campos (`title`, `description`, `photoURL`, `averageRating`, `status`) del documento de baño seleccionado. |
| **3.5** | **Intenta Puntuar/Validar** | Muestra una alerta, cierra el modal de detalle y abre el **Modal de Autenticación**. | **Lógica Frontend:** Si `request.auth` es nulo, redirige a login. |

---

### 4. Flujo 2: Autenticación y Perfil

| Vista / Componente | Acción del Usuario | Lógica de Firebase | UX y Resultado |
| :--- | :--- | :--- | :--- |
| **Modal Autenticación** | **Registro** (Email, Pass, `username`, `country`) | 1. **Auth:** `createUserWithEmailAndPassword`. 2. **Firestore:** Crea documento en `/users/{UID}` con `totalPoints: 0`. | Muestra mensaje de éxito, se cierra, y el **Header** muestra el icono de perfil del usuario logueado. |
| **Modal Autenticación** | **Login** (Email, Pass) | **Auth:** `signInWithEmailAndPassword`. | Muestra mensaje de éxito, se cierra, y se desbloquea la funcionalidad de contribución. |
| **Header (Logueado)** | **Clic en Icono de Perfil** | N/A | Abre un **Menú de Usuario** con enlaces a "Mis Puntos" y "Cerrar Sesión" (`signOut`). |

---

### 5. Flujo 3: Contribución y Validación (Usuario Logueado)

#### 5.1. Aportar un Baño Nuevo

| Vista / Componente | Acción del Usuario | Lógica de Firebase | Integración Clave |
| :--- | :--- | :--- | :--- |
| **Botón Flotante "Añadir Baño"** | **Clic** (solo visible si está logueado) | N/A | Abre el **Modal de Contribución**. |
| **Modal Contribución** | **Rellena Formulario** (Título, Descripción, País, Foto, Coordenadas) y **Voto Inicial (1-5 Estrellas)**. | **Al Guardar:** 1. Sube la imagen a **Storage**. 2. Crea documento en `/bathrooms` con `status: 'pendiente'`. 3. Crea documento en `/ratings` con el voto inicial. 4. Incrementa `users.bathroomsAdded`. | El campo **Coordenadas** debe ser llenado al hacer clic en el mapa (UX recomendada). |

#### 5.2. Puntuación y Validación

| Vista / Componente | Acción del Usuario | Lógica de Firebase (Cloud Functions) | Resultado |
| :--- | :--- | :--- | :--- |
| **Modal Detalle** | **Puntúa (1-5 Estrellas)** | Crea un documento en `/ratings`. | **Lógica Backend:** Cloud Function se dispara, recalcula `bathrooms.averageRating` y `bathrooms.numVotes`. |
| **Modal Detalle** | **Clic en "Validar"** | Añade el `UID` del usuario al mapa `bathrooms.validations`. | **Lógica Backend:** Cloud Function se dispara. Si `validations.count >= 5`, cambia `bathrooms.status` a `'validado'` y **otorga puntos** a los `users.totalPoints` del creador y de los validadores. |

---

### 6. Diseño y UX (User Experience)

| Aspecto | Detalle de Diseño | Propósito UX |
| :--- | :--- | :--- |
| **Diseño General** | Minimalista, **Mobile-First**. Uso de **Tailwind CSS** para un *look* moderno y limpio. | Priorizar la usabilidad en dispositivos móviles, donde el mapa es la herramienta principal. |
| **Flujo de Modales**| Los Modales de **Detalle**, **Autenticación** y **Contribución** deben ser secuenciales (solo uno visible a la vez). | Evitar la sobrecarga cognitiva y guiar al usuario a través de un único camino de acción. |
| **Geocodificación** | El buscador debe tener autocompletado avanzado (ofrecido por Mapbox) para que el usuario encuentre su ciudad/calle rápidamente. | Reducir la fricción en la fase crítica de búsqueda. |
| **Feedback Visual**| Uso de *Spinners* o barras de progreso durante la carga de datos de Firebase o la subida de imágenes a Storage. | Asegurar al usuario que la aplicación está procesando su solicitud (evitar doble clic o frustración). |

Este funcional te da la hoja de ruta completa para desarrollar **SpotLoo**, cubriendo tanto la interfaz visible como la lógica de backend necesaria para la gamificación. ¿Qué parte específica del código te gustaría comenzar a desarrollar ahora (ej. la inicialización y el mapa, o el registro de usuarios)?