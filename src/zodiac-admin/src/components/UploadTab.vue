<template>
  <div class="content-card">
    <h2><i class="fas fa-upload"></i> Subir Nueva Versión</h2>
    
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
            <p style="color: #666; font-size: 0.9rem;">Máximo 100MB</p>
          </div>
          <div v-else>
            <i class="fas fa-file-archive" style="font-size: 2rem; color: #27ae60; margin-bottom: 10px;"></i>
            <p><strong>{{ form.file.name }}</strong></p>
            <p style="color: #666; font-size: 0.9rem;">{{ formatFileSize(form.file.size) }}</p>
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
        <label>Progreso de subida</label>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
        </div>
        <p style="text-align: center; margin-top: 5px;">{{ uploadProgress }}%</p>
      </div>

      <button type="submit" class="btn btn-primary" :disabled="!form.file || uploading">
        <span v-if="uploading" class="loading"></span>
        <i v-else class="fas fa-upload"></i>
        {{ uploading ? 'Subiendo...' : 'Subir APK' }}
      </button>
    </form>
  </div>
</template>

<script>
import { ref } from 'vue'
import { formatFileSize } from '@/utils/formatters'

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
    const form = ref({
      version: '',
      releaseNotes: '',
      minAndroidVersion: '5.0',
      targetSdkVersion: 33,
      file: null
    })

    const validateFile = (file) => {
      if (file.size > 100 * 1024 * 1024) {
        alert('El archivo es demasiado grande. Máximo 100MB.')
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
      }
    }

    const handleFileDrop = (event) => {
      dragOver.value = false
      const file = event.dataTransfer.files[0]
      if (file && validateFile(file)) {
        form.value.file = file
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

      emit('upload-apk', { ...form.value })
      
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
      formatFileSize,
      handleFileSelect,
      handleFileDrop,
      handleSubmit
    }
  }
}
</script>