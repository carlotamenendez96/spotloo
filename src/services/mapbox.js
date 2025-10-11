// Mapbox GL JS configuration and utilities - Updated for multi-instance support v2
import mapboxgl from 'mapbox-gl'

// Mapbox configuration
const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

// Initialize Mapbox
mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN

// Default map configuration
const defaultMapConfig = {
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [-3.7038, 40.4168], // Madrid, Spain
  zoom: 13,
  pitch: 0,
  bearing: 0
}

// Map instances storage - Fixed version
const mapInstances = new Map()

/**
 * Initialize Mapbox map
 * @param {string} containerId - HTML element ID for map container
 * @param {object} options - Map configuration options
 * @returns {Promise<mapboxgl.Map>}
 */
export const initMap = async (containerId, options = {}) => {
  try {
    // Check if container exists
    const container = document.getElementById(containerId)
    if (!container) {
      throw new Error(`Map container with id "${containerId}" not found`)
    }

    // Clean up existing map instance for this container
    if (mapInstances.has(containerId)) {
      const existingMap = mapInstances.get(containerId)
      if (existingMap && typeof existingMap.remove === 'function') {
        existingMap.remove()
      }
      mapInstances.delete(containerId)
    }

    const config = { ...defaultMapConfig, ...options }
    
    const mapInstance = new mapboxgl.Map({
      container: containerId,
      ...config
    })

    // Add navigation controls only for main map (not modal maps)
    if (containerId === 'map') {
      mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right')
      
      // Add geolocate control only for main map
      mapInstance.addControl(new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      }), 'top-right')
    }

    // Wait for map to load
    await new Promise((resolve) => {
      mapInstance.on('load', resolve)
    })

    // Store the map instance
    mapInstances.set(containerId, mapInstance)

    console.log('Mapbox map initialized for container:', containerId)
    return mapInstance
  } catch (error) {
    console.error('Error initializing Mapbox:', error)
    throw error
  }
}

/**
 * Initialize Mapbox map (alias for backward compatibility)
 * @param {string} containerId - HTML element ID for map container
 * @param {object} options - Map configuration options
 * @returns {Promise<mapboxgl.Map>}
 */
export const initializeMapbox = initMap

/**
 * Get current map instance (main map)
 * @returns {mapboxgl.Map|null}
 */
export const getMapInstance = () => {
  return mapInstances.get('map') || null
}

/**
 * Get map instance by container ID
 * @param {string} containerId - Container ID
 * @returns {mapboxgl.Map|null}
 */
export const getMapInstanceById = (containerId) => {
  return mapInstances.get(containerId) || null
}

/**
 * Add a marker to the map
 * @param {object} coordinates - { longitude, latitude }
 * @param {object} options - Marker options
 * @param {string} containerId - Map container ID (defaults to main map)
 * @returns {mapboxgl.Marker}
 */
export const addMarker = (coordinates, options = {}, containerId = 'map') => {
  const mapInstance = mapInstances.get(containerId)
  if (!mapInstance) {
    throw new Error(`Map not initialized for container: ${containerId}`)
  }

  const marker = new mapboxgl.Marker(options)
    .setLngLat([coordinates.longitude, coordinates.latitude])
    .addTo(mapInstance)

  return marker
}

/**
 * Add a popup to the map
 * @param {object} coordinates - { longitude, latitude }
 * @param {string} content - Popup content HTML
 * @param {object} options - Popup options
 * @param {string} containerId - Map container ID (defaults to main map)
 * @returns {mapboxgl.Popup}
 */
export const addPopup = (coordinates, content, options = {}, containerId = 'map') => {
  const mapInstance = mapInstances.get(containerId)
  if (!mapInstance) {
    throw new Error(`Map not initialized for container: ${containerId}`)
  }

  const popup = new mapboxgl.Popup(options)
    .setLngLat([coordinates.longitude, coordinates.latitude])
    .setHTML(content)
    .addTo(mapInstance)

  return popup
}

/**
 * Center map on coordinates
 * @param {object} coordinates - { longitude, latitude }
 * @param {number} zoom - Zoom level
 * @param {string} containerId - Map container ID (defaults to main map)
 */
export const centerMap = (coordinates, zoom = 13, containerId = 'map') => {
  const mapInstance = mapInstances.get(containerId)
  if (!mapInstance) {
    throw new Error(`Map not initialized for container: ${containerId}`)
  }

  mapInstance.flyTo({
    center: [coordinates.longitude, coordinates.latitude],
    zoom: zoom,
    essential: true
  })
}

/**
 * Fit map to bounds
 * @param {array} bounds - [[minLng, minLat], [maxLng, maxLat]]
 * @param {string} containerId - Map container ID (defaults to main map)
 */
export const fitMapToBounds = (bounds, containerId = 'map') => {
  const mapInstance = mapInstances.get(containerId)
  if (!mapInstance) {
    throw new Error(`Map not initialized for container: ${containerId}`)
  }

  mapInstance.fitBounds(bounds, {
    padding: 50
  })
}

/**
 * Get current map center
 * @param {string} containerId - Map container ID (defaults to main map)
 * @returns {object} { longitude, latitude }
 */
