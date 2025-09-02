<template>
  <div class="container">
    <!-- Header -->
    <AppHeader />
    
    <!-- Status Card -->
    <StatusCard 
      :api-status="apiStatus" 
      :last-check="lastCheck" 
    />

    <!-- Navigation -->
    <NavTabs 
      :current-tab="currentTab" 
      @tab-change="currentTab = $event" 
    />

    <!-- Alerts -->
    <AlertMessage 
      v-if="message" 
      :message="message" 
      :type="messageType" 
    />

    <!-- Dashboard Tab -->
    <DashboardTab 
      v-if="currentTab === 'dashboard'"
      :versions="versions"
      :latest-version="latestVersion"
      :total-size="totalSize"
      :api-url="apiUrl"
    />

    <!-- Versions Tab -->
    <VersionsTab 
      v-if="currentTab === 'versions'"
      :versions="versions"
      :loading="loading"
      :api-url="apiUrl"
      @load-versions="loadVersions"
      @delete-version="deleteVersion"
    />

    <!-- Upload Tab -->
    <UploadTab 
      v-if="currentTab === 'upload'"
      :uploading="uploading"
      :upload-progress="uploadProgress"
      @upload-apk="uploadApk"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import ApiService from '@/services/ApiService'
import AppHeader from '@/components/AppHeader.vue'
import StatusCard from '@/components/StatusCard.vue'
import NavTabs from '@/components/NavTabs.vue'
import AlertMessage from '@/components/AlertMessage.vue'
import DashboardTab from '@/components/DashboardTab.vue'
import VersionsTab from '@/components/VersionsTab.vue'
import UploadTab from '@/components/UploadTab.vue'

export default {
  name: 'App',
  components: {
    AppHeader,
    StatusCard,
    NavTabs,
    AlertMessage,
    DashboardTab,
    VersionsTab,
    UploadTab
  },
  setup() {
    // Reactive data
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const currentTab = ref('dashboard')
    const apiStatus = ref('offline')
    const lastCheck = ref(null)
    const versions = ref([])
    const latestVersion = ref(null)
    const loading = ref(false)
    const uploading = ref(false)
    const uploadProgress = ref(0)
    const message = ref('')
    const messageType = ref('success')

    // Initialize API service
    const apiService = new ApiService(apiUrl)

    // Computed properties
    const totalSize = computed(() => {
      return versions.value.reduce((total, version) => total + version.fileSize, 0)
    })

    // Methods
    const checkApiStatus = async () => {
      try {
        const response = await apiService.checkHealth()
        apiStatus.value = response.success ? 'online' : 'offline'
      } catch (error) {
        apiStatus.value = 'offline'
      }
      lastCheck.value = new Date()
    }

    const loadVersions = async () => {
      loading.value = true
      try {
        const response = await apiService.getVersions()
        versions.value = response.data || []
      } catch (error) {
        showMessage('Error al cargar las versiones: ' + error.message, 'error')
      }
      loading.value = false
    }

    const loadLatestVersion = async () => {
      try {
        const response = await apiService.getLatestVersion()
        latestVersion.value = response.data
      } catch (error) {
        console.log('No hay versiones disponibles')
      }
    }

    const deleteVersion = async (version) => {
      if (!confirm(`¿Estás seguro de que quieres eliminar la versión ${version}?`)) {
        return
      }

      try {
        await apiService.deleteVersion(version)
        showMessage('Versión eliminada exitosamente', 'success')
        await loadVersions()
        await loadLatestVersion()
      } catch (error) {
        showMessage('Error al eliminar la versión: ' + error.message, 'error')
      }
    }

    const uploadApk = async (uploadData, progressCallback) => {
      uploading.value = true
      uploadProgress.value = 0

      try {
        await apiService.uploadApk(uploadData, (progress) => {
          uploadProgress.value = progress
          progressCallback?.(progress)
        })

        showMessage('APK subido exitosamente a AWS S3', 'success')
        await loadVersions()
        await loadLatestVersion()
        currentTab.value = 'versions'
      } catch (error) {
        console.error('Upload error:', error)
        
        // Manejo específico de errores CORS
        if (error.code === 'NETWORK_ERROR' || error.message.includes('CORS')) {
          showMessage('Error de CORS: Verifica que la API esté configurada correctamente. Intenta refrescar la página.', 'error')
        } else if (error.response?.status === 413) {
          showMessage('Error: Archivo demasiado grande. El límite es 200MB.', 'error')
        } else if (error.response?.status === 409) {
          showMessage('Error: Ya existe una versión con ese número.', 'error')
        } else {
          const errorMessage = error.response?.data?.message || error.message || 'Error desconocido'
          showMessage('Error al subir el APK: ' + errorMessage, 'error')
        }
      }

      uploading.value = false
      uploadProgress.value = 0
    }

    const showMessage = (msg, type) => {
      message.value = msg
      messageType.value = type
      setTimeout(() => {
        message.value = ''
      }, 5000)
    }

    // Lifecycle
    onMounted(() => {
      checkApiStatus()
      loadVersions()
      loadLatestVersion()
      
      // Check API status every 30 seconds
      setInterval(() => {
        checkApiStatus()
      }, 30000)
    })

    return {
      apiUrl,
      currentTab,
      apiStatus,
      lastCheck,
      versions,
      latestVersion,
      loading,
      uploading,
      uploadProgress,
      message,
      messageType,
      totalSize,
      loadVersions,
      deleteVersion,
      uploadApk
    }
  }
}
</script>