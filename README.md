# 🚽 SpotLoo

**Encuentra baños públicos cerca de ti**

SpotLoo es una aplicación web que te ayuda a localizar baños públicos en cualquier lugar del mundo. Con un mapa interactivo, sistema de calificaciones y validación comunitaria, nunca más tendrás que preocuparte por encontrar un baño limpio y accesible.

![SpotLoo Logo](https://img.shields.io/badge/SpotLoo-🚽-blue?style=for-the-badge)

## ✨ Características

### 🗺️ **Mapa Interactivo**
- Visualización en tiempo real de baños públicos
- Búsqueda por ciudad con geocodificación
- Marcadores diferenciados por estado de validación
- Navegación fluida con Mapbox GL JS

### 📍 **Sistema de Contribución**
- Añade nuevos baños públicos al mapa
- Selección de ubicación con clic en el mapa
- Información detallada: título, descripción, comodidades
- Subida de fotos opcional

### ⭐ **Calificaciones y Validación**
- Sistema de estrellas (1-5) para calificar baños
- Comentarios y reseñas de usuarios
- Validación comunitaria (requiere 3 validaciones)
- Una sola calificación por usuario por baño

### 🏆 **Ranking y Gamificación**
- Sistema de puntos por contribuciones
- Ranking de usuarios más activos
- Acciones recientes visibles
- Puntos por: crear baños (15), validar (10), calificar (5)

### 🔐 **Autenticación**
- Login y registro con email/contraseña
- Autenticación con Google
- Perfiles de usuario personalizados
- Acceso restringido a funciones premium

## 🚀 Tecnologías

### Frontend
- **Vue 3** - Framework progresivo de JavaScript
- **Composition API** - API moderna de Vue
- **Vite** - Herramienta de construcción rápida
- **Tailwind CSS** - Framework de CSS utilitario
- **Vue Router** - Enrutamiento del lado del cliente

### Backend y Servicios
- **Firebase Authentication** - Autenticación de usuarios
- **Cloud Firestore** - Base de datos NoSQL en tiempo real
- **Firebase Storage** - Almacenamiento de archivos
- **Mapbox GL JS** - Mapas interactivos y geocodificación

### Herramientas de Desarrollo
- **Vitest** - Framework de testing
- **Font Awesome** - Iconografía
- **PostCSS** - Procesamiento de CSS

## 📦 Instalación

### Prerrequisitos
- Node.js (v16 o superior)
- npm o yarn
- Cuenta de Firebase
- Token de Mapbox

### Configuración

1. **Clona el repositorio**
```bash
git clone https://github.com/tu-usuario/spotloo.git
cd spotloo
```

2. **Instala las dependencias**
```bash
npm install
```

3. **Configura las variables de entorno**
Crea un archivo `.env` en la raíz del proyecto:
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# Mapbox Configuration
VITE_MAPBOX_TOKEN=pk.tu_token_de_mapbox
```

4. **Ejecuta la aplicación**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 🏗️ Estructura del Proyecto

```
spotloo/
├── src/
│   ├── components/          # Componentes Vue reutilizables
│   │   ├── Header.vue       # Navegación y búsqueda
│   │   ├── DetailModal.vue  # Detalles del baño
│   │   ├── AuthModal.vue    # Login/registro
│   │   ├── ContribModal.vue # Añadir baño
│   │   └── FABAdd.vue       # Botón flotante
│   ├── views/               # Páginas principales
│   │   ├── MapView.vue      # Vista del mapa
│   │   └── RankingView.vue  # Ranking de usuarios
│   ├── services/            # Lógica de negocio
│   │   ├── firebase.js      # Configuración Firebase
│   │   ├── mapbox.js        # Servicios de mapas
│   │   ├── bathroomService.js # Gestión de baños
│   │   └── userService.js   # Gestión de usuarios
│   ├── router/              # Configuración de rutas
│   └── main.js              # Punto de entrada
├── public/                  # Archivos estáticos
└── docs/                    # Documentación
```

## 🎯 Funcionalidades Principales

### Mapa de Baños
- **Visualización**: Marcadores verdes (validados) y amarillos (pendientes)
- **Interacción**: Click en marcadores para ver detalles
- **Búsqueda**: Buscador de ciudades con autocompletado
- **Navegación**: Controles de zoom y ubicación

### Gestión de Baños
- **Creación**: Formulario completo con validación
- **Edición**: Actualización de información existente
- **Fotos**: Subida de imágenes con Firebase Storage
- **Estado**: Sistema de validación comunitaria

### Sistema de Usuarios
- **Autenticación**: Email/contraseña y Google OAuth
- **Perfiles**: Información personal y estadísticas
- **Ranking**: Sistema de puntos y contribuciones
- **Historial**: Acciones recientes y logros

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo

# Construcción
npm run build        # Build para producción
npm run preview      # Preview del build

# Testing
npm run test         # Ejecutar tests
npm run test:ui      # Tests con interfaz

# Linting
npm run lint         # Verificar código
npm run lint:fix     # Corregir automáticamente
```

## 🌍 Despliegue

### Firebase Hosting
```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login y configuración
firebase login
firebase init hosting

# Desplegar
npm run build
firebase deploy
```

### Netlify
```bash
# Build del proyecto
npm run build

# Desplegar carpeta dist/
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 👥 Equipo

- **Desarrollador Principal**: [Tu Nombre](https://github.com/tu-usuario)
- **Contribuidores**: Ver [CONTRIBUTORS.md](CONTRIBUTORS.md)

## 📞 Contacto

- **Email**: tu-email@ejemplo.com
- **Twitter**: [@tu_usuario](https://twitter.com/tu_usuario)
- **LinkedIn**: [Tu Perfil](https://linkedin.com/in/tu-perfil)

## 🙏 Agradecimientos

- [Mapbox](https://mapbox.com) por los mapas increíbles
- [Firebase](https://firebase.google.com) por el backend robusto
- [Vue.js](https://vuejs.org) por el framework excepcional
- [Tailwind CSS](https://tailwindcss.com) por el diseño hermoso

---

<div align="center">
  <p>Hecho con ❤️ para ayudar a la comunidad</p>
  <p>⭐ ¡Dale una estrella si te gusta el proyecto!</p>
</div>