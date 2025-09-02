<template>
  <div class="content-card">
    <h2><i class="fas fa-chart-line"></i> Dashboard</h2>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-number">{{ versions.length }}</div>
        <div class="stat-label">Versiones Totales</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ latestVersion ? latestVersion.version : 'N/A' }}</div>
        <div class="stat-label">Última Versión</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ formatFileSize(totalSize) }}</div>
        <div class="stat-label">Tamaño Total</div>
      </div>
      <div class="stat-card" v-if="s3Stats">
        <div class="stat-number">{{ s3Stats.usedPercentage }}%</div>
        <div class="stat-label">AWS Free Tier Usado</div>
      </div>
    </div>

    <!-- S3 Status -->
    <div v-if="s3Status" class="s3-status-card" :class="s3Status.success ? 'status-success' : 'status-error'">
      <h3><i class="fab fa-aws"></i> AWS S3 Status</h3>
      <div class="status-info">
        <p><strong>Estado:</strong> {{ s3Status.success ? '✅ Conectado' : '❌ Error' }}</p>
        <p v-if="s3Status.success"><strong>Bucket:</strong> {{ s3Status.config?.bucket }}</p>
        <p v-if="s3Status.success"><strong>Región:</strong> {{ s3Status.config?.region }}</p>
        <p v-if="s3Status.success"><strong>Límite:</strong> {{ s3Status.config?.maxFileSize }}</p>
        <p v-if="!s3Status.success" class="error-text">{{ s3Status.message }}</p>
      </div>
    </div>

    <div v-if="latestVersion">
      <h3>Información de la Última Versión</h3>
      <div class="version-card">
        <div class="version-header">
          <div class="version-info">
            <div class="version-title">v{{ latestVersion.version }}</div>
            <div class="version-meta">
              <i class="fas fa-calendar"></i> {{ formatDate(latestVersion.uploadDate) }} |
              <i class="fas fa-file-archive"></i> {{ formatFileSize(latestVersion.fileSize) }} |
              <i class="fas fa-android"></i> Android {{ latestVersion.minAndroidVersion }}+ |
              <i class="fab fa-aws"></i> AWS S3
            </div>
          </div>
          <div class="version-actions">
            <a :href="apiUrl + latestVersion.downloadUrl" class="btn btn-success" target="_blank">
              <i class="fas fa-download"></i> Descargar
            </a>
          </div>
        </div>
        <div v-if="latestVersion.releaseNotes">
          <strong>Notas de la versión:</strong>
          <p style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
            {{ latestVersion.releaseNotes }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { formatDate, formatFileSize } from '@/utils/formatters'
import ApiService from '@/services/ApiService'

export default {
  name: 'DashboardTab',
  props: {
    versions: {
      type: Array,
      required: true
    },
    latestVersion: {
      type: Object,
      default: null
    },
    totalSize: {
      type: Number,
      required: true
    },
    apiUrl: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const s3Status = ref(null)
    const s3Stats = ref(null)
    const apiService = new ApiService(props.apiUrl)

    const loadS3Status = async () => {
      try {
        const response = await apiService.getS3Status()
        s3Status.value = response
      } catch (error) {
        s3Status.value = { 
          success: false, 
          message: 'Error conectando con AWS S3: ' + error.message 
        }
      }
    }

    const loadS3Stats = async () => {
      try {
        const response = await apiService.getStats()
        if (response.success) {
          s3Stats.value = response.stats.freeTeir
        }
      } catch (error) {
        console.error('Error loading S3 stats:', error)
      }
    }

    onMounted(() => {
      loadS3Status()
      loadS3Stats()
    })

    return {
      formatDate,
      formatFileSize,
      s3Status,
      s3Stats
    }
  }
}
</script>

<style scoped>
.s3-status-card {
  margin: 20px 0;
  padding: 20px;
  border-radius: 10px;
  border: 2px solid;
}

.status-success {
  background: #d4edda;
  border-color: #c3e6cb;
  color: #155724;
}

.status-error {
  background: #f8d7da;
  border-color: #f5c6cb;
  color: #721c24;
}

.status-info p {
  margin: 5px 0;
}

.error-text {
  font-weight: bold;
}
</style>