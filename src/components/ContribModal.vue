<template>
  <div 
    v-if="isVisible" 
    class="modal-overlay"
    @click="closeModal"
  >
    <div 
      class="modal-content max-w-2xl"
      @click.stop
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">Añadir Baño Público</h2>
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
          <p class="text-gray-600">Guardando baño...</p>
        </div>
        
        <!-- Contribution form -->
        <form v-else @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Title field -->
          <div>
            <label for="title" class="block text-sm font-medium text-gray-700 mb-1">
              Título *
            </label>
            <input
              id="title"
              v-model="form.title"
              type="text"
              required
              maxlength="100"
              class="input-field"
              placeholder="Ej: Baño público en Plaza Mayor"
            />
            <p class="text-xs text-gray-500 mt-1">{{ form.title.length }}/100 caracteres</p>
          </div>
          
          <!-- Description field -->
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-1">
              Descripción *
            </label>
            <textarea
              id="description"
              v-model="form.description"
              required
              maxlength="500"
              rows="3"
              class="input-field resize-none"
              placeholder="Describe el baño, su estado, accesibilidad, etc."
            ></textarea>
            <p class="text-xs text-gray-500 mt-1">{{ form.description.length }}/500 caracteres</p>
          </div>
          
          <!-- Country field -->
          <div>
            <label for="country" class="block text-sm font-medium text-gray-700 mb-1">
              País *
            </label>
            <select
              id="country"
              v-model="form.country"
              required
              class="input-field"
            >
              <option value="">Selecciona un país</option>
              <option 
                v-for="country in countries" 
                :key="country.code"
                :value="country.name"
              >
                {{ country.name }}
              </option>
            </select>
          </div>
          
          <!-- Address field -->
          <div>
            <label for="address" class="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <input
              id="address"
              v-model="form.address"
              type="text"
              class="input-field"
              placeholder="Dirección específica (opcional)"
            />
          </div>
          
          <!-- Coordinates section -->
          <div class="border border-gray-200 rounded-lg p-4">
            <h3 class="text-sm font-medium text-gray-700 mb-3">Ubicación en el mapa</h3>
            
            <!-- Map preview -->
            <div class="aspect-video bg-gray-100 rounded-lg mb-4 relative">
              <div 
                id="contrib-map" 
                class="w-full h-full rounded-lg"
                style="min-height: 200px;"
              ></div>
              <div class="absolute top-2 left-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs text-gray-600">
                Haz clic en el mapa para seleccionar la ubicación
              </div>
            </div>
            
            <!-- Coordinate inputs -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="latitude" class="block text-xs font-medium text-gray-700 mb-1">
                  Latitud
                </label>
                <input
                  id="latitude"
                  v-model.number="form.latitude"
                  type="number"
                  step="any"
                  class="input-field text-sm"
                  placeholder="40.4168"
                />
              </div>
              <div>
                <label for="longitude" class="block text-xs font-medium text-gray-700 mb-1">
                  Longitud
                </label>
                <input
                  id="longitude"
                  v-model.number="form.longitude"
                  type="number"
                  step="any"
                  class="input-field text-sm"
                  placeholder="-3.7038"
                />
              </div>
            </div>
            
            <!-- Get current location button -->
            <button 
              type="button"
              @click="getCurrentLocation"
              class="mt-3 text-sm text-primary-600 hover:text-primary-700 transition-colors"
            >
              📍 Usar mi ubicación actual
            </button>
          </div>
          
          <!-- Photo upload -->
          <div>
            <label for="photo" class="block text-sm font-medium text-gray-700 mb-1">
              Foto del baño
            </label>
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                id="photo"
                ref="photoInput"
                type="file"
                accept="image/*"
                @change="handlePhotoUpload"
                class="hidden"
              />
              
              <div v-if="!form.photo" @click="$refs.photoInput.click()" class="cursor-pointer">
                <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p class="text-sm text-gray-600">Haz clic para subir una foto</p>
                <p class="text-xs text-gray-500 mt-1">PNG, JPG hasta 5MB</p>
              </div>
              
              <div v-else class="space-y-3">
                <img :src="form.photoPreview" alt="Preview" class="w-full h-32 object-cover rounded-lg" />
                <button 
                  type="button"
                  @click="removePhoto"
                  class="text-sm text-red-600 hover:text-red-700 transition-colors"
                >
                  Eliminar foto
                </button>
              </div>
            </div>
          </div>
          
          <!-- Amenities -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Comodidades (opcional)
            </label>
            <div class="grid grid-cols-2 gap-2">
              <label 
                v-for="amenity in availableAmenities" 
                :key="amenity"
                class="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  v-model="form.amenities"
                  :value="amenity"
                  type="checkbox"
                  class="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span class="text-sm text-gray-700">{{ amenity }}</span>
              </label>
            </div>
          </div>
          
          <!-- Error message -->
          <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-3">
            <p class="text-sm text-red-600">{{ errorMessage }}</p>
          </div>
          
          <!-- Submit buttons -->
          <div class="flex space-x-3 pt-4 border-t border-gray-200">
            <button 
              type="button"
              @click="closeModal"
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              :disabled="!isFormValid"
              class="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Añadir Baño
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { createBathroom } from '../services/bathroomService.js'
import { isLoggedIn, currentUser } from '../services/userService.js'
import { useRouter } from 'vue-router'
import { initMap, destroyMap, getMapInstanceById, reverseGeocode } from '../services/mapbox.js'
import mapboxgl from 'mapbox-gl'
import { useModal } from '../composables/useModal.js'

