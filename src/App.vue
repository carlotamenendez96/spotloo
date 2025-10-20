<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <!-- Header component -->
    <Header @open-auth="openAuthModal" />
    
    <!-- Main content area -->
    <main class="pt-16">
      <router-view />
    </main>
    
    <!-- Floating Action Button for adding bathrooms (only when logged in) -->
    <FABAdd v-if="isLoggedIn" @open-contrib="openContribModal" />
    
    <!-- Modals -->
    <DetailModal />
    <AuthModal 
      :is-visible="isAuthModalVisible"
      @close="closeAuthModal"
      @success="handleAuthSuccess"
    />
    <ContribModal 
      :is-visible="isContribModalVisible"
      @close="closeContribModal"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Header from './components/Header.vue'
import DetailModal from './components/DetailModal.vue'
import AuthModal from './components/AuthModal.vue'
import ContribModal from './components/ContribModal.vue'
import FABAdd from './components/FABAdd.vue'
import { initializeUserState, setupAuthListener, isLoggedIn } from './services/userService.js'
import { useModal } from './composables/useModal.js'

// Modal states
const { isAuthModalVisible, openAuthModal, closeAuthModal } = useModal()
const isContribModalVisible = ref(false)

onMounted(() => {
  console.log('App mounted - initializing user state')
  
  // Initialize user state from localStorage
  initializeUserState()
  
  // Setup Firebase auth listener
  setupAuthListener()
})

// Modal handlers
const openContribModal = () => {
  isContribModalVisible.value = true
}

const closeContribModal = () => {
  isContribModalVisible.value = false
}

const handleAuthSuccess = () => {
  console.log('Authentication successful')
  // Modal will close automatically
}
</script>
