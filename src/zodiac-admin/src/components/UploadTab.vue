<template>
  <div class="content-card">
    <h2><i class="fas fa-upload"></i> Subir Nueva Versión</h2>
    
    <!-- CORS Test Section -->
    <div class="cors-test-section" style="margin-bottom: 30px;">
      <button @click="testCorsConnection" class="btn btn-primary" :disabled="testingCors">
        <i v-if="testingCors" class="fas fa-spinner fa-spin"></i>
        <i v-else class="fas fa-network-wired"></i>
        {{ testingCors ? 'Verificando...' : 'Verificar Conexión CORS' }}
      </button>
      
      <div v-if="corsTestResult" class="cors-result" :class="corsTestResult.success ? 'cors-success' : 'cors-error'">
        <p>
          <strong>{{ corsTestResult.success ? '✅ CORS OK' : '❌ Error CORS' }}</strong>
        </p>
        <p v-if="!corsTestResult.success && corsTestResult.isCorsError">
          La conexión CORS falló. Verifica que la API esté funcionando y configurada correctamente.
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
        >
      </div>

      <div class="form-group">
        <label>Archivo APK</label>
        <div 
          class="file-upload"
          @click="$refs.fileInput.click()"
          @dragover.prevent="dragOver = true"
          @dragleave="dragOver = false"
          @drop.prevent="handleFileDrop"
          :class="{ dragover: dragOver }"
        >
          <div v-if="!form.file">
            <i class="fas fa-cloud-upload-alt" style="font-size: 3rem; color: #667eea; margin-bottom: 10px;"></i>
            <p><strong>Haz clic aquí</strong> o arrastra el archivo APK</p>
            <p style="color: #666; font-size: 0.9rem;">Máximo 200MB - Almacenamiento en AWS S3</p>
          </div>
          <div v-else>
            <i class="fab fa-android" style="font-size: 2rem; color: #27ae60; margin-bottom: 10px;"></i>
            <p><strong>{{ form.file.name }}</strong></p>
            <p style="color: #666; font-size: 0.9rem;">{{ formatFileSize(form.file.size) }}</p>
            <div class="file-info">
              <small><i class="fab fa-aws"></i> Se subirá a AWS S3</small>
            </div>
            <button type="button" @click.stop="form.file = null" class="btn btn-danger" style="margin-top: 10px;">
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
        >
      </div>

      <div v-if="uploadProgress > 0 && uploadProgress < 100" class="form-group">
        <label>Progreso de subida a AWS S3</label>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
        </div>
        <div class="progress-info">
          <span>{{ uploadProgress }}%</span>
          <span v-if="uploadSpeed">{{ uploadSpeed }} MB/s</span>
          <span v-if="estimatedTime">ETA: {{ estimatedTime }}</span>
        </div>
      </div>

      <div class="upload-info" style="margin-bottom: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #2196f3;">
        <h4><i class="fab fa-aws"></i> Información de AWS S3</h4>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>✅ Almacenamiento seguro en AWS S3</li>
          <li>✅ CDN global para descargas rápidas</li>
          <li>✅ Límite: 200MB por archivo</li>
          <li>✅ Backup automático y alta disponibilidad</li>
        </ul>
      </div>

      <button type="submit" class="btn btn-primary" :disabled="!form.file || uploading">
        <span v-if="uploading" class="loading"></span>
        <i v-else class="fab fa-aws"></i>
        {{ uploading ? 'Subiendo a AWS S3...' : 'Subir APK a AWS S3' }}
      </button>
    </form>
  </div>
</template>

<script>
import { ref } from 'vue'
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
    const testingCors = ref(false)
    const corsTestResult = ref(null)
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

    const testCorsConnection = async () => {
      testingCors.value = true
      corsTestResult.value = null
      
      try {
        const result = await apiService.testCors()
        corsTestResult.value = result
      } catch (error) {
        corsTestResult.value = {
          success: false,
          error: error.message,
          isCorsError: true
        }
      }
      
      testingCors.value = false
    }

    const validateFile = (file) => {
      if (file.size > 200 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 200MB.')
        return false
      }
      if (!file.name.endsWith('.apk')) {
        alert('Solo se permiten archivos APK.')
        return false
      }
      return true
    }

    const handleFileSelect = (event) => {
      const file = event.target.files[0]
      if (file && validateFile(file)) {
        form.value.file = file
        
        // Calcular estadísticas del archivo
        const sizeMB = file.size / 1024 / 1024
        console.log(`📱 APK seleccionado: ${file.name} (${sizeMB.toFixed(2)} MB)`)
      }
    }

    const handleFileDrop = (event) => {
      dragOver.value = false
      const file = event.dataTransfer.files[0]
      if (file && validateFile(file)) {
        form.value.file = file
      }
    }

    const calculateUploadStats = (progress) => {
      if (!uploadStartTime.value) {
        uploadStartTime.value = Date.now()
        return
      }

      const elapsed = (Date.now() - uploadStartTime.value) / 1000
      const totalSize = form.value.file.size
      const uploadedSize = (totalSize * progress) / 100
      const speed = uploadedSize / elapsed / 1024 / 1024 // MB/s
      
      uploadSpeed.value = speed.toFixed(1)
      
      if (progress > 5) { // Solo calcular ETA después del 5%
        const remainingSize = totalSize - uploadedSize
        const eta = remainingSize / (uploadedSize / elapsed) / 1000 // segundos
        
        if (eta < 60) {
          estimatedTime.value = `${Math.round(eta)}s`
        } else {
          estimatedTime.value = `${Math.round(eta / 60)}m ${Math.round(eta % 60)}s`
        }
      }
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

      // Resetear estadísticas de upload
      uploadStartTime.value = null
      uploadSpeed.value = null
      estimatedTime.value = null

      // Crear callback para progress con estadísticas
      const progressCallback = (progress) => {
        calculateUploadStats(progress)
      }

      emit('upload-apk', { ...form.value }, progressCallback)
      
      // Reset form after successful upload
      form.value = {
        version: '',
        releaseNotes: '',
        minAndroidVersion: '5.0',
        targetSdkVersion: 33,
        file: null
      }
    }

    return {
      dragOver,
      form,
      testingCors,
      corsTestResult,
      uploadSpeed,
      estimatedTime,
      formatFileSize,
      testCorsConnection,
      handleFileSelect,
      handleFileDrop,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.cors-test-section {
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 8px;
  background: #f9f9f9;
}

.cors-result {
  margin-top: 10px;
  padding: 10px;
  border-radius: 5px;
}

.cors-success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.cors-error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  font-size: 0.9rem;
  color: #666;
}

.file-info {
  margin-top: 5px;
  font-size: 0.8rem;
  color: #666;
}

.upload-info h4 {
  margin-bottom: 10px;
  color: #1976d2;
}

.upload-info ul {
  list-style: none;
}

.upload-info li {
  margin: 5px 0;
  color: #424242;
}
</style>