const { openAuthModal } = useModal()

// Props
const props = defineProps({
  isVisible: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['close', 'success'])

// Router instance
const router = useRouter()

// Reactive state
const isLoading = ref(false)
const errorMessage = ref('')
const mapInstance = ref(null)
const selectedMarker = ref(null)
const photoInput = ref(null)

// Check authentication on mount
onMounted(() => {
  if (!isLoggedIn.value) {
    console.log('User not logged in, closing modal')
    emit('close')
    router.push('/')
  }
})

// Initialize map when modal opens
const initializeMap = async () => {
  if (mapInstance.value) return
  
  try {
    mapInstance.value = await initMap('contrib-map', {
      center: [form.longitude || -5.6557568, form.latitude || 43.5453952],
      zoom: 15
    })
    
    // Add click event listener to map
    mapInstance.value.on('click', async (e) => {
      const { lng, lat } = e.lngLat
      
      // Update form coordinates
      form.longitude = lng
      form.latitude = lat
      
      // Get address from coordinates using reverse geocoding
      try {
        const addressData = await reverseGeocode(lng, lat)
        
        // Update form address with the real address
        if (addressData.place_name) {
          form.address = addressData.place_name
        }
      } catch (error) {
        console.error('Error getting address:', error)
        // Don't fail if geocoding fails, just continue without address
      }
      
      // Remove existing marker
      if (selectedMarker.value) {
        selectedMarker.value.remove()
      }
      
      // Add new marker
      selectedMarker.value = new mapboxgl.Marker({
        color: '#3B82F6'
      })
        .setLngLat([lng, lat])
        .addTo(mapInstance.value)
    })
    
    console.log('Contrib map initialized')
  } catch (error) {
    console.error('Error initializing contrib map:', error)
  }
}

// Watch for modal visibility changes
watch(() => props.isVisible, async (isVisible) => {
  if (isVisible) {
    // Wait for DOM to be ready
    await nextTick()
    // Initialize map after a short delay to ensure container is rendered
    setTimeout(() => {
      initializeMap()
    }, 100)
  } else {
    // Cleanup modal map when modal closes
    if (mapInstance.value) {
      destroyMap('contrib-map') // Only destroy the modal map, not the main map
      mapInstance.value = null
      selectedMarker.value = null
    }
  }
})

// Cleanup map when modal closes
onUnmounted(() => {
  if (mapInstance.value) {
    destroyMap('contrib-map') // Only destroy the modal map, not the main map
    mapInstance.value = null
    selectedMarker.value = null
  }
})
const form = reactive({
  title: '',
  description: '',
  country: '',
  address: '',
  latitude: null,
  longitude: null,
  photo: null,
  photoPreview: null,
  amenities: []
})

// Available amenities
const availableAmenities = [
  'Gratuito',
  'Accesible',
  'Limpio',
  'Papel higiénico',
  'Secador de manos',
  'Cambiador',
  'Seguro',
  '24 horas'
]

// Countries list (simplified)
const countries = [
  { code: 'ES', name: 'España' },
  { code: 'FR', name: 'Francia' },
  { code: 'IT', name: 'Italia' },
  { code: 'DE', name: 'Alemania' },
  { code: 'GB', name: 'Reino Unido' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'MX', name: 'México' },
  { code: 'AR', name: 'Argentina' },
  { code: 'BR', name: 'Brasil' },
  { code: 'CL', name: 'Chile' }
]

// Computed
const isFormValid = computed(() => {
  return form.title.trim() && 
         form.description.trim() && 
         form.country && 
         form.latitude !== null && 
         form.longitude !== null
})

// Handle form submission
const handleSubmit = async () => {
  if (!isFormValid.value || isLoading.value) return
  
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    // Check if user is logged in
    if (!currentUser.value?.uid) {
      closeModal()
      openAuthModal()
      return
    }
    
    console.log('Creating bathroom with data:', {
      title: form.title.trim(),
      description: form.description.trim(),
      country: form.country,
      address: form.address.trim(),
      latitude: form.latitude,
      longitude: form.longitude,
      amenities: form.amenities
    })
    
    const bathroomData = {
      title: form.title.trim(),
      description: form.description.trim(),
      country: form.country,
      address: form.address.trim() || null, // Save as null if empty
      coordinates: {
        latitude: form.latitude,
        longitude: form.longitude
      },
      amenities: form.amenities,
      photo: form.photo,
      createdBy: currentUser.value.uid,
      createdAt: new Date(),
      rating: 0,
      reviews: 0,
      totalRating: 0,
      status: 'pending', // New bathrooms start as pending
      validated: false
    }
    
    await createBathroom(bathroomData)
    
    // Success
    emit('success')
    closeModal()
    resetForm()
  } catch (error) {
    console.error('Error creating bathroom:', error)
    errorMessage.value = error.message || 'Ha ocurrido un error al crear el baño'
  } finally {
    isLoading.value = false
  }
}

