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
          {{ isRatingModal ? 'Calificar Baño' : 'Detalles del Baño' }}
        </h2>
        <button 
          @click="isRatingModal ? cancelRating() : closeModal()"
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- Content -->
      <div class="px-6 py-4">
        <!-- Loading state -->
        <div v-if="isLoading" class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Cargando detalles...</p>
        </div>
        
        <!-- Rating modal content -->
        <div v-else-if="isRatingModal" class="space-y-6">
          <!-- Bathroom name -->
          <div class="text-center">
            <h3 class="text-lg font-semibold text-gray-900">{{ bathroom?.title }}</h3>
            <p class="text-sm text-gray-600">¿Cómo calificarías este baño?</p>
          </div>
          
          <!-- Star rating -->
          <div class="flex justify-center space-x-2">
            <button 
              v-for="star in 5" 
              :key="star"
              @click="setRating(star)"
              class="transition-colors duration-200 hover:scale-110 transform"
            >
              <svg 
                class="w-8 h-8"
                :class="star <= rating ? 'text-yellow-400' : 'text-gray-300'"
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          </div>
          
          <!-- Rating text -->
          <div class="text-center">
            <p class="text-sm text-gray-600">
              {{ rating === 0 ? 'Selecciona una calificación' : 
                  rating === 1 ? 'Muy malo' :
                  rating === 2 ? 'Malo' :
                  rating === 3 ? 'Regular' :
                  rating === 4 ? 'Bueno' : 'Excelente' }}
            </p>
          </div>
          
          <!-- Review text -->
          <div>
            <label for="review" class="block text-sm font-medium text-gray-700 mb-2">
              Comentario (opcional)
            </label>
            <textarea
              id="review"
              v-model="reviewText"
              rows="3"
              class="input-field resize-none"
              placeholder="Comparte tu experiencia con este baño..."
            ></textarea>
          </div>
          
          <!-- Action buttons -->
          <div class="flex space-x-3 pt-4">
            <button 
              @click="cancelRating"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              @click="submitRating"
              :disabled="isSubmittingRating || rating === 0"
              class="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isSubmittingRating">Enviando...</span>
              <span v-else>Enviar Calificación</span>
            </button>
          </div>
        </div>
        
        <!-- Bathroom details -->
        <div v-else-if="bathroom" class="space-y-6">
          <!-- Image -->
          <div v-if="bathroom.image" class="aspect-video bg-gray-200 rounded-lg overflow-hidden">
            <img 
              :src="bathroom.image" 
              :alt="bathroom.title"
              class="w-full h-full object-cover"
            />
          </div>
          
          <!-- Title and rating -->
          <div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">{{ bathroom.title }}</h3>
            <div class="flex items-center space-x-2">
              <div class="flex items-center">
                <svg 
                  v-for="star in 5" 
                  :key="star"
                  class="w-5 h-5"
                  :class="star <= bathroom.rating ? 'text-yellow-400' : 'text-gray-300'"
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <span class="text-sm text-gray-600">{{ bathroom.rating }}/5 ({{ bathroom.reviews }} reseñas)</span>
            </div>
          </div>
          
          <!-- Description -->
          <div>
            <h4 class="font-medium text-gray-900 mb-2">Descripción</h4>
            <p class="text-gray-600">{{ bathroom.description }}</p>
          </div>
          
          <!-- Location info -->
          <div>
            <h4 class="font-medium text-gray-900 mb-2">Ubicación</h4>
            <div class="space-y-2">
              <div class="flex items-center space-x-2 text-gray-600">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{{ bathroom.address }}</span>
              </div>
              <div class="flex items-center space-x-2 text-gray-600">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ bathroom.country }}</span>
              </div>
            </div>
          </div>
          
          <!-- Amenities -->
          <div v-if="bathroom.amenities && bathroom.amenities.length > 0">
            <h4 class="font-medium text-gray-900 mb-2">Comodidades</h4>
            <div class="flex flex-wrap gap-2">
              <span 
                v-for="amenity in bathroom.amenities" 
                :key="amenity"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {{ amenity }}
              </span>
            </div>
          </div>
          
          <!-- Action buttons -->
          <div class="flex space-x-3 pt-4 border-t border-gray-200">
            <button 
              v-if="!hasUserRated"
              @click="rateBathroom"
              class="flex-1 btn-primary"
            >
              Calificar
            </button>
            <div 
              v-else
              class="flex-1 px-4 py-2 bg-gray-100 rounded-lg text-gray-600 text-center flex items-center justify-center"
            >
              <i class="fa-solid fa-check mr-2"></i>
              Ya calificado ({{ userRating?.rating }}/5)
            </div>
            
            <!-- Validation button -->
            <button 
              v-if="canValidate"
              @click="validateBathroomAction"
              :disabled="isValidationLoading"
              class="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isValidationLoading">Validando...</span>
              <span v-else>
                <i class="fa-solid fa-check-circle mr-2"></i>
                Validar
              </span>
            </button>
            <div 
              v-else-if="hasUserValidatedBathroom"
              class="flex-1 px-4 py-2 bg-green-100 rounded-lg text-green-700 text-center flex items-center justify-center"
            >
              <i class="fa-solid fa-check-circle mr-2"></i>
              Validado
            </div>
            
            <button 
              @click="shareLocation"
              class="flex-1 btn-secondary"
            >
              Compartir
            </button>
          </div>
        </div>
        
        <!-- Error state -->
        <div v-else class="text-center py-8">
          <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p class="text-gray-600">No se pudieron cargar los detalles</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { getBathroomDetails, rateBathroom as rateBathroomService, checkUserRating, validateBathroom, hasUserValidated } from '../services/bathroomService.js'
