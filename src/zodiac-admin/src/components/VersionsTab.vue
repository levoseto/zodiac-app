<template>
  <div class="content-card">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2><i class="fas fa-list"></i> Gestión de Versiones</h2>
      <button @click="$emit('load-versions')" class="btn btn-primary" :disabled="loading">
        <i class="fas fa-sync-alt"></i> Actualizar
      </button>
    </div>

    <div v-if="loading" style="text-align: center; padding: 40px;">
      <div class="loading"></div>
      <p style="margin-top: 10px;">Cargando versiones...</p>
    </div>

    <div v-else-if="versions.length === 0" style="text-align: center; padding: 40px; color: #666;">
      <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 10px;"></i>
      <p>No hay versiones disponibles</p>
    </div>

    <div v-else>
      <div v-for="version in versions" :key="version.version" class="version-card">
        <div class="version-header">
          <div class="version-info">
            <div class="version-title">v{{ version.version }}</div>
            <div class="version-meta">
              <i class="fas fa-calendar"></i> {{ formatDate(version.uploadDate) }} |
              <i class="fas fa-file-archive"></i> {{ formatFileSize(version.fileSize) }} |
              <i class="fas fa-android"></i> Android {{ version.minAndroidVersion }}+ |
              <i class="fas fa-bullseye"></i> Target SDK {{ version.targetSdkVersion }}
            </div>
          </div>
          <div class="version-actions">
            <a :href="apiUrl + version.downloadUrl" class="btn btn-success" target="_blank">
              <i class="fas fa-download"></i> Descargar
            </a>
            <button @click="$emit('delete-version', version.version)" class="btn btn-danger">
              <i class="fas fa-trash"></i> Eliminar
            </button>
          </div>
        </div>
        <div v-if="version.releaseNotes">
          <strong>Notas de la versión:</strong>
          <p style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
            {{ version.releaseNotes }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { formatDate, formatFileSize } from '@/utils/formatters'

export default {
  name: 'VersionsTab',
  props: {
    versions: {
      type: Array,
      required: true
    },
    loading: {
      type: Boolean,
      required: true
    },
    apiUrl: {
      type: String,
      required: true
    }
  },
  emits: ['load-versions', 'delete-version'],
  setup() {
    return {
      formatDate,
      formatFileSize
    }
  }
}
</script>