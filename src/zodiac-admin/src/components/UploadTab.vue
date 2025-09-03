<template>
  <div class="upload-tab">
    <!-- Upload Form Card -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Subir Nueva Versión APK</h3>
        <div class="card-subtitle">
          Soporta archivos hasta 200MB. Los archivos grandes se suben directamente a S3.
        </div>
      </div>
      
      <form @submit.prevent="handleSubmit" class="upload-form">
        <!-- File Upload Area -->
        <div class="form-group">
          <label class="form-label">Archivo APK *</label>
          <div 
            class="form-file"
            :class="{ 
              'dragging': isDragging,
              'has-file': selectedFile,
              'error': fileError
            }"
            @drop="handleDrop"
            @dragover="handleDragOver"
            @dragenter="handleDragEnter"
            @dragleave="handleDragLeave"
            @click="triggerFileInput"
          >
            <input 
              ref="fileInput"
              type="file"
              accept=".apk,application/vnd.android.package-archive"
              @change="handleFileSelect"
              style="display: none"
            />
            
            <div v-if="!selectedFile" class="file-upload-content">
              <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
              </svg>
              <div class="file-upload-text">
                <p><strong>Haz clic para seleccionar</strong> o arrastra el archivo APK aquí</p>
                <p class="file-upload-hint">Máximo 200MB • Solo archivos .apk</p>
              </div>
            </div>
            
            <div v-else class="file-selected-content">
              <div class="file-info">
                <div class="file-icon">
                  <svg width="32" height="32" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <div class="file-details">
                  <div class="file-name">{{ selectedFile.name }}</div>
                  <div class="file-size">{{ formatFileSize(selectedFile.size) }}</div>
                  <div class="file-method">
                    {{ uploadMethod }}
                  </div>
                </div>
              </div>
              <button 
                type="button" 
                class="btn btn-sm btn-secondary"
                @click.stop="removeFile"
              >
                Cambiar
              </button>
            </div>
          </div>
          <div v-if="fileError" class="form-error">{{ fileError }}</div>
        </div>
        
        <!-- Version Input -->
        <div class="form-group">
          <label for="version" class="form-label">Versión (Semver) *</label>
          <input 
            id="version"
            v-model="formData.version"
            type="text"
            class="form-input"
            :class="{ error: errors.version }"
            placeholder="Ej: 1.0.0, 2.1.3, 1.0.0-beta.1"
            :disabled="uploading"
          />
          <div class="form-hint">
            Formato: MAYOR.MENOR.PARCHE (ej: 1.2.3)
          </div>
          <div v-if="errors.version" class="form-error">{{ errors.version }}</div>
        </div>
        
        <!-- Release Notes -->
        <div class="form-group">
          <label for="releaseNotes" class="form-label">Notas de la versión</label>
          <textarea 
            id="releaseNotes"
            v-model="formData.releaseNotes"
            class="form-input form-textarea"
            placeholder="Describe los cambios, mejoras y correcciones de esta versión..."
            rows="4"
            :disabled="uploading"
          ></textarea>
        </div>
        
        <!-- Advanced Settings -->
        <div class="form-group">
          <button 
            type="button"
            class="form-toggle"
            @click="showAdvanced = !showAdvanced"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
            Configuración avanzada
          </button>
        </div>
        
        <div v-show="showAdvanced" class="advanced-settings">
          <div class="form-row">
            <div class="form-group">
              <label for="minAndroidVersion" class="form-label">Android mínimo</label>
              <select 
                id="minAndroidVersion"
                v-model="formData.minAndroidVersion"
                class="form-input"
                :disabled="uploading"
              >
                <option value="4.0">4.0 Ice Cream Sandwich</option>
                <option value="4.1">4.1 Jelly Bean</option>
                <option value="4.4">4.4 KitKat</option>
                <option value="5.0">5.0 Lollipop</option>
                <option value="6.0">6.0 Marshmallow</option>
                <option value="7.0">7.0 Nougat</option>
                <option value="8.0">8.0 Oreo</option>
                <option value="9.0">9.0 Pie</option>
                <option value="10">10</option>
                <option value="11">11</option>
                <option value="12">12</option>
                <option value="13">13</option>
                <option value="14">14</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="targetSdkVersion" class="form-label">Target SDK</label>
              <input 
                id="targetSdkVersion"
                v-model.number="formData.targetSdkVersion"
                type="number"
                class="form-input"
                min="21"
                max="34"
                :disabled="uploading"
              />
            </div>
          </div>
        </div>
        
        <!-- Upload Progress -->
        <div v-if="uploading" class="upload-progress">
          <div class="progress-header">
            <span class="progress-status">{{ uploadStatus }}</span>
            <span class="progress-percentage">{{ uploadProgress }}%</span>
          </div>
          <div class="progress">
            <div 
              class="progress-bar"
              :style="{ width: uploadProgress + '%' }"
            ></div>
          </div>
          <div class="progress-details">
            <span v-if="uploadSpeed">{{ uploadSpeed }}</span>
            <span v-if="timeRemaining">{{ timeRemaining }}</span>
          </div>
        </div>
        
        <!-- Submit Button -->
        <div class="form-actions">
          <button 
            type="submit"
            class="btn btn-primary btn-lg"
            :disabled="!canSubmit || uploading"
          >
            <svg v-if="uploading" class="spinner" width="20" height="20" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.25"/>
              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            <svg v-else width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
            {{ uploading ? 'Subiendo...' : 'Subir APK' }}
          </button>
          
          <button 
            v-if="uploading"
            type="button"
            class="btn btn-secondary"
            @click="cancelUpload"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
    
    <!-- Upload Tips -->
    <div class="card">
      <div class="card-header">
        <h4 class="card-title">💡 Consejos para la subida</h4>
      </div>
      <div class="tips-content">
        <div class="tip-item">
          <div class="tip-icon">📱</div>
          <div class="tip-text">
            <strong>Versionado semántico:</strong> 
            Usa el formato MAYOR.MENOR.PARCHE (ej: 1.2.3)
          </div>
        </div>
        <div class="tip-item">
          <div class="tip-icon">⚡</div>
          <div class="tip-text">
            <strong>Archivos grandes:</strong> 
            Los APKs > 50MB se suben directamente a AWS S3 para mayor eficiencia
          </div>
        </div>
        <div class="tip-item">
          <div class="tip-icon">📝</div>
          <div class="tip-text">
            <strong>Notas de versión:</strong> 
            Describe los cambios para que los usuarios sepan qué esperar
          </div>
        </div>
        <div class="tip-item">
          <div class="tip-icon">🔒</div>
          <div class="tip-text">
            <strong>Seguridad:</strong> 
            Solo se permiten archivos APK válidos y se verifican en el servidor
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ApiService from '../services/ApiService.js'
import { formatFileSize, validateAndFormatVersion, formatTransferRate, formatTimeRemaining } from '../utils/formatters.js'

