<template>
  <div id="app">
    <!-- Header -->
    <AppHeader />
    
    <!-- Main Content -->
    <main class="container">
      <!-- Alert Messages -->
      <AlertMessage 
        v-if="alert.show"
        :type="alert.type"
        :message="alert.message"
        @close="closeAlert"
      />
      
      <!-- API Status Card -->
      <StatusCard 
        :api-status="apiStatus"
        @refresh="refreshApiStatus"
      />
      
      <!-- Navigation Tabs -->
      <NavTabs 
        :active-tab="activeTab"
        @change-tab="changeTab"
      />
      
      <!-- Tab Content -->
      <div class="tab-content">
        <DashboardTab 
          v-if="activeTab === 'dashboard'"
          @show-alert="showAlert"
        />
        
        <UploadTab 
          v-if="activeTab === 'upload'"
          @upload-success="handleUploadSuccess"
          @show-alert="showAlert"
        />
        
        <VersionsTab 
          v-if="activeTab === 'versions'"
          @version-deleted="handleVersionDeleted"
          @show-alert="showAlert"
        />
      </div>
    </main>
  </div>
</template>

<script>
import AppHeader from './components/AppHeader.vue'
import AlertMessage from './components/AlertMessage.vue'
import StatusCard from './components/StatusCard.vue'
import NavTabs from './components/NavTabs.vue'
import DashboardTab from './components/DashboardTab.vue'
import UploadTab from './components/UploadTab.vue'
import VersionsTab from './components/VersionsTab.vue'
import ApiService from './services/ApiService.js'

export default {
  name: 'App',
  components: {
    AppHeader,
    AlertMessage,
    StatusCard,
    NavTabs,
    DashboardTab,
    UploadTab,
    VersionsTab
  },
  
  data() {
    return {
      activeTab: 'dashboard',
      
      // Estado de la API
      apiStatus: {
        isOnline: false,
        apiHealth: null,
        s3Status: null,
        loading: true,
        lastCheck: null
      },
      
      // Sistema de alertas
      alert: {
        show: false,
        type: 'info',
        message: '',
        timeout: null
      }
    }
  },
  
  async created() {
    console.log('🚀 Zodiac Admin iniciado')
    await this.refreshApiStatus()
    
    // Check API status cada 5 minutos
    setInterval(this.refreshApiStatus, 5 * 60 * 1000)
  },
  
  methods: {
    /**
     * Cambiar tab activo
     */
    changeTab(tabName) {
      this.activeTab = tabName
      console.log(`📑 Cambiado a tab: ${tabName}`)
    },
    
    /**
     * Refrescar estado de la API
     */
    async refreshApiStatus() {
      console.log('🔄 Verificando estado de la API...')
      this.apiStatus.loading = true
      
      try {
        // Verificar salud de la API
        const healthResponse = await ApiService.getHealthStatus()
        this.apiStatus.apiHealth = healthResponse
        this.apiStatus.isOnline = healthResponse.success
        
        // Verificar estado de S3
        try {
          const s3Response = await ApiService.getS3Status()
          this.apiStatus.s3Status = s3Response
        } catch (s3Error) {
          console.warn('⚠️ Error verificando S3:', s3Error)
          this.apiStatus.s3Status = {
            success: false,
            message: 'Error conectando con S3',
            error: s3Error.response?.data?.error || s3Error.message
          }
        }
        
        this.apiStatus.lastCheck = new Date()
        console.log('✅ Estado de API actualizado')
        
      } catch (error) {
        console.error('❌ Error verificando API:', error)
        this.apiStatus.isOnline = false
        this.apiStatus.apiHealth = {
          success: false,
          message: 'API no disponible',
          error: error.message
        }
        this.apiStatus.s3Status = null
        this.apiStatus.lastCheck = new Date()
      } finally {
        this.apiStatus.loading = false
      }
    },
    
    /**
     * Mostrar alerta
     */
    showAlert(type, message, duration = 5000) {
      // Limpiar timeout anterior si existe
      if (this.alert.timeout) {
        clearTimeout(this.alert.timeout)
      }
      
      this.alert = {
        show: true,
        type,
        message,
        timeout: null
      }
      
      // Auto-ocultar después del tiempo especificado
      if (duration > 0) {
        this.alert.timeout = setTimeout(() => {
          this.closeAlert()
        }, duration)
      }
      
      console.log(`📢 Alert (${type}): ${message}`)
    },
    
    /**
     * Cerrar alerta
     */
    closeAlert() {
      if (this.alert.timeout) {
        clearTimeout(this.alert.timeout)
      }
      
      this.alert = {
        show: false,
        type: 'info',
        message: '',
        timeout: null
      }
    },
    
    /**
     * Manejar éxito en upload
     */
    handleUploadSuccess(data) {
      this.showAlert('success', `APK v${data.version} subido exitosamente`)
      
      // Cambiar a tab de versiones para ver el resultado
      setTimeout(() => {
        this.changeTab('versions')
      }, 2000)
      
      // Refrescar estado de la API
      setTimeout(this.refreshApiStatus, 1000)
    },
    
    /**
     * Manejar eliminación de versión
     */
    handleVersionDeleted(version) {
      this.showAlert('success', `Versión ${version} eliminada exitosamente`)
      
      // Refrescar estado de la API
      setTimeout(this.refreshApiStatus, 1000)
    }
  }
}
</script>

<style scoped>
#app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.tab-content {
  margin-top: 0;
}

/* Animación suave entre tabs */
.tab-content > * {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { 
    opacity: 0; 
    transform: translateY(10px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}
</style>