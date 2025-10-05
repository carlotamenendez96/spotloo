<template>
  <button
    @click="openContribModal"
    class="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-30 group"
    aria-label="Añadir baño público"
  >
    <!-- Plus icon -->
    <svg 
      class="w-6 h-6 transition-transform duration-200 group-hover:rotate-90" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
    
    <!-- Tooltip -->
    <div class="absolute right-16 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
      Añadir baño público
      <div class="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
    </div>
  </button>
</template>

<script setup>
// Emits
const emit = defineEmits(['open-contrib'])

// Open contribution modal
const openContribModal = () => {
  // TODO: Emit event to parent to open contribution modal
  console.log('Opening contribution modal')
  emit('open-contrib')
}
</script>
