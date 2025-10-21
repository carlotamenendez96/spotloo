<template>
  <div class="min-h-screen bg-gray-50 pt-20 pb-6">
    <div class="max-w-4xl mx-auto px-4">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Ranking de Usuarios</h1>
        <p class="text-gray-600">Los usuarios más activos de SpotLoo</p>
      </div>
      
      <!-- Loading state -->
      <div v-if="isLoading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Cargando ranking...</p>
      </div>
      
      <!-- Ranking content -->
      <div v-else class="space-y-4">
        <!-- User ranking list -->
        <div class="bg-white rounded-lg shadow-sm overflow-hidden">
          <div class="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 class="text-base sm:text-lg font-semibold text-gray-900">Top Contribuidores</h2>
          </div>
          
          <div class="divide-y divide-gray-200">
            <div 
              v-for="(user, index) in topUsers" 
              :key="user.id"
              class="px-4 sm:px-6 py-4 hover:bg-gray-50"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                  <!-- Rank badge -->
                  <div 
                    class="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0"
                    :class="getRankBadgeClass(index)"
                  >
                    {{ index + 1 }}
                  </div>
                  
                  <!-- User avatar -->
                  <div class="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img 
                      v-if="user.avatar" 
                      :src="user.avatar" 
                      :alt="user.name"
                      class="w-full h-full object-cover"
                    >
                    <svg v-else class="w-4 h-4 sm:w-6 sm:h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  
                  <!-- User info -->
                  <div class="flex-1 min-w-0">
                    <h3 class="font-medium text-gray-900 text-sm sm:text-base truncate">{{ user.name }}</h3>
                    <p class="text-xs sm:text-sm text-gray-500">{{ user.contributions }} contribuciones</p>
                  </div>
                </div>
                
                <!-- Points -->
                <div class="text-right flex-shrink-0 ml-2">
                  <p class="text-base sm:text-lg font-bold text-primary-600">{{ user.points }}</p>
                  <p class="text-xs text-gray-500">puntos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Bathroom statistics -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div class="bg-white rounded-lg shadow-sm p-6 text-center">
            <div class="text-3xl font-bold text-primary-600 mb-2">{{ totalBathrooms }}</div>
            <p class="text-gray-600">Baños registrados</p>
          </div>
          
          <div class="bg-white rounded-lg shadow-sm p-6 text-center">
            <div class="text-3xl font-bold text-green-600 mb-2">{{ totalContributors }}</div>
            <p class="text-gray-600">Contribuidores</p>
          </div>
          
          <div class="bg-white rounded-lg shadow-sm p-6 text-center">
            <div class="text-3xl font-bold text-orange-600 mb-2">{{ totalCountries }}</div>
            <p class="text-gray-600">Países</p>
          </div>
        </div>
        
        <!-- Recent contributions -->
        <div class="bg-white rounded-lg shadow-sm overflow-hidden mt-8">
          <div class="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 class="text-base sm:text-lg font-semibold text-gray-900">Contribuciones Recientes</h2>
          </div>
          
          <div class="divide-y divide-gray-200">
            <div 
              v-for="contribution in paginatedContributions" 
              :key="contribution.id"
              class="px-4 sm:px-6 py-4"
            >
              <div class="flex items-start space-x-3 sm:space-x-4">
                <!-- Avatar -->
                <div class="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg class="w-4 h-4 sm:w-6 sm:h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                  </svg>
                </div>
                
                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2">
                    <div class="flex-1 min-w-0">
                      <h3 class="font-medium text-gray-900 text-sm sm:text-base break-words">{{ contribution.title }}</h3>
                      <p class="text-xs sm:text-sm text-gray-500 mt-1">
                        por {{ contribution.author }} • {{ formatDate(contribution.createdAt) }}
                      </p>
                    </div>
                    
                    <!-- Points badge -->
                    <div class="flex-shrink-0">
                      <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        +{{ contribution.points }} pts
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Empty state -->
            <div v-if="recentContributions.length === 0" class="px-4 sm:px-6 py-8 text-center text-gray-500">
              No hay contribuciones recientes
            </div>
          </div>
          
          <!-- Pagination controls -->
          <div v-if="totalPages > 1" class="px-4 sm:px-6 py-4 border-t border-gray-200">
            <div class="text-sm text-gray-600 mb-3 text-center">
              Página {{ currentPage }} de {{ totalPages }} ({{ recentContributions.length }} contribuciones)
            </div>
            
            <div class="flex justify-center items-center space-x-1">
              <!-- Previous button -->
              <button 
                @click="previousPage"
                :disabled="currentPage === 1"
                class="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              
              <!-- Page numbers -->
              <button
                v-for="page in visiblePages"
                :key="page"
                @click="goToPage(page)"
                :class="[
                  'px-3 py-1 border rounded-md text-sm font-medium transition-colors',
                  page === currentPage 
                    ? 'bg-primary-600 text-white border-primary-600' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                ]"
              >
                {{ page }}
              </button>
              
              <!-- Next button -->
              <button 
                @click="nextPage"
                :disabled="currentPage === totalPages"
                class="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { loadRankingData as loadRankingDataFromService, loadBathrooms } from '../services/bathroomService.js'