import { addDocument, getDocument } from '../services/firebase.js'
import { currentUser } from '../services/userService.js'

// Props
const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  },
  bathroom: {
    type: Object,
    default: null
  }
})

// Emits
const emit = defineEmits(['close'])

// Reactive state
const isLoading = ref(false)
const bathroom = ref(null)
const isRatingModal = ref(false)
const rating = ref(0)
const reviewText = ref('')
const isSubmittingRating = ref(false)
const hasUserRated = ref(false)
const userRating = ref(null)
const hasUserValidatedBathroom = ref(false)
const isValidationLoading = ref(false)
const canValidate = ref(false)

// Watch for bathroom changes
watch(() => props.bathroom, async (newBathroom) => {
  if (newBathroom && props.isVisible) {
    await loadBathroomDetails(newBathroom)
  }
}, { immediate: true })

// Watch for modal visibility changes
watch(() => props.isVisible, async (isVisible) => {
  if (isVisible && props.bathroom) {
    await loadBathroomDetails(props.bathroom)
  } else if (!isVisible) {
    // Reset state when modal closes
    bathroom.value = null
    hasUserRated.value = false
    userRating.value = null
  }
})

// Watch for user changes
watch(() => currentUser.value, async (newUser) => {
  // Reset rating and validation state when user changes
  hasUserRated.value = false
  userRating.value = null
  hasUserValidatedBathroom.value = false
  canValidate.value = false
  
  // Reload bathroom details to check new user's rating
  if (bathroom.value && props.isVisible) {
    await loadBathroomDetails(bathroom.value)
  }
})

// Load bathroom details
const loadBathroomDetails = async (bathroomData) => {
  if (!bathroomData) return
  
  isLoading.value = true
  try {
    console.log('Loading bathroom details for:', bathroomData.title)
    
    // Use the bathroom data directly from the map marker
    bathroom.value = {
      id: bathroomData.id,
      title: bathroomData.title || 'Sin título',
      description: bathroomData.description || 'Sin descripción disponible',
      address: (bathroomData.address && bathroomData.address.trim()) || 'Dirección no disponible',
      country: bathroomData.country || 'País no disponible',
      rating: bathroomData.rating || 0,
      reviews: bathroomData.reviews || 0,
      image: bathroomData.photoUrl || bathroomData.image || null,
      amenities: bathroomData.amenities || [],
      coordinates: bathroomData.coordinates,
      status: bathroomData.status || 'pending',
      validated: bathroomData.validated || false
    }
    
    
    // Check if current user has already rated this bathroom
    if (currentUser.value) {
      console.log('DetailModal: Current user:', currentUser.value.uid, currentUser.value.email)
      const existingRating = await checkUserRating(bathroomData.id, currentUser.value.uid)
      hasUserRated.value = !!existingRating
      userRating.value = existingRating
      console.log('DetailModal: Final result - hasUserRated:', hasUserRated.value)
      
      // Check validation status
      const userValidated = await hasUserValidated(bathroomData.id, currentUser.value.uid)
      hasUserValidatedBathroom.value = userValidated
      canValidate.value = bathroomData.createdBy !== currentUser.value.uid && !userValidated
    } else {
      console.log('DetailModal: No current user found')
    }
    
  } catch (error) {
    console.error('Error loading bathroom details:', error)
  } finally {
    isLoading.value = false
  }
}

