// Bathroom service for managing bathroom data
import { 
  addDocument, 
  getDocuments, 
  getDocument, 
  updateDocument, 
  deleteDocument,
  uploadFile 
} from './firebase.js'

// Collection name for bathrooms
const COLLECTION_NAME = 'bathrooms'

// Bathroom data structure
const defaultBathroomData = {
  title: '',
  description: '',
  country: '',
  address: '',
  coordinates: {
    latitude: null,
    longitude: null
  },
  amenities: [],
  photo: null,
  rating: 0,
  reviews: 0,
  totalRating: 0,
  createdBy: null,
  createdAt: null,
  updatedAt: null
}

/**
 * Create a new bathroom
 * @param {object} bathroomData - Bathroom data
 * @returns {Promise<string>} Document ID
 */
export const createBathroom = async (bathroomData) => {
  try {
    // Validate required fields
    if (!bathroomData.title || !bathroomData.description || !bathroomData.country) {
      throw new Error('Title, description, and country are required')
    }

    if (!bathroomData.coordinates?.latitude || !bathroomData.coordinates?.longitude) {
      throw new Error('Coordinates are required')
    }

    // Prepare data
    const data = {
      ...defaultBathroomData,
      ...bathroomData,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Upload photo if provided
    if (bathroomData.photo && bathroomData.photo instanceof File) {
      const photoPath = `bathrooms/${Date.now()}_${bathroomData.photo.name}`
      data.photoUrl = await uploadFile(bathroomData.photo, photoPath)
      delete data.photo // Remove file object
    }

    // Add to Firestore
    const docRef = await addDocument(COLLECTION_NAME, data)
    
    // Note: Points will be awarded automatically by Cloud Function (onBathroomCreated)
    
    console.log('Bathroom created with ID:', docRef.id)
    return docRef.id
  } catch (error) {
    console.error('Error creating bathroom:', error)
    throw error
  }
}

/**
 * Get all bathrooms
 * @param {object} options - Query options
 * @returns {Promise<array>} Array of bathrooms
 */
export const loadBathrooms = async (options = {}) => {
  try {
    const bathrooms = await getDocuments(COLLECTION_NAME, [], {
      orderBy: { field: 'createdAt', direction: 'desc' },
      ...options
    })

    console.log('Loaded bathrooms:', bathrooms.length)
    return bathrooms
  } catch (error) {
    console.error('Error loading bathrooms:', error)
    throw error
  }
}

/**
 * Get bathrooms within a bounding box
 * @param {object} bounds - Bounding box { north, south, east, west }
 * @returns {Promise<array>} Array of bathrooms within bounds
 */
export const loadBathroomsInBounds = async (bounds) => {
  try {
    // Note: Firestore doesn't support native geospatial queries
    // This is a simplified implementation - in production you'd want to use
    // a geospatial database or implement a grid-based system
    
    const allBathrooms = await loadBathrooms()
    
    const filteredBathrooms = allBathrooms.filter(bathroom => {
      const { latitude, longitude } = bathroom.coordinates
      
      return latitude >= bounds.south &&
             latitude <= bounds.north &&
             longitude >= bounds.west &&
             longitude <= bounds.east
    })

    console.log('Loaded bathrooms in bounds:', filteredBathrooms.length)
    return filteredBathrooms
  } catch (error) {
    console.error('Error loading bathrooms in bounds:', error)
    throw error
  }
}

/**
 * Get bathroom details by ID
 * @param {string} bathroomId - Bathroom document ID
 * @returns {Promise<object>} Bathroom data
 */
export const getBathroomDetails = async (bathroomId) => {
  try {
    if (!bathroomId) {
      throw new Error('Bathroom ID is required')
    }

    const bathroom = await getDocument(COLLECTION_NAME, bathroomId)
    
    console.log('Loaded bathroom details:', bathroomId)
    return bathroom
  } catch (error) {
    console.error('Error getting bathroom details:', error)
    throw error
  }
}

/**
 * Check if user has already rated a bathroom
 * @param {string} bathroomId - Bathroom document ID
 * @param {string} userId - User ID
 * @returns {Promise<object|null>} Existing rating or null
 */
export const checkUserRating = async (bathroomId, userId) => {
  try {
    if (!bathroomId || !userId) {
      console.log('checkUserRating: Missing parameters', { bathroomId, userId })
      return null
    }

    console.log('checkUserRating: Searching for bathroom:', bathroomId, 'user:', userId)
    
    const ratings = await getDocuments('ratings', [
      ['bathroomID', '==', bathroomId],
      ['userUID', '==', userId]
    ])
    
    console.log('checkUserRating: Found ratings:', ratings.length)
    ratings.forEach(rating => {
      console.log('Rating found:', {
        id: rating.id,
        bathroomID: rating.bathroomID,
        userUID: rating.userUID,
        rating: rating.rating
      })
    })
    
    return ratings.length > 0 ? ratings[0] : null
  } catch (error) {
    console.error('Error checking user rating:', error)
    return null
  }
}

/**
 * Rate a bathroom
 * @param {string} bathroomId - Bathroom document ID
 * @param {number} rating - Rating (1-5)
 * @param {string} userId - User ID
 * @param {string} review - Optional review text
 * @returns {Promise<void>}
 */
export const rateBathroom = async (bathroomId, rating, userId, review = '') => {
  try {
    if (!bathroomId || !rating || !userId) {
      throw new Error('Bathroom ID, rating, and user ID are required')
    }

    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5')
    }

    // Get current bathroom data
    const bathroom = await getBathroomDetails(bathroomId)
    
    if (!bathroom) {
      throw new Error('Bathroom not found')
    }
    
    // Calculate new average rating
    const currentTotalRating = bathroom.totalRating || 0
    const currentReviews = bathroom.reviews || 0
    const newTotalRating = currentTotalRating + rating
    const newReviews = currentReviews + 1
    const newAverageRating = newTotalRating / newReviews

    // Update bathroom with new rating
    await updateDocument(COLLECTION_NAME, bathroomId, {
      rating: newAverageRating,
      reviews: newReviews,
      totalRating: newTotalRating,
      updatedAt: new Date()
    })
    
    // Note: Points will be awarded automatically by Cloud Function (onRatingCreated)
    
    console.log('Updated bathroom rating:', {
      bathroomId,
      newAverageRating,
      newReviews,
      newTotalRating
    })

    // TODO: Add review to separate reviews collection
    if (review.trim()) {
      await addDocument('reviews', {
        bathroomId,
        userId,
        rating,
        review: review.trim(),
        createdAt: new Date()
      })
    }

    console.log('Bathroom rated:', bathroomId, rating)
  } catch (error) {
    console.error('Error rating bathroom:', error)
    throw error
  }
}