export default {
  name: 'UploadTab',
  
  emits: ['upload-success', 'show-alert'],
  
  data() {
    return {
      selectedFile: null,
      isDragging: false,
      fileError: '',
      uploading: false,
      uploadProgress: 0,
      uploadStatus: '',
      uploadSpeed: '',
      timeRemaining: '',
      
      // Form data
      formData: {
        version: '',
        releaseNotes: '',
        minAndroidVersion: '5.0',
        targetSdkVersion: 33
      },
      
      // UI state
      showAdvanced: false,
      
      // Validation errors
      errors: {},
      
      // Upload tracking
      uploadStartTime: null,
      lastProgressTime: null,
      lastProgressLoaded: 0,
      
      // Cancellation
      cancelSource: null
    }
  },
  
  computed: {
    canSubmit() {
      return this.selectedFile && 
             this.formData.version && 
             !this.fileError && 
             !this.errors.version
    },
    
    uploadMethod() {
      if (!this.selectedFile) return ''
      
      const sizeMB = this.selectedFile.size / 1024 / 1024
      if (sizeMB > 50) {
        return `Upload directo a S3 (${sizeMB.toFixed(1)}MB)`
      } else {
        return `Upload tradicional (${sizeMB.toFixed(1)}MB)`
      }
    }
  },
  
  watch: {
    'formData.version'(newValue) {
      this.validateVersion(newValue)
    }
  },
  
  methods: {
    /**
     * Manejo de drag and drop
     */
    handleDragOver(e) {
      e.preventDefault()
    },
    
    handleDragEnter(e) {
      e.preventDefault()
      this.isDragging = true
    },
    
    handleDragLeave(e) {
      e.preventDefault()
      if (e.target === e.currentTarget) {
        this.isDragging = false
      }
    },
    
    handleDrop(e) {
      e.preventDefault()
      this.isDragging = false
      
      const files = e.dataTransfer.files
      if (files.length > 0) {
        this.processFile(files[0])
      }
    },
    
    /**
     * Trigger file input
     */
    triggerFileInput() {
      if (!this.uploading) {
        this.$refs.fileInput.click()
      }
    },
    
    /**
     * Handle file selection
     */
    handleFileSelect(e) {
      const files = e.target.files
      if (files.length > 0) {
        this.processFile(files[0])
      }
    },
    
    /**
     * Process selected file
     */
    processFile(file) {
      // Reset errors
      this.fileError = ''
      
      // Validate file type
      if (!file.name.endsWith('.apk')) {
        this.fileError = 'Solo se permiten archivos APK (.apk)'
        return
      }
      
      // Validate file size (200MB max)
      const maxSize = 200 * 1024 * 1024 // 200MB
      if (file.size > maxSize) {
        this.fileError = `El archivo es demasiado grande. Máximo permitido: ${formatFileSize(maxSize)}`
        return
      }
      
      // Validate minimum file size (1KB)
      if (file.size < 1024) {
        this.fileError = 'El archivo es demasiado pequeño para ser un APK válido'
        return
      }
      
      this.selectedFile = file
      
      // Auto-generate version if empty
      if (!this.formData.version) {
        this.suggestVersion()
      }
      
      console.log('📱 APK seleccionado:', file.name, formatFileSize(file.size))
    },
    
    /**
     * Remove selected file
     */
    removeFile() {
      this.selectedFile = null
      this.fileError = ''
      this.$refs.fileInput.value = ''
    },
    
    /**
     * Suggest version based on timestamp
     */
    async suggestVersion() {
      try {
        // Get latest version and suggest next one
        const response = await ApiService.getLatestVersion()
        if (response.success) {
          const currentVersion = response.data.version
          const parts = currentVersion.split('.')
          if (parts.length === 3) {
            parts[2] = String(parseInt(parts[2]) + 1)
            this.formData.version = parts.join('.')
            return
          }
        }
      } catch (error) {
        // If no latest version or error, suggest 1.0.0
      }
      
      this.formData.version = '1.0.0'
    },
    
    /**
     * Validate version format
     */
    validateVersion(version) {
      this.errors.version = ''
      
      if (!version) {
        this.errors.version = 'La versión es requerida'
        return false
      }
      
      const validation = validateAndFormatVersion(version)
      if (!validation.isValid) {
        this.errors.version = 'Formato de versión inválido. Usa formato semver (ej: 1.0.0)'
        return false
      }
      
      return true
    },
    
    /**
     * Handle form submission
     */
    async handleSubmit() {
      // Final validation
      if (!this.validateForm()) {
        return
      }
      
      this.uploading = true
      this.uploadProgress = 0
      this.uploadStatus = 'Iniciando upload...'
      this.uploadStartTime = Date.now()
      
      try {
        const result = await ApiService.smartUpload(
          this.selectedFile,
          this.formData.version,
          this.formData.releaseNotes,
          this.formData.minAndroidVersion,
          this.formData.targetSdkVersion,
          this.handleUploadProgress
        )
        
        console.log('✅ Upload completado:', result)
        this.$emit('upload-success', result.data)
        this.resetForm()
        
      } catch (error) {
        console.error('❌ Error en upload:', error)
        const errorMessage = error.response?.data?.message || error.message
        this.$emit('show-alert', 'error', `Error subiendo APK: ${errorMessage}`)
      } finally {
        this.uploading = false
        this.uploadProgress = 0
        this.uploadStatus = ''
        this.uploadSpeed = ''
        this.timeRemaining = ''
      }
    },
    
    /**
     * Handle upload progress
     */
    handleUploadProgress(progressPercent) {
      this.uploadProgress = progressPercent
      
      // Calculate upload speed and ETA
      const currentTime = Date.now()
      
      if (this.lastProgressTime && progressPercent > this.lastProgressTime) {
        const timeDiff = (currentTime - this.lastProgressTime) / 1000 // seconds
        const sizeDiff = this.selectedFile.size * (progressPercent - this.lastProgressLoaded) / 100
        const speed = sizeDiff / timeDiff // bytes per second
        
        this.uploadSpeed = formatTransferRate(speed)
        
        // Calculate remaining time
        if (speed > 0 && progressPercent < 100) {
          const remainingSize = this.selectedFile.size * (100 - progressPercent) / 100
          const remainingTime = remainingSize / speed
          this.timeRemaining = formatTimeRemaining(remainingTime)
        }
      }
      
      this.lastProgressTime = currentTime
      this.lastProgressLoaded = progressPercent
      
      // Update status text
      if (progressPercent < 30) {
        this.uploadStatus = 'Subiendo archivo...'
      } else if (progressPercent < 90) {
        this.uploadStatus = 'Procesando...'
      } else if (progressPercent < 100) {
        this.uploadStatus = 'Finalizando...'
      } else {
        this.uploadStatus = 'Confirmando upload...'
      }
    },
    
    /**
     * Cancel upload
     */
    cancelUpload() {
      if (this.cancelSource) {
        this.cancelSource.cancel('Upload cancelado por el usuario')
      }
      
      this.uploading = false
      this.uploadProgress = 0
      this.uploadStatus = ''
      this.uploadSpeed = ''
      this.timeRemaining = ''
      
      this.$emit('show-alert', 'info', 'Upload cancelado')
    },
    
    /**
     * Validate entire form
     */
    validateForm() {
      let isValid = true
      
      // Validate file
      if (!this.selectedFile) {
        this.fileError = 'Selecciona un archivo APK'
        isValid = false
      }
      
      // Validate version
      if (!this.validateVersion(this.formData.version)) {
        isValid = false
      }
      
      return isValid
    },
    
    /**
     * Reset form
     */
    resetForm() {
      this.selectedFile = null
      this.fileError = ''
      this.formData = {
        version: '',
        releaseNotes: '',
        minAndroidVersion: '5.0',
        targetSdkVersion: 33
      }
      this.errors = {}
      this.showAdvanced = false
      this.$refs.fileInput.value = ''
    },
    
    /**
     * Format file size helper
     */
    formatFileSize
  }
}
</script>

