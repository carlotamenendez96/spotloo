// User state management service
import { ref, computed } from 'vue'
import { onAuthStateChange, signOutUser, addDocument, updateDocument, getDocument, getDocuments } from './firebase.js'

// Reactive user state
const currentUser = ref(null)
const isLoading = ref(true)

// Computed properties
const isLoggedIn = computed(() => !!currentUser.value)
const userDisplayName = computed(() => currentUser.value?.displayName || 'Usuario')
const userEmail = computed(() => currentUser.value?.email || '')

/**
 * Initialize user state from localStorage
 */
export const initializeUserState = () => {
  try {
    const storedUser = localStorage.getItem('spotloo_user')
    if (storedUser) {
      currentUser.value = JSON.parse(storedUser)
      console.log('User state initialized from localStorage:', currentUser.value)
    }
  } catch (error) {
    console.error('Error initializing user state:', error)
    clearUserState()
  }
  
  isLoading.value = false
}

/**
 * Set current user
 * @param {Object} user - User object
 */
export const setCurrentUser = (user) => {
  currentUser.value = user
  
  if (user) {
    // Save to localStorage
    localStorage.setItem('spotloo_user', JSON.stringify(user))
  } else {
    // Clear from localStorage
    localStorage.removeItem('spotloo_user')
  }
  
  console.log('User state updated:', user)
}

/**
 * Clear user state
 */
export const clearUserState = () => {
  currentUser.value = null
  localStorage.removeItem('spotloo_user')
  console.log('User state cleared')
}

/**
 * Sign out user
 */
export const signOut = async () => {
  try {
    await signOutUser()
    clearUserState()
    console.log('User signed out successfully')
  } catch (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

/**
 * Setup Firebase auth state listener
 */
export const setupAuthListener = () => {
  return onAuthStateChange((user) => {
    if (user) {
      // User is signed in
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        lastLogin: new Date().toISOString()
      }
      setCurrentUser(userData)
    } else {
      // User is signed out
      clearUserState()
    }
    
    isLoading.value = false
  })
}

/**
 * Get user contribution stats
 */
export const getUserStats = () => {
  return {
    contributions: currentUser.value?.contributions || 0,
    points: currentUser.value?.points || 0,
    memberSince: currentUser.value?.createdAt || null
  }
}

/**
 * Update user profile
 * @param {Object} updates - Profile updates
 */
export const updateUserProfile = async (updates) => {
  if (!currentUser.value) {
    throw new Error('No user logged in')
  }
  
  try {
    // Update local state
    currentUser.value = { ...currentUser.value, ...updates }
    setCurrentUser(currentUser.value)
    
    // TODO: Update Firestore document
    console.log('User profile updated:', updates)
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw error
  }
}

/**
 * Award points to user for an action
 * @param {string} userId - User ID
 * @param {number} points - Points to award
 * @param {string} action - Action type (validation, rating, contribution)
 * @param {string} description - Description of the action
 * @param {string} bathroomId - Related bathroom ID (optional)
 */
export const awardPoints = async (userId, points, action, description, bathroomId = null) => {
  try {
    // Try to update user document (may fail due to permissions)
    try {
      await updateUserPoints(userId, points)
      console.log('Points awarded successfully:', { userId, points, action, description })
    } catch (error) {
      console.warn('Could not update user points:', error.message)
      // Continue without failing - points system is optional
    }
    
  } catch (error) {
    console.error('Error awarding points:', error)
    // Don't throw error - points system is optional
  }
}

/**
 * Update user total points in Firestore
 * @param {string} userId - User ID
 * @param {number} pointsToAdd - Points to add
 */
export const updateUserPoints = async (userId, pointsToAdd) => {
  try {
    // Try to get current user document
    let userDoc = null
    try {
      userDoc = await getDocument('users', userId)
    } catch (error) {
      // Document doesn't exist, will create new one
      console.log('User document not found, will create new one')
    }
    
    if (userDoc) {
      // Update existing user
      const newPoints = (userDoc.points || 0) + pointsToAdd
      const newContributions = (userDoc.contributions || 0) + 1
      
      await updateDocument('users', userId, {
        points: newPoints,
        contributions: newContributions,
        lastActivity: new Date()
      })
      
      // Update local state if it's the current user
      if (currentUser.value && currentUser.value.uid === userId) {
        currentUser.value.points = newPoints
        currentUser.value.contributions = newContributions
        setCurrentUser(currentUser.value)
      }
      
      console.log('User points updated:', { userId, newPoints, newContributions })
    } else {
      // Create new user document
      const newUserDoc = {
        uid: userId,
        points: pointsToAdd,
        contributions: 1,
        createdAt: new Date(),
        lastActivity: new Date()
      }
      
      // Try to add as new document
      try {
        await addDocument('users', newUserDoc)
        console.log('New user document created:', { userId, points: pointsToAdd })
      } catch (addError) {
        console.warn('Could not create user document:', addError.message)
        // Continue without failing - points system is optional
      }
    }
    
  } catch (error) {
    console.error('Error updating user points:', error)
    // Don't throw error - points system is optional
  }
}

/**
 * Get user ranking data
 * @returns {Promise<Array>} Array of users sorted by points
 */
export const getUserRanking = async () => {
  try {
    const users = await getDocuments('users', [], {
      orderBy: { field: 'points', direction: 'desc' },
      limit: 50
    })
    
    console.log('Loaded user ranking:', users.length)
    return users
  } catch (error) {
    console.error('Error loading user ranking:', error)
    // Return empty array instead of throwing
    return []
  }
}

/**
 * Get recent user actions from ratings
 * @param {number} limit - Number of actions to return
 * @returns {Promise<Array>} Array of recent actions
 */
export const getRecentActions = async (limit = 10) => {
  try {
    const ratings = await getDocuments('ratings', [], {
      orderBy: { field: 'createdAt', direction: 'desc' },
      limit
    })
    
    // Transform ratings into actions format
    const actions = ratings.map(rating => ({
      id: rating.id,
      userId: rating.userUID,
      points: 5, // 5 points for rating
      action: 'rating',
      description: `${rating.userName} calificó un baño con ${rating.rating} estrellas`,
      bathroomId: rating.bathroomID,
      createdAt: rating.createdAt
    }))
    
    console.log('Loaded recent actions from ratings:', actions.length)
    return actions
  } catch (error) {
    console.error('Error loading recent actions:', error)
    // Return empty array instead of throwing
    return []
  }
}

// Export reactive state
export {
  currentUser,
  isLoading,
  isLoggedIn,
  userDisplayName,
  userEmail
}
