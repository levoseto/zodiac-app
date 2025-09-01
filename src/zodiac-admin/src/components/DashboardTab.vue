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
              <i class="fas fa-android"></i> Android {{ latestVersion.minAndroidVersion }}+
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
import { formatDate, formatFileSize } from '@/utils/formatters'

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
  setup() {
    return {
      formatDate,
      formatFileSize
    }
  }
}
</script>