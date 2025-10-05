<template>
  <header class="fixed top-0 left-0 right-0 bg-white shadow-sm z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <div class="flex items-center">
          <router-link to="/" class="flex items-center space-x-2">
            <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
              </svg>
            </div>
            <span class="text-xl font-bold text-gray-900">SpotLoo</span>
          </router-link>
        </div>
        
        <!-- Search bar -->
        <div class="flex-1 max-w-lg mx-8">
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              v-model="searchQuery"
              @keyup.enter="searchCity"
              type="text"
              placeholder="Buscar ciudad..."
              class="input-field pl-10 pr-4 py-2 text-sm"
            />
          </div>
        </div>
        
        <!-- Navigation and profile -->
        <div class="flex items-center space-x-4">
          <!-- Navigation links -->
          <nav class="hidden md:flex space-x-8">
            <router-link 
              to="/" 
              class="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
              :class="{ 'text-primary-600': $route.name === 'MapView' }"
            >
              Mapa
            </router-link>
            <router-link 
              v-if="isLoggedIn"
              to="/ranking" 
              class="text-gray-600 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors"
              :class="{ 'text-primary-600': $route.name === 'RankingView' }"
            >
              Ranking
            </router-link>
          </nav>
          
          <!-- Profile button -->
          <div v-if="isLoggedIn" class="relative">
            <button 
              @click="toggleProfileMenu"
              class="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                </svg>
              </div>
              <span class="hidden sm:block text-sm font-medium">Mi Perfil</span>
            </button>
            
            <!-- Profile dropdown menu -->
            <div 
              v-if="showProfileMenu"
              class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
            >
              <div class="py-2">
                <button 
                  @click="handleLogout"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
          
          <button 
            v-else
            @click="toggleAuthModal"
            class="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors"
          >
            <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
              </svg>
            </div>
            <span class="hidden sm:block text-sm font-medium">Iniciar Sesión</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Mobile navigation -->
    <div v-if="showMobileMenu" class="md:hidden border-t border-gray-200 bg-white">
      <div class="px-4 py-2 space-y-1">
        <router-link 
          to="/" 
          class="block px-3 py-2 text-gray-600 hover:text-primary-600 text-sm font-medium"
          @click="showMobileMenu = false"
        >
          Mapa
        </router-link>
        <router-link 
          v-if="isLoggedIn"
          to="/ranking" 
          class="block px-3 py-2 text-gray-600 hover:text-primary-600 text-sm font-medium"
          @click="showMobileMenu = false"
        >
          Ranking
        </router-link>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { geocodeCity } from '../services/mapbox.js'
import { isLoggedIn } from '../services/userService.js'
import { signOutUser } from '../services/firebase.js'

// Emits
const emit = defineEmits(['open-auth'])

// Reactive state
const searchQuery = ref('')
const showMobileMenu = ref(false)
const showProfileMenu = ref(false)

// Router instance
const router = useRouter()

// Search functionality
const searchCity = async () => {
  if (!searchQuery.value.trim()) return
  
  try {
    console.log('Searching for city:', searchQuery.value)
    
    const coordinates = await geocodeCity(searchQuery.value)
    console.log('Found coordinates:', coordinates)
    
    // Navigate to map view and center on coordinates
    if (router.currentRoute.value.name !== 'MapView') {
      router.push('/')
    }
    
    // Store coordinates in sessionStorage for the map to use
    sessionStorage.setItem('searchCoordinates', JSON.stringify({
      longitude: coordinates.longitude,
      latitude: coordinates.latitude,
      place_name: coordinates.place_name
    }))
    
    // If already on map view, trigger a custom event to center the map
    if (router.currentRoute.value.name === 'MapView') {
      window.dispatchEvent(new CustomEvent('searchCoordinatesUpdated', {
        detail: {
          longitude: coordinates.longitude,
          latitude: coordinates.latitude,
          place_name: coordinates.place_name
        }
      }))
    }
    
    // Clear search input
    searchQuery.value = ''
    
  } catch (error) {
    console.error('Error searching city:', error)
    // TODO: Show error message to user
  }
}

// Auth modal toggle
const toggleAuthModal = () => {
  console.log('Toggle auth modal')
  emit('open-auth')
}

// Profile menu toggle
const toggleProfileMenu = () => {
  showProfileMenu.value = !showProfileMenu.value
}

// Logout function
const handleLogout = async () => {
  try {
    await signOutUser()
    console.log('User logged out successfully')
    // Clear any cached data
    localStorage.removeItem('spotloo_user')
    // Reload page to reset all state
    window.location.reload()
  } catch (error) {
    console.error('Error logging out:', error)
  }
}

// Close profile menu when clicking outside
const handleClickOutside = (event) => {
  if (!event.target.closest('.relative')) {
    showProfileMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
