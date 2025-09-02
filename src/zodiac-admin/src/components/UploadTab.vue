<template>
  <div class="content-card">
    <h2><i class="fas fa-upload"></i> Subir Nueva Versión</h2>
    
    <!-- Connection Test Section -->
    <div class="connection-test-section" style="margin-bottom: 30px;">
      <button @click="testApiConnection" class="btn btn-primary" :disabled="testingConnection">
        <i v-if="testingConnection" class="fas fa-spinner fa-spin"></i>
        <i v-else class="fas fa-heartbeat"></i>
        {{ testingConnection ? 'Verificando...' : 'Verificar Conexión API' }}
      </button>
      
      <div v-if="connectionTestResult" class="connection-result" :class="connectionTestResult.success ? 'connection-success' : 'connection-error'">
        <p>
          <strong>{{ connectionTestResult.success ? '✅ API Conectada' : '❌ Error de Conexión' }}</strong>
        </p>
        <p>{{ connectionTestResult.message }}</p>
        <p v-if="connectionTestResult.success && connectionTestResult.data">
          <small>
            <i class="fab fa-aws"></i> {{ connectionTestResult.data.storage }} 
            | Límite: {{ connectionTestResult.data.maxUpload }}
            | Bucket: {{ connectionTestResult.data.bucket }}
          </small>
        </p>
      </div>
    </div>
    
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="version">Versión (formato semver, ej: 1.0.0)</label>
        <input 
          type="text" 
          id="version" 
          v-model="form.version" 
          class="form-control" 
          placeholder="1.0.0"
          pattern="^\d+\.\d+\.\d+$"
          required
          :disabled="uploading"
        >
      </div>

      <div class="form-group">
        <label for="releaseNotes">Notas de la versión</label>
        <textarea 
          id="releaseNotes" 
          v-model="form.releaseNotes" 
          class="form-control" 
          rows="4"
          placeholder="Describe los cambios y mejoras de esta versión..."
          :disabled="uploading"
        ></textarea>
      </div>

      <div class="form-group">
        <label for="minAndroidVersion">Versión mínima de Android</label>
        <input 
          type="text" 
          id="minAndroidVersion" 
          v-model="form.minAndroidVersion" 
          class="form-control" 
          placeholder="5.0"
          :disabled="uploading"
        >
      </div>

      <div class="form-group">
        <label for="targetSdkVersion">Target SDK Version</label>
        <input 
          type="number" 
          id="targetSdkVersion" 
          v-model="form.targetSdkVersion" 
          class="form-control" 
          placeholder="33"
          :disabled="uploading"
        >
      </div>

      <div class="form-group">
        <label>Archivo APK</label>
        <div 
          class="file-upload"
          @click="!uploading && $refs.fileInput.click()"
          @dragover.prevent="!uploading && (dragOver = true)"
          @dragleave="dragOver = false"
          @drop.prevent="!uploading && handleFileDrop"
          :class="{ dragover: dragOver, disabled: uploading }"
        >
          <div v-if="!form.file">
            <i class="fas fa-cloud-upload-alt" style="font-size: 3rem; color: #667eea; margin-bottom: 10px;"></i>
            <p><strong>Haz clic aquí</strong> o arrastra el archivo APK</p>
            <p style="color: #666; font-size: 0.9rem;">Máximo 200MB - Upload directo a AWS S3</p>
            <div class="upload-features">
              <small><i class="fas fa-check"></i> Sin limitaciones de Vercel</small> |
              <small><i class="fas fa-check"></i> URLs presignadas</small> |
              <small><i class="fab fa-aws"></i> S3 directo</small>
            </div>
          </div>
          <div v-else>
            <i class="fab fa-android" style="font-size: 2rem; color: #27ae60; margin-bottom: 10px;"></i>
            <p><strong>{{ form.file.name }}</strong></p>
            <div class="file-details">
              <p><i class="fas fa-weight-hanging"></i> {{ formatFileSize(form.file.size) }}</p>
              <p><i class="fab fa-aws"></i> Listo para upload directo a S3</p>
            </div>
            <button v-if="!uploading" type="button" @click.stop="removeFile" class="btn btn-danger" style="margin-top: 10px;">
              <i class="fas fa-times"></i> Remover
            </button>
          </div>
        </div>
        <input 
          type="file" 
          ref="fileInput" 
          @change="handleFileSelect" 
          accept=".apk"
          style="display: none;"
          :disabled="uploading"
        >
      </div>

      <!-- Progress Section para Upload Directo a S3 -->
      <div v-if="uploadProgress > 0" class="form-group">
        <label>
          <i class="fab fa-aws"></i> Upload Directo a AWS S3
          <span v-if="uploadSpeed && uploadProgress < 100" class="upload-speed">{{ uploadSpeed }} MB/s</span>
        </label>
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
          </div>
          <div class="progress-info">
            <span class="progress-percent">{{ uploadProgress }}%</span>
            <span v-if="estimatedTime && uploadProgress < 100" class="progress-eta">ETA: {{ estimatedTime }}</span>
          </div>
        </div>
        <div class="upload-steps" style="margin-top: 10px;">
          <small v-if="uploadProgress < 5">📡 Obteniendo URL presignada...</small>
          <small v-else-if="uploadProgress < 95">📤 Subiendo directo a S3 (sin pasar por Vercel)...</small>
          <small v-else-if="uploadProgress < 100">💾 Confirmando en base de datos...</small>
          <small v-else class="success-message">✅ Upload directo completado exitosamente</small>
        </div>
      </div>

      <!-- S3 Direct Upload Info -->
      <div class="s3-info" style="margin-bottom: 20px; padding: 15px; background: linear-gradient(135deg, #e8f5e8 0%, #d4edda 100%); border-radius: 8px; border-left: 4px solid #28a745;">
        <h4><i class="fab fa-aws"></i> Upload Directo a AWS S3 (2025)</h4>
        <div class="info-grid">
          <div class="info-column">
            <h5>🚀 Ventajas del Upload Directo:</h5>
            <ul>
              <li>✅ <strong>Sin límites de Vercel</strong> - Archivos hasta 200MB</li>
              <li>✅ <strong>Velocidad máxima</strong> - Directo a AWS sin proxy</li>
              <li>✅ <strong>URLs presignadas</strong> - Seguridad enterprise</li>
              <li>✅ <strong>Fallback automático</strong> - Método tradicional si falla</li>
            </ul>
          </div>
          <div class="info-column">
            <h5>🔄 Proceso de 3 Pasos:</h5>
            <ol>
              <li><strong>Solicitar URL presignada</strong> del servidor</li>
              <li><strong>Upload directo</strong> a AWS S3</li>
              <li><strong>Confirmar y guardar</strong> metadata</li>
            </ol>
          </div>
        </div>
      </div>

      <button type="submit" class="btn btn-primary" :disabled="!form.file || uploading">
        <span v-if="uploading" class="loading"></span>
        <i v-else class="fab fa-aws"></i>
        {{ getUploadButtonText() }}
      </button>
      
      <div v-if="uploading" class="upload-warning" style="margin-top: 10px; font-size: 0.9rem; color: #856404;">
        <i class="fas fa-info-circle"></i>
        No cierres esta ventana durante el upload. El proceso puede tardar varios minutos para archivos grandes.
      </div>
    </form>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { formatFileSize } from '@/utils/formatters'
