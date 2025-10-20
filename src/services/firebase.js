// Firebase configuration and initialization
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, updateProfile } from 'firebase/auth'
import { getFirestore, collection, doc, addDoc, setDoc, getDocs, getDoc, updateDoc, deleteDoc, query, orderBy, limit, where } from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Google Auth Provider
const googleProvider = new GoogleAuthProvider()

// Authentication functions

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<UserCredential>}
 */
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    console.log('User signed in:', userCredential.user)
    return userCredential
  } catch (error) {
    console.error('Error signing in:', error)
    throw error
  }
}

/**
 * Create new user account with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} name - User display name
 * @returns {Promise<UserCredential>}
 */
export const signUpWithEmail = async (email, password, name) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    
    // Update user profile with display name
    await updateProfile(userCredential.user, {
      displayName: name
    })
    
    console.log('User created:', userCredential.user)
    return userCredential
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

/**
 * Sign in with Google
 * @returns {Promise<UserCredential>}
 */
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    console.log('User signed in with Google:', result.user)
    return result
  } catch (error) {
    console.error('Error signing in with Google:', error)
    throw error
  }
}

/**
 * Sign out current user
 * @returns {Promise<void>}
 */
export const signOutUser = async () => {
  try {
    await signOut(auth)
    console.log('User signed out')
  } catch (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

/**
 * Listen to authentication state changes
 * @param {function} callback - Callback function to handle auth state changes
 * @returns {function} Unsubscribe function
 */
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback)
}

// Firestore functions

/**
 * Add a new document to a collection
 * @param {string} collectionName - Name of the collection
 * @param {object} data - Document data
 * @returns {Promise<DocumentReference>}
 */
export const addDocument = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    console.log('Document added with ID:', docRef.id)
    return docRef
  } catch (error) {
    console.error('Error adding document:', error)
    throw error
  }
}

/**
 * Set a document with a specific ID (creates or overwrites)
 * @param {string} collectionName - Name of the collection
 * @param {string} documentId - ID for the document
 * @param {object} data - Document data
 * @param {boolean} merge - Whether to merge with existing data (default: true)
 * @returns {Promise<void>}
 */
export const setDocument = async (collectionName, documentId, data, merge = true) => {
  try {
    const docRef = doc(db, collectionName, documentId)
    await setDoc(docRef, {
      ...data,
      updatedAt: new Date()
    }, { merge })
    console.log('Document set with ID:', documentId)
  } catch (error) {
    console.error('Error setting document:', error)
    throw error
  }
}

/**
 * Get all documents from a collection
 * @param {string} collectionName - Name of the collection
 * @param {object} options - Query options (orderBy, limit, where)
 * @returns {Promise<QuerySnapshot>}
 */
export const getDocuments = async (collectionName, whereConditions = [], options = {}) => {
  try {
    let q = collection(db, collectionName)
    
    // Apply where conditions (array of [field, operator, value])
    if (Array.isArray(whereConditions) && whereConditions.length > 0) {
      whereConditions.forEach(condition => {
        if (Array.isArray(condition) && condition.length === 3) {
          const [field, operator, value] = condition
          q = query(q, where(field, operator, value))
        }
      })
    }
    
    // Apply query options
    if (options.orderBy) {
      q = query(q, orderBy(options.orderBy.field, options.orderBy.direction || 'asc'))
    }
    
    if (options.limit) {
      q = query(q, limit(options.limit))
    }
    
    const querySnapshot = await getDocs(q)
    const documents = []
    
    querySnapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        ...doc.data()
      })
    })
    
    return documents
  } catch (error) {
    console.error('Error getting documents:', error)
    throw error
  }
}

/**
 * Get a single document by ID
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @returns {Promise<object>}
 */
export const getDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      }
    } else {
      throw new Error('Document not found')
    }
  } catch (error) {
    console.error('Error getting document:', error)
    throw error
  }
}

/**
 * Update a document
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @param {object} data - Updated data
 * @returns {Promise<void>}
 */
export const updateDocument = async (collectionName, docId, data) => {
  try {
    const docRef = doc(db, collectionName, docId)
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date()
    })
    console.log('Document updated:', docId)
  } catch (error) {
    console.error('Error updating document:', error)
    throw error
  }
}

/**
 * Delete a document
 * @param {string} collectionName - Name of the collection
 * @param {string} docId - Document ID
 * @returns {Promise<void>}
 */
export const deleteDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId)
    await deleteDoc(docRef)
    console.log('Document deleted:', docId)
  } catch (error) {
    console.error('Error deleting document:', error)
    throw error
  }
}

// Storage functions

/**
 * Upload a file to Firebase Storage
 * @param {File} file - File to upload
 * @param {string} path - Storage path
 * @returns {Promise<string>} Download URL
 */
export const uploadFile = async (file, path) => {
  try {
    const storageRef = ref(storage, path)
    const snapshot = await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(snapshot.ref)
    
    console.log('File uploaded:', downloadURL)
    return downloadURL
  } catch (error) {
    console.error('Error uploading file:', error)
    throw error
  }
}

// Export Firebase app instance
export default app
