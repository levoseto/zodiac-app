<template>
  <div class="dashboard-tab">
    <!-- Statistics Cards -->
    <div class="stats-section">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon stat-versions">
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fill-rule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6.5a1.5 1.5 0 01-1.5 1.5h-8A1.5 1.5 0 015 11.5V5zm3 2a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100-2H7a1 1 0 000 2zm3-2a1 1 0 000 2h3a1 1 0 100-2h-3z"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalVersions || 0 }}</div>
            <div class="stat-label">Versiones totales</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon stat-storage">
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalSizeMB || '0.00' }} MB</div>
            <div class="stat-label">Espacio utilizado</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon stat-usage">
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.5 4a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm-3 2.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ usagePercentage }}%</div>
            <div class="stat-label">Uso del free tier</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon stat-average">
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3-1a1 1 0 00-1 1v5a1 1 0 102 0v-5a1 1 0 00-1-1zm-4 3a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z"/>
            </svg>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.averageSizeMB || '0.00' }} MB</div>
            <div class="stat-label">Promedio por APK</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Latest Version Card -->
    <div class="latest-version-section">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Última Versión Publicada</h3>
        </div>
        
        <div v-if="loadingLatest" class="loading">
          <div class="spinner"></div>
          Cargando información...
        </div>
        
        <div v-else-if="latestVersion" class="latest-version-content">
          <div class="version-info">
            <div class="version-main">
              <div class="version-number">
                v{{ latestVersion.version }}
              </div>
              <div class="version-date">
                Publicado {{ formatRelativeTime(latestVersion.uploadDate) }}
              </div>
            </div>
            
            <div class="version-stats">
              <div class="version-stat">
                <span class="stat-label">Tamaño:</span>
                <span class="stat-value">{{ latestVersion.fileSizeMB }} MB</span>
              </div>
              <div class="version-stat">
                <span class="stat-label">Android mínimo:</span>
                <span class="stat-value">{{ formatAndroidVersion(latestVersion.minAndroidVersion) }}</span>
              </div>
              <div class="version-stat">
                <span class="stat-label">Target SDK:</span>
                <span class="stat-value">{{ latestVersion.targetSdkVersion }}</span>
              </div>
            </div>
          </div>
          
          <div v-if="latestVersion.releaseNotes" class="release-notes">
            <h4>Notas de la versión:</h4>
            <p>{{ latestVersion.releaseNotes }}</p>
          </div>
          
          <div class="version-actions">
            <button 
              class="btn btn-primary"
              @click="downloadLatest"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              </svg>
              Descargar APK
            </button>
            <button 
              class="btn btn-secondary"
              @click="copyDownloadUrl"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
              Copiar enlace
            </button>
          </div>
        </div>
        
        <div v-else class="no-versions">
          <div class="empty-state">
            <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <h4>No hay versiones disponibles</h4>
            <p>Sube tu primer APK para comenzar</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Storage Usage Progress -->
    <div v-if="stats.freeTeir" class="storage-section">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Uso del Almacenamiento (AWS S3)</h3>
        </div>
        <div class="storage-content">
          <div class="progress-section">
            <div class="progress-info">
              <span>{{ stats.totalSizeGB || '0.000' }} GB de {{ stats.freeTeir.limitGB }} GB utilizados</span>
              <span class="progress-percentage">{{ usagePercentage }}%</span>
            </div>
            <div class="progress">
              <div 
                class="progress-bar" 
                :class="progressBarClass"
                :style="{ width: usagePercentage + '%' }"
              ></div>
            </div>
            <div class="storage-details">
              <span>Restante: {{ stats.freeTeir.remainingGB || '5.000' }} GB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ApiService from '../services/ApiService.js'
import { formatRelativeTime, formatAndroidVersion } from '../utils/formatters.js'

