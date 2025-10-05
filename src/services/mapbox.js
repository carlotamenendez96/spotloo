// Mapbox GL JS configuration and utilities
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

// Map instance
let mapInstance = null

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

    // Clean up existing map instance
    if (mapInstance && typeof mapInstance.remove === 'function') {
      mapInstance.remove()
      mapInstance = null
    }

    const config = { ...defaultMapConfig, ...options }
    
    mapInstance = new mapboxgl.Map({
      container: containerId,
      ...config
    })

    // Add navigation controls
    mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right')
    
    // Add geolocate control
    mapInstance.addControl(new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserHeading: true
    }), 'top-right')

    // Wait for map to load
    await new Promise((resolve) => {
      mapInstance.on('load', resolve)
    })

    console.log('Mapbox map initialized')
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
 * Get current map instance
 * @returns {mapboxgl.Map|null}
 */
export const getMapInstance = () => {
  return mapInstance
}

/**
 * Add a marker to the map
 * @param {object} coordinates - { longitude, latitude }
 * @param {object} options - Marker options
 * @returns {mapboxgl.Marker}
 */
export const addMarker = (coordinates, options = {}) => {
  if (!mapInstance) {
    throw new Error('Map not initialized')
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
 * @returns {mapboxgl.Popup}
 */
export const addPopup = (coordinates, content, options = {}) => {
  if (!mapInstance) {
    throw new Error('Map not initialized')
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
 */
export const centerMap = (coordinates, zoom = 13) => {
  if (!mapInstance) {
    throw new Error('Map not initialized')
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
 */
export const fitMapToBounds = (bounds) => {
  if (!mapInstance) {
    throw new Error('Map not initialized')
  }

  mapInstance.fitBounds(bounds, {
    padding: 50
  })
}

/**
 * Get current map center
 * @returns {object} { longitude, latitude }
 */
export const getMapCenter = () => {
  if (!mapInstance) {
    throw new Error('Map not initialized')
  }

  const center = mapInstance.getCenter()
  return {
    longitude: center.lng,
    latitude: center.lat
  }
}

/**
 * Get current map zoom
 * @returns {number}
 */
export const getMapZoom = () => {
  if (!mapInstance) {
    throw new Error('Map not initialized')
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
 */
export const onMapClick = (callback) => {
  if (!mapInstance) {
    throw new Error('Map not initialized')
  }

  mapInstance.on('click', callback)
}

/**
 * Remove click event listener from map
 * @param {function} callback - Callback function
 */
export const offMapClick = (callback) => {
  if (!mapInstance) {
    throw new Error('Map not initialized')
  }

  mapInstance.off('click', callback)
}

/**
 * Add move event listener to map
 * @param {function} callback - Callback function
 */
export const onMapMove = (callback) => {
  if (!mapInstance) {
    throw new Error('Map not initialized')
  }

  mapInstance.on('move', callback)
}

/**
 * Remove move event listener from map
 * @param {function} callback - Callback function
 */
export const offMapMove = (callback) => {
  if (!mapInstance) {
    throw new Error('Map not initialized')
  }

  mapInstance.off('move', callback)
}

// Cleanup
export const destroyMap = () => {
  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
    console.log('Mapbox map destroyed')
  }
}

// Export Mapbox GL JS for direct access if needed
export { mapboxgl }
