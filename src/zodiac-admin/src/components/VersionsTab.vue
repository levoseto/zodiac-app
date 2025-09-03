<template>
  <div class="versions-tab">
    <!-- Versions List Card -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">
          Versiones Publicadas
          <span v-if="versions.length > 0" class="version-count">{{ versions.length }}</span>
        </h3>
        <button 
          class="btn btn-secondary btn-sm"
          @click="refreshVersions"
          :disabled="loading"
        >
          <svg v-if="loading" class="spinner" width="16" height="16" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.25"/>
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <svg v-else width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Actualizar
        </button>
      </div>
      
      <!-- Loading State -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        Cargando versiones...
      </div>
      
      <!-- Empty State -->
      <div v-else-if="versions.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
        </div>
        <h4>No hay versiones publicadas</h4>
        <p>Sube tu primer APK desde la pestaña "Subir APK"</p>
      </div>
      
      <!-- Versions Table -->
      <div v-else class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Versión</th>
              <th>Fecha</th>
              <th>Tamaño</th>
              <th>Android</th>
              <th>SDK</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="version in versions"
              :key="version.version"
              :class="{ 'latest-version': version === versions[0] }"
            >
              <!-- Version Column -->
              <td>
                <div class="version-cell">
                  <div class="version-number">
                    v{{ version.version }}
                    <span v-if="version === versions[0]" class="latest-badge">
                      Última
                    </span>
                  </div>
                  <div v-if="version.releaseNotes" class="version-notes">
                    {{ truncateText(version.releaseNotes, 60) }}
                  </div>
                </div>
              </td>
              
              <!-- Date Column -->
              <td>
                <div class="date-cell">
                  <div class="date-primary">
                    {{ formatDate(version.uploadDate) }}
                  </div>
                  <div class="date-relative">
                    {{ formatRelativeTime(version.uploadDate) }}
                  </div>
                </div>
              </td>
              
              <!-- Size Column -->
              <td>
                <div class="size-cell">
                  <div class="size-primary">
                    {{ version.fileSizeMB }} MB
                  </div>
                  <div class="size-secondary">
                    {{ formatFileSize(version.fileSize) }}
                  </div>
                </div>
              </td>
              
              <!-- Android Version Column -->
              <td>
                <div class="android-version">
                  {{ formatAndroidVersion(version.minAndroidVersion) }}
                </div>
              </td>
              
              <!-- SDK Version Column -->
              <td>
                <div class="sdk-version">
                  {{ version.targetSdkVersion }}
                </div>
              </td>
              
              <!-- Actions Column -->
              <td>
                <div class="actions-cell">
                  <div class="action-buttons">
                    <!-- Download Button -->
                    <button 
                      class="btn btn-sm btn-success"
                      @click="downloadVersion(version)"
                      title="Descargar APK"
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                      </svg>
                    </button>
                    
                    <!-- Copy Link Button -->
                    <button 
                      class="btn btn-sm btn-secondary"
                      @click="copyDownloadUrl(version)"
                      title="Copiar enlace de descarga"
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                      </svg>
                    </button>
                    
                    <!-- Delete Button -->
                    <button 
                      class="btn btn-sm btn-danger"
                      @click="confirmDelete(version)"
                      title="Eliminar versión"
                      :disabled="deletingVersions.has(version.version)"
                    >
                      <svg v-if="deletingVersions.has(version.version)" class="spinner" width="14" height="14" fill="none" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.25"/>
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      <svg v-else width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                  
                  <!-- Expanded Actions (Mobile) -->
                  <div class="mobile-actions">
                    <button 
                      class="mobile-actions-toggle"
                      @click="toggleMobileActions(version.version)"
                    >
                      <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
                      </svg>
                    </button>
                    
                    <div 
                      v-if="expandedActions === version.version"
                      class="mobile-actions-menu"
                    >
                      <button 
                        class="mobile-action-item"
                        @click="downloadVersion(version)"
                      >
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                        </svg>
                        Descargar
                      </button>
                      <button 
                        class="mobile-action-item"
                        @click="copyDownloadUrl(version)"
                      >
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                        </svg>
                        Copiar enlace
                      </button>
                      <button 
                        class="mobile-action-item mobile-action-danger"
                        @click="confirmDelete(version)"
                        :disabled="deletingVersions.has(version.version)"
                      >
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="cancelDelete">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4 class="modal-title">Confirmar Eliminación</h4>
          <button class="modal-close" @click="cancelDelete">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="delete-warning">
            <div class="warning-icon">
              <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L5.35 16.5c-.77.833.192 2.5 1.732 2.5z"/>
              </svg>
            </div>
            <div class="warning-content">
              <h5>¿Estás seguro que deseas eliminar la versión {{ versionToDelete?.version }}?</h5>
              <p>Esta acción:</p>
              <ul>
                <li>Eliminará el APK del almacenamiento AWS S3</li>
                <li>Desactivará la versión en la base de datos</li>
                <li>No podrá ser deshecha</li>
                <li>Los usuarios no podrán descargar esta versión</li>
              </ul>
              <div class="version-info-modal">
                <div><strong>Archivo:</strong> {{ versionToDelete?.fileSizeMB }} MB</div>
                <div><strong>Fecha:</strong> {{ versionToDelete ? formatDate(versionToDelete.uploadDate) : '' }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button 
            class="btn btn-secondary"
            @click="cancelDelete"
          >
            Cancelar
          </button>
          <button 
            class="btn btn-danger"
            @click="deleteVersion"
            :disabled="deleting"
          >
            <svg v-if="deleting" class="spinner" width="16" height="16" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.25"/>
              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            {{ deleting ? 'Eliminando...' : 'Sí, eliminar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ApiService from '../services/ApiService.js'
import { formatDate, formatRelativeTime, formatFileSize, formatAndroidVersion, truncateText } from '../utils/formatters.js'

export default {
  name: 'VersionsTab',
  
  emits: ['version-deleted', 'show-alert'],
  
  data() {
    return {
      versions: [],
      loading: true,
      
      // Delete functionality
      showDeleteModal: false,
      versionToDelete: null,
      deleting: false,
      deletingVersions: new Set(),
      
      // Mobile actions
      expandedActions: null
    }
  },
  
  async created() {
    await this.loadVersions()
  },
  
  methods: {
    /**
     * Load all versions
     */
    async loadVersions() {
      console.log('📋 Cargando versiones...')
      this.loading = true
      
      try {
        const response = await ApiService.getAllVersions()
        this.versions = response.data || []
        console.log(`✅ ${this.versions.length} versiones cargadas`)
        
        if (this.versions.length === 0) {
          this.$emit('show-alert', 'info', 'No hay versiones publicadas aún', 3000)
        }
        
      } catch (error) {
        console.error('❌ Error cargando versiones:', error)
        this.$emit('show-alert', 'error', 'Error cargando las versiones')
        this.versions = []
      } finally {
        this.loading = false
      }
    },
    
    /**
     * Refresh versions
     */
    async refreshVersions() {
      await this.loadVersions()
      this.$emit('show-alert', 'success', 'Versiones actualizadas', 2000)
    },
    
    /**
     * Download specific version
     */
    async downloadVersion(version) {
      try {
        await ApiService.downloadApk(version.version)
        this.$emit('show-alert', 'success', `Descargando APK v${version.version}`)
        this.expandedActions = null
      } catch (error) {
        console.error('Error descargando APK:', error)
        this.$emit('show-alert', 'error', 'Error iniciando la descarga')
      }
    },
    
    /**
     * Copy download URL to clipboard
     */
    async copyDownloadUrl(version) {
      const url = ApiService.getDownloadUrl(version.version)
      
      try {
        await navigator.clipboard.writeText(url)
        this.$emit('show-alert', 'success', 'Enlace copiado al portapapeles')
        this.expandedActions = null
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
        this.expandedActions = null
      }
    },
    
    /**
     * Confirm deletion of version
     */
    confirmDelete(version) {
      this.versionToDelete = version
      this.showDeleteModal = true
      this.expandedActions = null
    },
    
    /**
     * Cancel deletion
     */
    cancelDelete() {
      this.showDeleteModal = false
      this.versionToDelete = null
      this.deleting = false
    },
    
    /**
     * Delete version
     */
    async deleteVersion() {
      if (!this.versionToDelete) return
      
      const version = this.versionToDelete.version
      this.deleting = true
      this.deletingVersions.add(version)
      
      try {
        await ApiService.deleteVersion(version)
        
        // Remove from local list
        this.versions = this.versions.filter(v => v.version !== version)
        
        console.log(`🗑️ Versión ${version} eliminada`)
        this.$emit('version-deleted', version)
        this.cancelDelete()
        
      } catch (error) {
        console.error('Error eliminando versión:', error)
        const errorMessage = error.response?.data?.message || error.message
        this.$emit('show-alert', 'error', `Error eliminando versión: ${errorMessage}`)
      } finally {
        this.deleting = false
        this.deletingVersions.delete(version)
      }
    },
    
    /**
     * Toggle mobile actions menu
     */
    toggleMobileActions(versionId) {
      this.expandedActions = this.expandedActions === versionId ? null : versionId
    },
    
    // Utility methods
    formatDate,
    formatRelativeTime,
    formatFileSize,
    formatAndroidVersion,
    truncateText
  }
}
</script>

<style scoped>
.versions-tab {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.version-count {
  background: #667eea;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  min-width: 20px;
  text-align: center;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;
}

.empty-icon {
  margin-bottom: 20px;
}

.empty-icon svg {
  color: #d1d5db;
}

.empty-state h4 {
  margin: 0 0 8px 0;
  font-size: 1.25rem;
  color: #374151;
}

.empty-state p {
  margin: 0;
  font-size: 1rem;
}

/* Table Styles */
.table {
  font-size: 0.875rem;
}

.table th {
  font-weight: 600;
  color: #374151;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.table tr.latest-version {
  background: #f0f4ff;
  border-left: 3px solid #667eea;
}

/* Table Cells */
.version-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.version-number {
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
}

.latest-badge {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  font-size: 0.65rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.version-notes {
  font-size: 0.75rem;
  color: #6b7280;
  font-style: italic;
  line-height: 1.3;
}

.date-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.date-primary {
  color: #1f2937;
  font-weight: 500;
}

.date-relative {
  font-size: 0.75rem;
  color: #6b7280;
}

.size-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.size-primary {
  color: #1f2937;
  font-weight: 500;
}

.size-secondary {
  font-size: 0.75rem;
  color: #6b7280;
}

.android-version {
  font-size: 0.8rem;
  color: #1f2937;
  font-weight: 500;
}

.sdk-version {
  font-weight: 600;
  color: #667eea;
  background: #f0f4ff;
  padding: 4px 8px;
  border-radius: 6px;
  text-align: center;
  font-size: 0.8rem;
}

/* Actions */
.actions-cell {
  position: relative;
}

.action-buttons {
  display: flex;
  gap: 4px;
  align-items: center;
}

.mobile-actions {
  display: none;
  position: relative;
}

.mobile-actions-toggle {
  background: none;
  border: none;
  padding: 4px;
  border-radius: 4px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mobile-actions-toggle:hover {
  background: #f3f4f6;
  color: #374151;
}

.mobile-actions-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  padding: 8px;
  min-width: 140px;
  z-index: 10;
}

.mobile-action-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: none;
  border: none;
  color: #374151;
  font-size: 0.875rem;
  cursor: pointer;
  border-radius: 6px;
  width: 100%;
  text-align: left;
  transition: all 0.2s ease;
}

.mobile-action-item:hover {
  background: #f3f4f6;
}

.mobile-action-item.mobile-action-danger {
  color: #ef4444;
}

.mobile-action-item.mobile-action-danger:hover {
  background: #fef2f2;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: slideIn 0.3s ease-out;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.modal-close {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 12px 12px;
}

/* Delete Warning */
.delete-warning {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.warning-icon {
  flex-shrink: 0;
  color: #f59e0b;
}

.warning-content h5 {
  margin: 0 0 12px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.warning-content p {
  margin: 0 0 8px 0;
  color: #374151;
}

.warning-content ul {
  margin: 0 0 16px 20px;
  color: #6b7280;
  font-size: 0.875rem;
}

.warning-content li {
  margin-bottom: 4px;
}

.version-info-modal {
  background: #f3f4f6;
  padding: 12px;
  border-radius: 6px;
  font-size: 0.875rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { 
    opacity: 0; 
    transform: translateY(-10px) scale(0.95); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0) scale(1); 
  }
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  /* Hide action buttons, show mobile menu */
  .action-buttons {
    display: none;
  }
  
  .mobile-actions {
    display: block;
  }
  
  /* Stack table cells vertically on small screens */
  .table-responsive {
    font-size: 0.8rem;
  }
  
  .version-cell,
  .date-cell,
  .size-cell {
    gap: 2px;
  }
  
  .version-number {
    font-size: 0.875rem;
  }
  
  .version-notes {
    font-size: 0.7rem;
  }
  
  .latest-badge {
    font-size: 0.6rem;
    padding: 1px 4px;
  }
  
  .sdk-version {
    font-size: 0.75rem;
    padding: 2px 6px;
  }
  
  /* Modal adjustments */
  .modal-content {
    margin: 16px;
    width: calc(100% - 32px);
  }
  
  .delete-warning {
    flex-direction: column;
    gap: 12px;
  }
  
  .modal-footer {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .empty-state {
    padding: 40px 16px;
  }
  
  .table th,
  .table td {
    padding: 8px 6px;
  }
  
  .version-count {
    font-size: 0.7rem;
    padding: 1px 6px;
  }
  
  .card-title {
    font-size: 1rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>