/**
 * Update bathroom data
 * @param {string} bathroomId - Bathroom document ID
 * @param {object} updateData - Data to update
 * @returns {Promise<void>}
 */
export const updateBathroom = async (bathroomId, updateData) => {
  try {
    if (!bathroomId) {
      throw new Error('Bathroom ID is required')
    }

    // Upload new photo if provided
    if (updateData.photo && updateData.photo instanceof File) {
      const photoPath = `bathrooms/${Date.now()}_${updateData.photo.name}`
      updateData.photoUrl = await uploadFile(updateData.photo, photoPath)
      delete updateData.photo // Remove file object
    }

    await updateDocument(COLLECTION_NAME, bathroomId, updateData)
    
    console.log('Bathroom updated:', bathroomId)
  } catch (error) {
    console.error('Error updating bathroom:', error)
    throw error
  }
}

/**
 * Delete a bathroom
 * @param {string} bathroomId - Bathroom document ID
 * @returns {Promise<void>}
 */
export const deleteBathroom = async (bathroomId) => {
  try {
    if (!bathroomId) {
      throw new Error('Bathroom ID is required')
    }

    await deleteDocument(COLLECTION_NAME, bathroomId)
    
    console.log('Bathroom deleted:', bathroomId)
  } catch (error) {
    console.error('Error deleting bathroom:', error)
    throw error
  }
}