import ApiService from '@/services/ApiService'

export default {
  name: 'UploadTab',
  props: {
    uploading: {
      type: Boolean,
      required: true
    },
    uploadProgress: {
      type: Number,
      required: true
    }
  },
  emits: ['upload-apk'],
  setup(props, { emit }) {
    const dragOver = ref(false)
    const testingConnection = ref(false)
    const connectionTestResult = ref(null)
    const uploadSpeed = ref(null)
    const estimatedTime = ref(null)
    const uploadStartTime = ref(null)
    
    const form = ref({
      version: '',
      releaseNotes: '',
      minAndroidVersion: '5.0',
      targetSdkVersion: 33,
      file: null
    })

    // Get API service instance
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const apiService = new ApiService(apiUrl)

    const testApiConnection = async () => {
      testingConnection.value = true
      connectionTestResult.value = null
      
      try {
        const result = await apiService.testConnection()
        connectionTestResult.value = result
      } catch (error) {
        connectionTestResult.value = {
          success: false,
          error: error.message,
          message: 'Error de conectividad con la API'
        }
      }
      
      testingConnection.value = false
    }

    const validateFile = (file) => {
      if (!file) {
        alert('No se seleccionó archivo')
        return false
      }
      
      if (file.size > 200 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 200MB.')
        return false
      }
      
      if (!file.name.endsWith('.apk')) {
        alert('Solo se permiten archivos APK.')
        return false
      }
      
      if (file.size === 0) {
        alert('El archivo está vacío.')
        return false
      }
      
      return true
    }

    const handleFileSelect = (event) => {
      const file = event.target.files[0]
      if (file && validateFile(file)) {
        form.value.file = file
        console.log(`📱 APK seleccionado: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)
      }
    }

    const handleFileDrop = (event) => {
      dragOver.value = false
      const file = event.dataTransfer.files[0]
      if (file && validateFile(file)) {
        form.value.file = file
        console.log(`📱 APK arrastrado: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`)
      }
    }

    const removeFile = () => {
      form.value.file = null
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = ''
      }
    }

    const calculateUploadStats = (progress) => {
      if (!uploadStartTime.value || progress <= 0) {
        uploadStartTime.value = Date.now()
        return
      }

      const elapsed = (Date.now() - uploadStartTime.value) / 1000
      const totalSize = form.value.file.size
      const uploadedSize = (totalSize * progress) / 100
      
      if (elapsed > 1) { // Solo después de 1 segundo
        const speed = uploadedSize / elapsed / 1024 / 1024 // MB/s
        uploadSpeed.value = speed.toFixed(1)
        
        if (progress > 10 && progress < 95) {
          const remainingSize = totalSize - uploadedSize
          const eta = remainingSize / (uploadedSize / elapsed) // segundos
          
          if (eta < 60) {
            estimatedTime.value = `${Math.round(eta)}s`
          } else if (eta < 3600) {
            estimatedTime.value = `${Math.round(eta / 60)}m ${Math.round(eta % 60)}s`
          } else {
            estimatedTime.value = `${Math.round(eta / 3600)}h ${Math.round((eta % 3600) / 60)}m`
          }
        }
      }
    }

    const resetUploadStats = () => {
      uploadStartTime.value = null
      uploadSpeed.value = null
      estimatedTime.value = null
    }

    const handleSubmit = () => {
      if (!form.value.file || !form.value.version) {
        alert('Por favor completa todos los campos requeridos.')
        return
      }

      // Validar formato semver
      const semverRegex = /^\d+\.\d+\.\d+$/
      if (!semverRegex.test(form.value.version)) {
        alert('La versión debe seguir el formato semver (ej: 1.0.0)')
        return
      }

      // Resetear estadísticas
      resetUploadStats()

      console.log(`🚀 Iniciando upload directo a S3 v${form.value.version}`)

      // Callback de progress con estadísticas
      const progressCallback = (progress) => {
        calculateUploadStats(progress)
      }

      emit('upload-apk', { ...form.value }, progressCallback)
      
      // Reset form después de iniciar upload
      setTimeout(() => {
        form.value = {
          version: '',
          releaseNotes: '',
          minAndroidVersion: '5.0',
          targetSdkVersion: 33,
          file: null
        }
        resetUploadStats()
      }, 1000) // Resetear después de que el upload comience
    }

    const getUploadButtonText = () => {
      if (props.uploading) {
        if (props.uploadProgress < 5) return 'Obteniendo URL presignada...'
        if (props.uploadProgress < 95) return `Subiendo a S3... ${props.uploadProgress}%`
        if (props.uploadProgress < 100) return 'Confirmando...'
        return 'Completando...'
      }
      return 'Subir APK a AWS S3'
    }

    return {
      dragOver,
      form,
      testingConnection,
      connectionTestResult,
      uploadSpeed,
      estimatedTime,
      formatFileSize,
      testApiConnection,
      handleFileSelect,
      handleFileDrop,
      removeFile,
      handleSubmit,
      getUploadButtonText
    }
  }
}
</script>

<style scoped>
.connection-test-section {
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 8px;
  background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%);
}

.connection-result {
  margin-top: 10px;
  padding: 10px;
  border-radius: 5px;
}

.connection-success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.connection-error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.file-upload.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.progress-container {
  margin-top: 5px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 0.9rem;
}

.progress-percent {
  font-weight: bold;
  color: #667eea;
}

.progress-eta {
  color: #666;
}

.upload-speed {
  float: right;
  color: #27ae60;
  font-weight: bold;
}

.file-details p {
  margin: 5px 0;
  color: #666;
}

.upload-features {
  margin-top: 10px;
  color: #4caf50;
  font-size: 0.85rem;
}

.s3-info h4 {
  margin-bottom: 15px;
  color: #155724;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.info-column h5 {
  color: #0d4f8c;
  margin-bottom: 8px;
  font-size: 0.95rem;
}

.info-column ul, .info-column ol {
  margin: 0;
  padding-left: 18px;
  font-size: 0.9rem;
}

.info-column li {
  margin: 4px 0;
  color: #495057;
}

.upload-steps {
  text-align: center;
  font-weight: 500;
}

.success-message {
  color: #28a745;
}

.upload-warning {
  background: #fff3cd;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #ffeaa7;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .progress-info {
    flex-direction: column;
    gap: 5px;
    text-align: center;
  }
  
  .upload-speed {
    float: none;
  }
}
</style>