// Handle photo upload
const handlePhotoUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    errorMessage.value = 'La foto debe ser menor a 5MB'
    return
  }
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    errorMessage.value = 'Solo se permiten archivos de imagen'
    return
  }
  
  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    form.photoPreview = e.target.result
  }
  reader.readAsDataURL(file)
  
  form.photo = file
  errorMessage.value = ''
}

// Remove photo
const removePhoto = () => {
  form.photo = null
  form.photoPreview = null
  if (photoInput.value) {
    photoInput.value.value = ''
  }
}

// Get current location
const getCurrentLocation = async () => {
  if (!navigator.geolocation) {
    errorMessage.value = 'Geolocalización no soportada por este navegador'
    return
  }
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      form.latitude = position.coords.latitude
      form.longitude = position.coords.longitude
      
      // Get address from current location coordinates
      try {
        console.log('Getting address for current location:', position.coords.longitude, position.coords.latitude)
        const addressData = await reverseGeocode(position.coords.longitude, position.coords.latitude)
        console.log('Current location address data:', addressData)
        
        // Update form address with the real address
        if (addressData.place_name) {
          form.address = addressData.place_name
          console.log('Current location address set to:', form.address)
        }
      } catch (error) {
        console.error('Error getting current location address:', error)
        // Don't fail if geocoding fails, just continue without address
      }
      
      errorMessage.value = ''
    },
    (error) => {
      console.error('Error getting location:', error)
      errorMessage.value = 'No se pudo obtener tu ubicación'
    }
  )
}

// Reset form
const resetForm = () => {
  form.title = ''
  form.description = ''
  form.country = ''
  form.address = ''
  form.latitude = null
  form.longitude = null
  form.photo = null
  form.photoPreview = null
  form.amenities = []
  errorMessage.value = ''
}

// Close modal
const closeModal = () => {
  emit('close')
  resetForm()
}
</script>
