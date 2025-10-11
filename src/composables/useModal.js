import { ref } from 'vue'

// Estado global de los modales
const isAuthModalVisible = ref(false)

export function useModal() {
  const openAuthModal = () => {
    isAuthModalVisible.value = true
  }

  const closeAuthModal = () => {
    isAuthModalVisible.value = false
  }

  return {
    isAuthModalVisible,
    openAuthModal,
    closeAuthModal
  }
}