export default {
  name: 'DashboardTab',
  
  emits: ['show-alert'],
  
  data() {
    return {
      stats: {},
      latestVersion: null,
      loadingStats: true,
      loadingLatest: true
    }
  },
  
  computed: {
    usagePercentage() {
      return this.stats.freeTeir?.usedPercentage?.toFixed(1) || '0.0'
    },
    
    progressBarClass() {
      const percentage = parseFloat(this.usagePercentage)
      if (percentage >= 90) return 'progress-danger'
      if (percentage >= 70) return 'progress-warning'
      return 'progress-normal'
    }
  },
  
  async created() {
    await this.loadDashboardData()
  },
  
  methods: {
    /**
     * Cargar todos los datos del dashboard
     */
    async loadDashboardData() {
      console.log('📊 Cargando datos del dashboard...')
      
      try {
        // Cargar estadísticas y última versión en paralelo
        const [statsResponse, latestResponse] = await Promise.allSettled([
          ApiService.getStats(),
          ApiService.getLatestVersion()
        ])
        
        // Procesar estadísticas
        if (statsResponse.status === 'fulfilled') {
          this.stats = statsResponse.value.stats
          console.log('✅ Estadísticas cargadas:', this.stats)
        } else {
          console.warn('⚠️ Error cargando estadísticas:', statsResponse.reason)
          this.$emit('show-alert', 'warning', 'No se pudieron cargar las estadísticas')
        }
        
        // Procesar última versión
        if (latestResponse.status === 'fulfilled') {
          this.latestVersion = latestResponse.value.data
          console.log('✅ Última versión cargada:', this.latestVersion)
        } else {
          console.warn('⚠️ Error cargando última versión:', latestResponse.reason)
          if (latestResponse.reason.response?.status !== 404) {
            this.$emit('show-alert', 'warning', 'No se pudo cargar la información de la última versión')
          }
        }
        
      } catch (error) {
        console.error('❌ Error cargando dashboard:', error)
        this.$emit('show-alert', 'error', 'Error cargando los datos del dashboard')
      } finally {
        this.loadingStats = false
        this.loadingLatest = false
      }
    },
    
    /**
     * Descargar la última versión
     */
    async downloadLatest() {
      if (!this.latestVersion) return
      
      try {
        await ApiService.downloadApk(this.latestVersion.version)
        this.$emit('show-alert', 'success', `Descargando APK v${this.latestVersion.version}`)
      } catch (error) {
        console.error('Error descargando APK:', error)
        this.$emit('show-alert', 'error', 'Error iniciando la descarga')
      }
    },
    
    /**
     * Copiar enlace de descarga
     */
    async copyDownloadUrl() {
      if (!this.latestVersion) return
      
      const url = ApiService.getDownloadUrl(this.latestVersion.version)
      
      try {
        await navigator.clipboard.writeText(url)
        this.$emit('show-alert', 'success', 'Enlace copiado al portapapeles')
      } catch (error) {
        console.warn('Error copiando al portapapeles:', error)
        // Fallback para navegadores que no soportan clipboard API
        const textArea = document.createElement('textarea')
        textArea.value = url
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        this.$emit('show-alert', 'success', 'Enlace copiado al portapapeles')
      }
    },
    
    /**
     * Formatear tiempo relativo
     */
    formatRelativeTime,
    
    /**
     * Formatear versión de Android
     */
    formatAndroidVersion
  }
}
</script>

<style scoped>
.dashboard-tab {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Stats Section */
.stats-section {
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border-left: 4px solid #667eea;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.stat-icon.stat-versions {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.stat-icon.stat-storage {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}

.stat-icon.stat-usage {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}

.stat-icon.stat-average {
  background: linear-gradient(135deg, #43e97b, #38f9d7);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.2;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

/* Latest Version Section */
.latest-version-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.version-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.version-main {
  flex: 1;
}

.version-number {
  font-size: 2rem;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 4px;
}

.version-date {
  font-size: 0.875rem;
  color: #6b7280;
}

.version-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.version-stat {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  min-width: 200px;
}

.version-stat .stat-label {
  color: #6b7280;
  font-size: 0.875rem;
}

.version-stat .stat-value {
  color: #1f2937;
  font-weight: 500;
  font-size: 0.875rem;
}

.release-notes {
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.release-notes h4 {
  margin: 0 0 8px 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.release-notes p {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
}

.version-actions {
  display: flex;
  gap: 12px;
}

/* Empty State */
.no-versions {
  padding: 40px 0;
}

.empty-state {
  text-align: center;
  color: #6b7280;
}

.empty-state svg {
  margin-bottom: 16px;
  color: #d1d5db;
}

.empty-state h4 {
  margin: 0 0 8px 0;
  font-size: 1.125rem;
  color: #374151;
}

.empty-state p {
  margin: 0;
  font-size: 0.875rem;
}

/* Storage Section */
.storage-content {
  padding: 0;
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.progress-percentage {
  font-weight: 600;
  color: #667eea;
}

.progress {
  width: 100%;
  height: 12px;
  background: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 6px;
  transition: width 0.3s ease, background 0.3s ease;
}

.progress-bar.progress-normal {
  background: linear-gradient(90deg, #10b981, #059669);
}

.progress-bar.progress-warning {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.progress-bar.progress-danger {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.storage-details {
  text-align: right;
  font-size: 0.75rem;
  color: #9ca3af;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    padding: 16px;
  }
  
  .stat-icon {
    width: 40px;
    height: 40px;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
  
  .version-info {
    flex-direction: column;
    gap: 16px;
  }
  
  .version-stats {
    align-self: stretch;
  }
  
  .version-stat {
    min-width: auto;
  }
  
  .version-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .dashboard-tab {
    gap: 16px;
  }
  
  .stats-section {
    margin-bottom: 16px;
  }
  
  .stat-card {
    padding: 12px;
    gap: 12px;
  }
  
  .stat-icon {
    width: 36px;
    height: 36px;
  }
  
  .stat-icon svg {
    width: 20px;
    height: 20px;
  }
  
  .stat-value {
    font-size: 1.25rem;
  }
  
  .version-number {
    font-size: 1.5rem;
  }
}
</style>