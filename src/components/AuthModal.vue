<template>
  <div 
    v-if="isVisible" 
    class="modal-overlay"
    @click="closeModal"
  >
    <div 
      class="modal-content"
      @click.stop
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">
          {{ isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta' }}
        </h2>
        <button 
          @click="closeModal"
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- Content -->
      <div class="px-6 py-6">
        <!-- Loading state -->
        <div v-if="isLoading" class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Procesando...</p>
        </div>
        
        <!-- Auth form -->
        <form v-else @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Email field -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              class="input-field"
              placeholder="tu@email.com"
            />
          </div>
          
          <!-- Password field -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              :minlength="isLoginMode ? 1 : 6"
              class="input-field"
              :placeholder="isLoginMode ? 'Tu contraseña' : 'Mínimo 6 caracteres'"
            />
          </div>
          
          <!-- Confirm password field (only for signup) -->
          <div v-if="!isLoginMode">
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              required
              minlength="6"
              class="input-field"
              placeholder="Repite tu contraseña"
            />
          </div>
          
          <!-- Name field (only for signup) -->
          <div v-if="!isLoginMode">
            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="input-field"
              placeholder="Tu nombre completo"
            />
          </div>
          
          <!-- Error message -->
          <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-3">
            <p class="text-sm text-red-600">{{ errorMessage }}</p>
          </div>
          
          <!-- Success message -->
          <div v-if="successMessage" class="bg-green-50 border border-green-200 rounded-lg p-3">
            <p class="text-sm text-green-600">{{ successMessage }}</p>
          </div>
          
          <!-- Submit button -->
          <button 
            type="submit"
            :disabled="isLoading"
            class="w-full btn-primary"
          >
            {{ isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta' }}
          </button>
          
          <!-- Mode toggle -->
          <div class="text-center">
            <button 
              type="button"
              @click="toggleMode"
              class="text-sm text-primary-600 hover:text-primary-700 transition-colors"
            >
              {{ isLoginMode ? '¿No tienes cuenta? Crear una' : '¿Ya tienes cuenta? Iniciar sesión' }}
            </button>
          </div>
          
          <!-- Social login (optional) -->
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-gray-500">O continúa con</span>
            </div>
          </div>
          
          <button 
            type="button"
            @click="signInWithGoogle"
            class="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {{ isLoginMode ? 'Iniciar sesión con Google' : 'Registrarse con Google' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { signInWithEmail, signUpWithEmail, signInWithGoogle as signInWithGoogleService } from '../services/firebase.js'
import { addDocument } from '../services/firebase.js'

// Props
const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['close', 'success'])

// Reactive state
const isLoading = ref(false)
const isLoginMode = ref(true)
const errorMessage = ref('')
const successMessage = ref('')
const form = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  name: ''
})

// User state management
const saveUserToStorage = (user) => {
  const userData = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    lastLogin: new Date().toISOString()
  }
  localStorage.setItem('spotloo_user', JSON.stringify(userData))
  console.log('User saved to localStorage:', userData)
}

const clearUserFromStorage = () => {
  localStorage.removeItem('spotloo_user')
  console.log('User cleared from localStorage')
}

const showSuccessMessage = (message) => {
  successMessage.value = message
  setTimeout(() => {
    successMessage.value = ''
  }, 3000)
}

