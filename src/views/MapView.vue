<template>
  <div class="fixed inset-0 top-16 w-full">
    <!-- Mapbox GL JS Map Container -->
    <div 
      id="map" 
      class="w-full h-full"
      ref="mapContainer"
    ></div>
    
    <!-- Loading overlay -->
    <div 
      v-if="isMapLoading" 
      class="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10"
    >
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p class="text-gray-600">Cargando mapa...</p>
      </div>
    </div>
    
    <!-- Detail Modal -->
    <DetailModal 
      :is-visible="isDetailModalVisible"
      :bathroom="selectedBathroom"
      @close="closeDetailModal"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { initMap, destroyAllMaps, getMapInstance, addMarker, saveMapPosition } from '../services/mapbox.js'
import { loadBathroomsInBounds } from '../services/bathroomService.js'
import { onSnapshot, collection } from 'firebase/firestore'
import { db } from '../services/firebase.js'
import DetailModal from '../components/DetailModal.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faToilet } from '@fortawesome/free-solid-svg-icons'

// Reactive state
const mapContainer = ref(null)
const isMapLoading = ref(true)
const map = ref(null)
const markers = ref([])
const unsubscribeBathrooms = ref(null)
const selectedBathroom = ref(null)
const isDetailModalVisible = ref(false)

// Function to center map on coordinates
const centerMapOnCoordinates = (coords) => {
  const mapInstance = getMapInstance()
  if (mapInstance) {
    console.log('Centering map on search result:', coords.place_name)
    mapInstance.flyTo({
      center: [coords.longitude, coords.latitude],
      zoom: 13,
      essential: true
    })
  }
}

// Check for search coordinates and center map
const checkForSearchCoordinates = () => {
  const searchCoords = sessionStorage.getItem('searchCoordinates')
  if (searchCoords) {
    const coords = JSON.parse(searchCoords)
    centerMapOnCoordinates(coords)
    
    // Clear search coordinates from storage
    sessionStorage.removeItem('searchCoordinates')
  }
}

// Clear all markers from map
const clearMarkers = () => {
  markers.value.forEach(marker => {
    if (marker && typeof marker.remove === 'function') {
      marker.remove()
    }
  })
  markers.value = []
}

// Create marker element
const createMarkerElement = (isValidated) => {
  const markerElement = document.createElement('div')
  markerElement.className = 'w-8 h-8 flex items-center justify-center cursor-pointer bg-white rounded-full shadow-lg'
  
  // Create FontAwesome icon
  const iconElement = document.createElement('i')
  iconElement.className = 'fa-solid fa-restroom'
  iconElement.style.color = isValidated ? '#10b981' : '#f59e0b' // green : yellow
  iconElement.style.fontSize = '16px'
  
  markerElement.appendChild(iconElement)
  
  return markerElement
}

// Add bathroom marker to map
const addBathroomMarker = (bathroom) => {
  const mapInstance = getMapInstance()
  if (!mapInstance || !bathroom.coordinates) return

  const { latitude, longitude } = bathroom.coordinates
  const isValidated = bathroom.status === 'validated' || bathroom.validated === true

  // Create marker element
  const markerElement = createMarkerElement(isValidated)
  
  // Create marker
  const marker = addMarker(
    { latitude, longitude },
    {
      element: markerElement
    }
  )

  // Add click event to marker
  markerElement.addEventListener('click', () => {
    console.log('Bathroom clicked:', bathroom.title)
    openBathroomDetail(bathroom)
  })

  markers.value.push(marker)
  return marker
}

// Load bathrooms in visible map bounds
const loadBathroomsInVisibleBounds = async () => {
  const mapInstance = getMapInstance()
  if (!mapInstance) return

  try {
    // Get map bounds
    const bounds = mapInstance.getBounds()
    const boundsData = {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    }

    console.log('Loading bathrooms in bounds:', boundsData)

    // Clear existing markers
    clearMarkers()

    // Load bathrooms from Firestore
    const bathrooms = await loadBathroomsInBounds(boundsData)
    console.log('Loaded bathrooms:', bathrooms.length)

    // Add markers for each bathroom
    bathrooms.forEach(bathroom => {
      addBathroomMarker(bathroom)
    })

  } catch (error) {
    console.error('Error loading bathrooms:', error)
  }
}

// Open bathroom detail modal
const openBathroomDetail = (bathroom) => {
  selectedBathroom.value = bathroom
  isDetailModalVisible.value = true
}

// Close bathroom detail modal
const closeDetailModal = () => {
  isDetailModalVisible.value = false
  selectedBathroom.value = null
}

// Setup real-time listener for bathrooms
const setupBathroomsListener = () => {
  if (unsubscribeBathrooms.value) {
    unsubscribeBathrooms.value()
  }

  const bathroomsRef = collection(db, 'bathrooms')
  
  unsubscribeBathrooms.value = onSnapshot(bathroomsRef, (snapshot) => {
    console.log('Bathrooms updated in real-time')
    
    // Reload bathrooms when data changes
    loadBathroomsInVisibleBounds()
  }, (error) => {
    console.error('Error listening to bathrooms:', error)
  })
}

// Handle window resize to fix mobile viewport issues
const handleResize = () => {
  const mapInstance = getMapInstance()
  if (mapInstance) {
    mapInstance.resize()
  }
}

// Map initialization
onMounted(async () => {
  try {
    console.log('Initializing Mapbox map...')
    
    // Initialize Mapbox map
    map.value = await initMap('map')
    console.log('Map initialized successfully')
    
    // Check for search coordinates after map is ready
    await nextTick()
    checkForSearchCoordinates()
    
    // Listen for storage changes (when searching from header while on map view)
    window.addEventListener('storage', checkForSearchCoordinates)
    
    // Listen for custom search event (when already on map view)
    window.addEventListener('searchCoordinatesUpdated', (event) => {
      const coords = event.detail
      centerMapOnCoordinates(coords)
    })
    
    // Listen for window resize (important for mobile viewport changes)
    window.addEventListener('resize', handleResize)
    
    // Setup real-time listener for bathrooms
    setupBathroomsListener()
    
    // Load initial bathrooms
    await loadBathroomsInVisibleBounds()
    
    // Listen for map movement to reload bathrooms and save position
    map.value.on('moveend', () => {
      console.log('Map moved, reloading bathrooms...')
      loadBathroomsInVisibleBounds()
      
      // Save current map position
      const center = map.value.getCenter()
      const zoom = map.value.getZoom()
      saveMapPosition(center.lng, center.lat, zoom)
    })
    
    // Listen for zoom changes to reload bathrooms
    map.value.on('zoomend', () => {
      console.log('Map zoomed, reloading bathrooms...')
      loadBathroomsInVisibleBounds()
    })
    
    // Force resize after a short delay to ensure proper mobile rendering
    setTimeout(() => {
      handleResize()
    }, 100)
    
    console.log('Map setup complete')
    isMapLoading.value = false
  } catch (error) {
    console.error('Error initializing map:', error)
    isMapLoading.value = false
  }
})


// Cleanup on unmount
onUnmounted(() => {
  // Clean up event listeners
  window.removeEventListener('storage', checkForSearchCoordinates)
  window.removeEventListener('searchCoordinatesUpdated', centerMapOnCoordinates)
  window.removeEventListener('resize', handleResize)
  
  // Clean up Firestore listener
  if (unsubscribeBathrooms.value) {
    unsubscribeBathrooms.value()
  }
  
  // Clean up markers
  clearMarkers()
  
  // Clean up all maps
  destroyAllMaps()
})
</script>