<style scoped>
.upload-tab {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Form Styles */
.upload-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* File Upload Area */
.form-file {
  min-height: 120px;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  background: #f9fafb;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.form-file:hover {
  border-color: #667eea;
  background: #f0f4ff;
}

.form-file.dragging {
  border-color: #667eea;
  background: #e0e7ff;
  transform: scale(1.02);
}

.form-file.has-file {
  border-style: solid;
  border-color: #10b981;
  background: #ecfdf5;
}

.form-file.error {
  border-color: #ef4444;
  background: #fef2f2;
}

.file-upload-content {
  text-align: center;
  color: #6b7280;
}

.file-upload-content svg {
  margin-bottom: 16px;
  color: #9ca3af;
}

.file-upload-text p {
  margin: 0;
}

.file-upload-text p:first-child {
  font-size: 1rem;
  margin-bottom: 4px;
}

.file-upload-hint {
  font-size: 0.875rem;
  color: #9ca3af;
}

/* File Selected State */
.file-selected-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 16px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.file-icon {
  width: 48px;
  height: 48px;
  background: #667eea;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.file-details {
  flex: 1;
}

.file-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 2px;
}

.file-size {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 2px;
}

.file-method {
  font-size: 0.75rem;
  color: #667eea;
  font-weight: 500;
}