/**
 * Get user's contributed bathrooms
 * @param {string} userId - User ID
 * @returns {Promise<array>} Array of user's bathrooms
 */
export const getUserBathrooms = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required')
    }

    const bathrooms = await getDocuments(COLLECTION_NAME, [
      ['createdBy', '==', userId]
    ], {
      orderBy: { field: 'createdAt', direction: 'desc' }
    })

    console.log('Loaded user bathrooms:', bathrooms.length)
    return bathrooms
  } catch (error) {
    console.error('Error loading user bathrooms:', error)
    throw error
  }
}

/**
 * Get top-rated bathrooms
 * @param {number} limit - Number of bathrooms to return
 * @returns {Promise<array>} Array of top-rated bathrooms
 */
export const getTopRatedBathrooms = async (limit = 10) => {
  try {
    const bathrooms = await getDocuments(COLLECTION_NAME, [], {
      orderBy: { field: 'rating', direction: 'desc' },
      limit
    })

    console.log('Loaded top-rated bathrooms:', bathrooms.length)
    return bathrooms
  } catch (error) {
    console.error('Error loading top-rated bathrooms:', error)
    throw error
  }
}

/**
 * Get recent bathrooms
 * @param {number} limit - Number of bathrooms to return
 * @returns {Promise<array>} Array of recent bathrooms
 */
export const getRecentBathrooms = async (limit = 10) => {
  try {
    const bathrooms = await getDocuments(COLLECTION_NAME, [], {
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit
    })

    console.log('Loaded recent bathrooms:', bathrooms.length)
    return bathrooms
  } catch (error) {
    console.error('Error loading recent bathrooms:', error)
    throw error
  }
}

/**
 * Validate a bathroom (only if user is not the creator)
 * @param {string} bathroomId - Bathroom document ID
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const validateBathroom = async (bathroomId, userId) => {
  try {
    if (!bathroomId || !userId) {
      throw new Error('Bathroom ID and user ID are required')
    }

    // Get current bathroom data
    const bathroom = await getBathroomDetails(bathroomId)
    
    if (!bathroom) {
      throw new Error('Bathroom not found')
    }
    
    // Check if user is the creator
    if (bathroom.createdBy === userId) {
      throw new Error('No puedes validar tu propio baño')
    }
    
    // Check if user has already validated this bathroom
    const currentValidations = bathroom.validations || {}
    if (currentValidations[userId]) {
      throw new Error('Ya has validado este baño')
    }
    
    // Add user validation
    const newValidations = {
      ...currentValidations,
      [userId]: true
    }
    
    // Calculate validation status
    const validationCount = Object.keys(newValidations).length
    const isFullyValidated = validationCount >= 3 // Require 3 validations
    
    // Update bathroom
    await updateDocument(COLLECTION_NAME, bathroomId, {
      validations: newValidations,
      status: isFullyValidated ? 'validated' : 'pending',
      validationCount,
      updatedAt: new Date()
    })
    
    // Note: Points will be awarded automatically by Cloud Function (onBathroomUpdated)
    
    console.log('Bathroom validated successfully:', {
      bathroomId,
      userId,
      validationCount,
      isFullyValidated
    })
    
  } catch (error) {
    console.error('Error validating bathroom:', error)
    throw error
  }
}

/**
 * Check if user has already validated a bathroom
 * @param {string} bathroomId - Bathroom document ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
export const hasUserValidated = async (bathroomId, userId) => {
  try {
    if (!bathroomId || !userId) {
      return false
    }

    const bathroom = await getBathroomDetails(bathroomId)
    
    if (!bathroom || !bathroom.validations) {
      return false
    }
    
    return !!bathroom.validations[userId]
  } catch (error) {
    console.error('Error checking user validation:', error)
    return false
  }
}

/**
 * Search bathrooms by text
 * @param {string} searchTerm - Search term
 * @returns {Promise<array>} Array of matching bathrooms
 */