// Close modal
const closeModal = () => {
  // Reset all state when closing
  isRatingModal.value = false
  rating.value = 0
  reviewText.value = ''
  hasUserRated.value = false
  userRating.value = null
  hasUserValidatedBathroom.value = false
  canValidate.value = false
  emit('close')
}

// Rate bathroom
const rateBathroom = () => {
  if (hasUserRated.value) {
    return
  }
  
  isRatingModal.value = true
}

// Set rating
const setRating = (value) => {
  rating.value = value
}

// Submit rating
const submitRating = async () => {
  if (rating.value === 0) {
    return
  }
  
  if (!currentUser.value) {
    alert('Debes iniciar sesión para calificar')
    return
  }
  
  isSubmittingRating.value = true
  
  try {
    // Ensure we have the latest displayName from Firestore
    let displayName = currentUser.value.displayName
    if (!displayName) {
      try {
        const userDoc = await getDocument('users', currentUser.value.uid)
        if (userDoc && userDoc.displayName) {
          displayName = userDoc.displayName
          console.log('DisplayName loaded from Firestore:', displayName)
        }
      } catch (error) {
        console.warn('Could not load displayName from Firestore:', error.message)
      }
    }
    
    console.log('Submitting rating:', {
      bathroomId: props.bathroom?.id,
      rating: rating.value,
      review: reviewText.value,
      userUID: currentUser.value.uid,
      displayName: displayName
    })
    
    // Create rating document in Firestore
    const ratingData = {
      bathroomID: props.bathroom?.id,
      userUID: currentUser.value.uid,
      rating: rating.value,
      comment: reviewText.value.trim() || '',
      createdAt: new Date(),
      userName: displayName || 'Usuario anónimo'
    }
    
    // Add to ratings collection
    await addDocument('ratings', ratingData)
    console.log('Rating saved to Firestore')
    
    // Update bathroom rating statistics
    await rateBathroomService(
      props.bathroom?.id,
      rating.value,
      currentUser.value.uid,
      reviewText.value.trim()
    )
    
    // Reset and close rating modal
    rating.value = 0
    reviewText.value = ''
    isRatingModal.value = false
    hasUserRated.value = true
    
    console.log('✅ Valoración enviada correctamente')
    
    // Close main modal after successful rating
    closeModal()
    
  } catch (error) {
    console.error('❌ Error al enviar la valoración:', error)
    
    // Log specific error type
    if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
      console.error('Error de permisos: El usuario no tiene permisos suficientes')
    }
    
    // Reset and close modal even on error
    rating.value = 0
    reviewText.value = ''
    isRatingModal.value = false
    closeModal()
    
  } finally {
    isSubmittingRating.value = false
  }
}

// Cancel rating
const cancelRating = () => {
  isRatingModal.value = false
  rating.value = 0
  reviewText.value = ''
}

// Validate bathroom
const validateBathroomAction = async () => {
  if (!currentUser.value) {
    alert('Debes iniciar sesión para validar baños')
    return
  }
  
  isValidationLoading.value = true
  
  try {
    await validateBathroom(props.bathroom?.id, currentUser.value.uid)
    
    // Update local state
    hasUserValidatedBathroom.value = true
    canValidate.value = false
    
    // Update bathroom status in local data
    if (bathroom.value) {
      bathroom.value.status = 'validated'
    }
    
    
  } catch (error) {
    console.error('Error validating bathroom:', error)
    alert(error.message || 'Error al validar el baño')
  } finally {
    isValidationLoading.value = false
  }
}

// Share location
const shareLocation = () => {
  // TODO: Implement share functionality
  console.log('Share location:', props.bathroom?.id)
  
  if (navigator.share) {
    navigator.share({
      title: bathroom.value?.title,
      text: `Mira este baño público en SpotLoo: ${bathroom.value?.title}`,
      url: window.location.href
    })
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(window.location.href)
    // TODO: Show success message
  }
}
</script>