/* Form Controls */
.form-hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 4px;
}

.form-error {
  font-size: 0.75rem;
  color: #ef4444;
  margin-top: 4px;
}

.form-input.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* Advanced Settings */
.form-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  color: #667eea;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  padding: 8px 0;
  transition: color 0.2s ease;
}

.form-toggle:hover {
  color: #4f46e5;
}

.form-toggle svg {
  transition: transform 0.2s ease;
}

.advanced-settings {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-top: 8px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* Upload Progress */
.upload-progress {
  background: #f0f4ff;
  border: 1px solid #c7d2fe;
  border-radius: 8px;
  padding: 20px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-status {
  font-weight: 500;
  color: #374151;
}

.progress-percentage {
  font-weight: 600;
  color: #667eea;
}

.progress-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 0.75rem;
  color: #6b7280;
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
}

/* Tips Section */
.tips-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tip-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.tip-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.tip-text {
  font-size: 0.875rem;
  line-height: 1.5;
  color: #374151;
}

.tip-text strong {
  color: #1f2937;
}

/* Spinner Animation */
.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .upload-tab {
    gap: 16px;
  }
  
  .upload-form {
    gap: 16px;
  }
  
  .form-file {
    min-height: 100px;
    padding: 16px;
  }
  
  .file-selected-content {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .file-info {
    gap: 12px;
  }
  
  .file-icon {
    width: 40px;
    height: 40px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .form-actions {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 480px) {
  .form-file {
    min-height: 80px;
    padding: 12px;
  }
  
  .file-upload-content svg {
    width: 32px;
    height: 32px;
    margin-bottom: 8px;
  }
  
  .file-upload-text p:first-child {
    font-size: 0.875rem;
  }
  
  .file-icon {
    width: 36px;
    height: 36px;
  }
  
  .file-icon svg {
    width: 20px;
    height: 20px;
  }
  
  .advanced-settings {
    padding: 16px;
  }
  
  .upload-progress {
    padding: 16px;
  }
}
</style>