export const searchBathrooms = async (searchTerm) => {
  try {
    if (!searchTerm || !searchTerm.trim()) {
      return []
    }

    // Note: Firestore doesn't support full-text search natively
    // This is a simplified implementation - in production you'd want to use
    // Algolia, Elasticsearch, or implement a more sophisticated search
    
    const allBathrooms = await loadBathrooms()
    
    const searchLower = searchTerm.toLowerCase()
    const filteredBathrooms = allBathrooms.filter(bathroom => {
      return bathroom.title.toLowerCase().includes(searchLower) ||
             bathroom.description.toLowerCase().includes(searchLower) ||
             bathroom.address?.toLowerCase().includes(searchLower) ||
             bathroom.country.toLowerCase().includes(searchLower)
    })

    console.log('Search results for "' + searchTerm + '":', filteredBathrooms.length)
    return filteredBathrooms
  } catch (error) {
    console.error('Error searching bathrooms:', error)
    throw error
  }
}

/**
 * Get ranking data for users and bathrooms
 * @returns {Promise<object>} Ranking data
 */
export const loadRankingData = async () => {
  try {
    // Get top contributors (users with most bathrooms)
    const allBathrooms = await loadBathrooms()
    
    // Count bathrooms per user
    const userContributions = {}
    allBathrooms.forEach(bathroom => {
      if (bathroom.createdBy) {
        userContributions[bathroom.createdBy] = (userContributions[bathroom.createdBy] || 0) + 1
      }
    })

    // Convert to array and sort
    const topContributors = Object.entries(userContributions)
      .map(([userId, contributions]) => ({
        userId,
        contributions,
        points: contributions * 10 // 10 points per contribution
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 10)

    // Get statistics
    const totalBathrooms = allBathrooms.length
    const totalContributors = Object.keys(userContributions).length
    const countries = [...new Set(allBathrooms.map(b => b.country))].length

    // Get recent contributions
    const recentContributions = allBathrooms.slice(0, 10).map(bathroom => ({
      id: bathroom.id,
      title: bathroom.title,
      author: bathroom.createdBy || 'Usuario anónimo',
      createdAt: bathroom.createdAt,
      points: 10
    }))

    const rankingData = {
      topContributors,
      totalBathrooms,
      totalContributors,
      totalCountries: countries,
      recentContributions
    }

    console.log('Loaded ranking data:', rankingData)
    return rankingData
  } catch (error) {
    console.error('Error loading ranking data:', error)
    throw error
  }
}

/**
 * Get bathroom statistics
 * @returns {Promise<object>} Statistics data
 */
export const getBathroomStatistics = async () => {
  try {
    const allBathrooms = await loadBathrooms()
    
    const stats = {
      total: allBathrooms.length,
      averageRating: 0,
      totalReviews: 0,
      countries: 0,
      withPhotos: 0
    }

    if (allBathrooms.length > 0) {
      stats.averageRating = allBathrooms.reduce((sum, b) => sum + (b.rating || 0), 0) / allBathrooms.length
      stats.totalReviews = allBathrooms.reduce((sum, b) => sum + (b.reviews || 0), 0)
      stats.countries = new Set(allBathrooms.map(b => b.country)).size
      stats.withPhotos = allBathrooms.filter(b => b.photoUrl).length
    }

    console.log('Bathroom statistics:', stats)
    return stats
  } catch (error) {
    console.error('Error getting bathroom statistics:', error)
    throw error
  }
}