import { isLoggedIn, getUserRanking, getRecentActions } from '../services/userService.js'
import { useRouter } from 'vue-router'

// Router instance
const router = useRouter()

// Reactive state
const isLoading = ref(true)
const topUsers = ref([])
const totalBathrooms = ref(0)
const totalContributors = ref(0)
const totalCountries = ref(0)
const recentContributions = ref([])

// Pagination state
const currentPage = ref(1)
const itemsPerPage = 10

// Check authentication
onMounted(() => {
  if (!isLoggedIn.value) {
    console.log('User not logged in, redirecting to map')
    router.push('/')
    return
  }
  
  loadRankingData()
})

// Load ranking data
const loadRankingData = async () => {
  try {
    console.log('Loading ranking data...')
    
    // Load bathrooms first (should work)
    const bathrooms = await loadBathrooms()
    
    // Initialize with empty data
    let users = []
    let actions = []
    
    // Try to load user ranking and actions (may fail due to permissions)
    try {
      users = await getUserRanking()
    } catch (error) {
      console.warn('Could not load user ranking:', error.message)
      // Use mock data for now
      users = [
        { uid: 'mock1', displayName: 'Usuario 1', points: 25, contributions: 3 },
        { uid: 'mock2', displayName: 'Usuario 2', points: 15, contributions: 2 },
        { uid: 'mock3', displayName: 'Usuario 3', points: 10, contributions: 1 }
      ]
    }
    
    try {
      // Get more actions to support pagination (get enough for multiple pages)
      actions = await getRecentActions(100)
    } catch (error) {
      console.warn('Could not load recent actions:', error.message)
      // Use mock data for now
      actions = [
        {
          id: 'mock1',
          description: 'Validó el baño "Gasolinera Shell"',
          points: 10,
          createdAt: new Date(),
          action: 'validation'
        },
        {
          id: 'mock2', 
          description: 'Creó el baño "Baño prueba"',
          points: 15,
          createdAt: new Date(Date.now() - 3600000),
          action: 'contribution'
        }
      ]
    }
    
    // Process user data (limit to top 10 users)
    topUsers.value = users
      .slice(0, 10)
      .map(user => ({
        id: user.uid || user.id,
        name: user.displayName || 'Usuario anónimo',
        points: user.points || 0,
        contributions: user.contributions || 0,
        avatar: user.photoURL || null
      }))
    
    // Calculate statistics
    totalBathrooms.value = bathrooms.length
    totalContributors.value = users.length
    
    // Count unique countries
    const countries = new Set(bathrooms.map(b => b.country).filter(Boolean))
    totalCountries.value = countries.size
    
    // Process recent actions
    recentContributions.value = actions.map(action => ({
      id: action.id,
      title: action.description,
      author: action.userName || 'Usuario anónimo',
      points: action.points,
      createdAt: action.createdAt,
      action: action.action
    }))
    
    isLoading.value = false
  } catch (error) {
    console.error('Error loading ranking data:', error)
    isLoading.value = false
  }
}

// Computed properties for pagination
const totalPages = computed(() => {
  return Math.ceil(recentContributions.value.length / itemsPerPage)
})

const paginatedContributions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return recentContributions.value.slice(start, end)
})

// Computed property for visible page numbers (max 10)
const visiblePages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const maxVisible = 10
  
  // If total pages is less than or equal to maxVisible, show all
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  
  // Calculate start and end of visible range
  let start = Math.max(1, current - Math.floor(maxVisible / 2))
  let end = Math.min(total, start + maxVisible - 1)
  
  // Adjust start if we're near the end
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

// Pagination functions
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// Helper functions
const getRankBadgeClass = (index) => {
  switch (index) {
    case 0:
      return 'bg-yellow-400 text-yellow-900'
    case 1:
      return 'bg-gray-300 text-gray-700'
    case 2:
      return 'bg-orange-300 text-orange-900'
    default:
      return 'bg-gray-100 text-gray-600'
  }
}

const formatDate = (date) => {
  if (!date) return 'hace un momento'
  
  const now = new Date()
  const actionDate = date.toDate ? date.toDate() : new Date(date)
  const diffInSeconds = Math.floor((now - actionDate) / 1000)
  
  if (diffInSeconds < 60) {
    return 'hace un momento'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `hace ${hours} hora${hours > 1 ? 's' : ''}`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `hace ${days} día${days > 1 ? 's' : ''}`
  }
}
</script>