export const getMapCenter = (containerId = 'map') => {
  const mapInstance = mapInstances.get(containerId)
  if (!mapInstance) {
    throw new Error(`Map not initialized for container: ${containerId}`)
  }

  const center = mapInstance.getCenter()
  return {
    longitude: center.lng,
    latitude: center.lat
  }
}

/**
 * Get current map zoom
 * @param {string} containerId - Map container ID (defaults to main map)
 * @returns {number}
 */
export const getMapZoom = (containerId = 'map') => {
  const mapInstance = mapInstances.get(containerId)
  if (!mapInstance) {
    throw new Error(`Map not initialized for container: ${containerId}`)
  }

  return mapInstance.getZoom()
}

// Geocoding functions

/**
 * Geocode a city name to coordinates
 * @param {string} cityName - Name of the city to geocode
 * @returns {Promise<object>} { longitude, latitude, place_name }
 */
export const geocodeCity = async (cityName) => {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(cityName)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=1&types=place`
    )

    if (!response.ok) {
      throw new Error('Geocoding request failed')
    }

    const data = await response.json()

    if (data.features && data.features.length > 0) {
      const feature = data.features[0]
      const [longitude, latitude] = feature.center

      return {
        longitude,
        latitude,
        place_name: feature.place_name
      }
    } else {
      throw new Error('City not found')
    }
  } catch (error) {
    console.error('Error geocoding city:', error)
    throw error
  }
}

/**
 * Reverse geocode coordinates to address
 * @param {number} longitude - Longitude coordinate
 * @param {number} latitude - Latitude coordinate
 * @returns {Promise<object>} Address information
 */
export const reverseGeocode = async (longitude, latitude) => {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=1`
    )

    if (!response.ok) {
      throw new Error('Reverse geocoding request failed')
    }

    const data = await response.json()

    if (data.features && data.features.length > 0) {
      const feature = data.features[0]
      return {
        place_name: feature.place_name,
        context: feature.context
      }
    } else {
      throw new Error('Address not found')
    }
  } catch (error) {
    console.error('Error reverse geocoding:', error)
    throw error
  }
}

/**
 * Search for places
 * @param {string} query - Search query
 * @param {object} options - Search options
 * @returns {Promise<array>} Array of search results
 */
export const searchPlaces = async (query, options = {}) => {
  try {
    const { limit = 5, types = 'poi' } = options
    
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=${limit}&types=${types}`
    )

    if (!response.ok) {
      throw new Error('Places search request failed')
    }

    const data = await response.json()

    return data.features.map(feature => ({
      id: feature.id,
      place_name: feature.place_name,
      coordinates: {
        longitude: feature.center[0],
        latitude: feature.center[1]
      },
      context: feature.context
    }))
  } catch (error) {
    console.error('Error searching places:', error)
    throw error
  }
}

// Map event handlers

/**
 * Add click event listener to map
 * @param {function} callback - Callback function
 * @param {string} containerId - Map container ID (defaults to main map)
 */
export const onMapClick = (callback, containerId = 'map') => {
  const mapInstance = mapInstances.get(containerId)
  if (!mapInstance) {
    throw new Error(`Map not initialized for container: ${containerId}`)
  }

  mapInstance.on('click', callback)
}

/**
 * Remove click event listener from map
 * @param {function} callback - Callback function
 * @param {string} containerId - Map container ID (defaults to main map)
 */
export const offMapClick = (callback, containerId = 'map') => {
  const mapInstance = mapInstances.get(containerId)
  if (!mapInstance) {
    throw new Error(`Map not initialized for container: ${containerId}`)
  }

  mapInstance.off('click', callback)
}

/**
 * Add move event listener to map
 * @param {function} callback - Callback function
 * @param {string} containerId - Map container ID (defaults to main map)
 */
export const onMapMove = (callback, containerId = 'map') => {
  const mapInstance = mapInstances.get(containerId)
  if (!mapInstance) {
    throw new Error(`Map not initialized for container: ${containerId}`)
  }

  mapInstance.on('move', callback)
}

/**
 * Remove move event listener from map
 * @param {function} callback - Callback function
 * @param {string} containerId - Map container ID (defaults to main map)
 */
export const offMapMove = (callback, containerId = 'map') => {
  const mapInstance = mapInstances.get(containerId)
  if (!mapInstance) {
    throw new Error(`Map not initialized for container: ${containerId}`)
  }

  mapInstance.off('move', callback)
}

// Cleanup
/**
 * Destroy a specific map instance
 * @param {string} containerId - Map container ID to destroy
 */
export const destroyMap = (containerId = 'map') => {
  const mapInstance = mapInstances.get(containerId)
  if (mapInstance) {
    mapInstance.remove()
    mapInstances.delete(containerId)
    console.log(`Mapbox map destroyed for container: ${containerId}`)
  }
}

/**
 * Destroy all map instances
 */
export const destroyAllMaps = () => {
  mapInstances.forEach((mapInstance, containerId) => {
    if (mapInstance) {
      mapInstance.remove()
      console.log(`Mapbox map destroyed for container: ${containerId}`)
    }
  })
  mapInstances.clear()
}

// Export Mapbox GL JS for direct access if needed
export { mapboxgl }