// Handle form submission
const handleSubmit = async () => {
  if (isLoading.value) return
  
  // Validation
  if (!isLoginMode.value && form.password !== form.confirmPassword) {
    errorMessage.value = 'Las contraseñas no coinciden'
    return
  }
  
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    if (isLoginMode.value) {
      // Sign in with email and password
      console.log('Signing in with:', form.email)
      const userCredential = await signInWithEmail(form.email, form.password)
      
      // Save user to localStorage
      saveUserToStorage(userCredential.user)
      
      showSuccessMessage('¡Bienvenido de nuevo!')
      emit('success')
      closeModal()
      resetForm()
      
    } else {
      // Sign up with email and password
      console.log('Signing up with:', form.email, form.name)
      const userCredential = await signUpWithEmail(form.email, form.password, form.name)
      
      // Create user document in Firestore
      try {
        await addDocument('users', {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: form.name,
          createdAt: new Date(),
          contributions: 0,
          points: 0,
          preferences: {
            notifications: true,
            publicProfile: true
          }
        })
        console.log('User document created in Firestore')
      } catch (firestoreError) {
        console.error('Error creating user document:', firestoreError)
        // Don't fail the registration if Firestore fails
      }
      
      // Save user to localStorage
      saveUserToStorage(userCredential.user)
      
      showSuccessMessage('¡Cuenta creada exitosamente!')
      emit('success')
      closeModal()
      resetForm()
    }
    
  } catch (error) {
    console.error('Auth error:', error)
    
    // Mensaje amigable por defecto
    let userFriendlyMessage = "Ha ocurrido un error inesperado. Inténtalo más tarde."
    
    // Manejo específico de errores según código de Firebase
    if (error.code === 'auth/invalid-credential') {
      userFriendlyMessage = "La contraseña o el correo electrónico son incorrectos. Verifica tus datos."
    } else if (error.code === 'auth/user-disabled') {
      userFriendlyMessage = "Tu cuenta ha sido deshabilitada."
    } else if (error.code === 'auth/too-many-requests') {
      userFriendlyMessage = "Acceso temporalmente bloqueado debido a demasiados intentos fallidos. Inténtalo más tarde."
    } else if (error.code === 'auth/user-not-found') {
      userFriendlyMessage = "No existe una cuenta con este correo electrónico."
    } else if (error.code === 'auth/wrong-password') {
      userFriendlyMessage = "La contraseña es incorrecta."
    } else if (error.code === 'auth/email-already-in-use') {
      userFriendlyMessage = "Ya existe una cuenta con este correo electrónico."
    } else if (error.code === 'auth/weak-password') {
      userFriendlyMessage = "La contraseña es demasiado débil. Debe tener al menos 6 caracteres."
    } else if (error.code === 'auth/invalid-email') {
      userFriendlyMessage = "El formato del correo electrónico no es válido."
    } else if (error.code === 'auth/operation-not-allowed') {
      userFriendlyMessage = "Este método de autenticación no está habilitado."
    } else if (error.code === 'auth/network-request-failed') {
      userFriendlyMessage = "Error de conexión. Verifica tu conexión a internet."
    }
    
    errorMessage.value = userFriendlyMessage
  } finally {
    isLoading.value = false
  }
}

// Sign in with Google
const signInWithGoogle = async () => {
  if (isLoading.value) return
  
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    console.log('Signing in with Google')
    const result = await signInWithGoogleService()
    
    // Check if user document exists, create if not
    try {
      // TODO: Check if user document exists in Firestore
      // For now, we'll create it if it doesn't exist
      await addDocument('users', {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        createdAt: new Date(),
        contributions: 0,
        points: 0,
        preferences: {
          notifications: true,
          publicProfile: true
        }
      })
      console.log('User document created/updated in Firestore')
    } catch (firestoreError) {
      console.error('Error creating user document:', firestoreError)
      // Don't fail the login if Firestore fails
    }
    
    // Save user to localStorage
    saveUserToStorage(result.user)
    
    showSuccessMessage('¡Bienvenido con Google!')
    emit('success')
    closeModal()
    resetForm()
    
  } catch (error) {
    console.error('Google auth error:', error)
    
    // Mensaje amigable por defecto
    let userFriendlyMessage = "Ha ocurrido un error al iniciar sesión con Google. Inténtalo más tarde."
    
    // Manejo específico de errores según código de Firebase
    if (error.code === 'auth/popup-closed-by-user') {
      userFriendlyMessage = "Has cerrado la ventana de inicio de sesión. Inténtalo de nuevo."
    } else if (error.code === 'auth/popup-blocked') {
      userFriendlyMessage = "El navegador ha bloqueado la ventana emergente. Por favor, habilita las ventanas emergentes."
    } else if (error.code === 'auth/cancelled-popup-request') {
      userFriendlyMessage = "Se canceló la solicitud de inicio de sesión."
    } else if (error.code === 'auth/account-exists-with-different-credential') {
      userFriendlyMessage = "Ya existe una cuenta con este correo usando otro método de inicio de sesión."
    } else if (error.code === 'auth/user-disabled') {
      userFriendlyMessage = "Tu cuenta ha sido deshabilitada."
    } else if (error.code === 'auth/too-many-requests') {
      userFriendlyMessage = "Acceso temporalmente bloqueado debido a demasiados intentos fallidos. Inténtalo más tarde."
    } else if (error.code === 'auth/network-request-failed') {
      userFriendlyMessage = "Error de conexión. Verifica tu conexión a internet."
    }
    
    errorMessage.value = userFriendlyMessage
  } finally {
    isLoading.value = false
  }
}

// Toggle between login and signup modes
const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value
  errorMessage.value = ''
  resetForm()
}

// Reset form
const resetForm = () => {
  form.email = ''
  form.password = ''
  form.confirmPassword = ''
  form.name = ''
  errorMessage.value = ''
  successMessage.value = ''
}

// Close modal
const closeModal = () => {
  emit('close')
  resetForm()
}
</script>
