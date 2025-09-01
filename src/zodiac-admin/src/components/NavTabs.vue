<template>
  <div class="nav-tabs">
    <button 
      class="nav-tab" 
      :class="{ active: currentTab === 'dashboard' }" 
      @click="$emit('tab-change', 'dashboard')"
    >
      <i class="fas fa-tachometer-alt"></i> Dashboard
    </button>
    <button 
      class="nav-tab" 
      :class="{ active: currentTab === 'versions' }" 
      @click="$emit('tab-change', 'versions')"
    >
      <i class="fas fa-list"></i> Versiones
    </button>
    <button 
      class="nav-tab" 
      :class="{ active: currentTab === 'upload' }" 
      @click="$emit('tab-change', 'upload')"
    >
      <i class="fas fa-upload"></i> Subir APK
    </button>
  </div>
</template>

<script>
export default {
  name: 'NavTabs',
  props: {
    currentTab: {
      type: String,
      required: true
    }
  },
  emits: ['tab-change']
}
</script>