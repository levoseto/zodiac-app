import axios from 'axios'

class ApiService {
  constructor(baseURL) {
    this.api = axios.create({
      baseURL: baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`)
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        return response.data
      },
      (error) => {
        console.error('API Error:', error.response?.data || error.message)
        return Promise.reject(error)
      }
    )
  }

  // Health check
  async checkHealth() {
    return await this.api.get('/api/health')
  }

  // Get all versions
  async getVersions() {
    return await this.api.get('/api/versions')
  }

  // Get latest version
  async getLatestVersion() {
    return await this.api.get('/api/version/latest')
  }

  // Compare version
  async compareVersion(currentVersion) {
    return await this.api.get(`/api/version/compare/${currentVersion}`)
  }

  // Delete version
  async deleteVersion(version) {
    return await this.api.delete(`/api/version/${version}`)
  }

  // Upload APK using presigned URL (direct to S3) - CORREGIDO
  async uploadApk(uploadData, onUploadProgress) {
    console.log(`🚀 Iniciando upload directo a S3 v${uploadData.version} (${(uploadData.file.size / 1024 / 1024).toFixed(2)}MB)`)

    try {
      // PASO 1: Obtener URL presignada del servidor
      console.log('📡 Solicitando URL presignada...')
      const presignedResponse = await this.api.post('/api/upload/presigned', {
        version: uploadData.version,
        fileSize: uploadData.file.size,
        fileName: uploadData.file.name
      })

      if (!presignedResponse.success) {
        throw new Error(presignedResponse.message || 'Error obteniendo URL presignada')
      }

      const presignedData = presignedResponse.data
      console.log(`✅ URL presignada obtenida (válida por ${presignedData.expiresIn}s)`)

      // PASO 2: Upload directo a S3 usando XMLHttpRequest (para progress tracking)
      console.log('📤 Subiendo directamente a AWS S3...')
      
      const uploadResult = await this.uploadFileToS3WithProgress(
        presignedData.presignedUrl,
        uploadData.file,
        presignedData.contentType,
        onUploadProgress
      )

      console.log('✅ Upload directo a S3 completado')

      // PASO 3: Confirmar al servidor que el upload fue exitoso
      console.log('💾 Confirmando upload en base de datos...')
      const confirmResponse = await this.api.post('/api/upload/confirm', {
        version: uploadData.version,
        s3Key: presignedData.s3Key,
        s3Bucket: presignedData.s3Bucket,
        fileSize: uploadData.file.size,
        fileName: uploadData.file.name,
        releaseNotes: uploadData.releaseNotes || '',
        minAndroidVersion: uploadData.minAndroidVersion || '5.0',
        targetSdkVersion: uploadData.targetSdkVersion || 33
      })

      console.log('✅ Upload confirmado exitosamente')
      return confirmResponse

    } catch (error) {
      console.error('❌ Error en upload directo a S3:', error)
      
      // Si el upload directo falla, intentar método tradicional como fallback
      if (error.message.includes('presigned') || error.message.includes('403') || error.message.includes('Forbidden')) {
        console.log('🔄 Fallback: intentando upload tradicional...')
        return await this.uploadApkTraditional(uploadData, onUploadProgress)
      }
      
      throw error
    }
  }

  // Upload directo a S3 con progress usando XMLHttpRequest
  uploadFileToS3WithProgress(presignedUrl, file, contentType, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      // Configurar progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100)
          console.log(`📊 Progreso S3: ${percentComplete}%`)
          onProgress?.(percentComplete)
        }
      })
      
      // Manejo de eventos
      xhr.addEventListener('load', () => {
        console.log(`📋 S3 Response Status: ${xhr.status}`)
        
        if (xhr.status >= 200 && xhr.status < 300) {
          console.log('✅ Upload exitoso a S3')
          resolve({ success: true, status: xhr.status })
        } else {
          const errorText = xhr.responseText
          console.error('❌ Error S3 Response:', errorText)
          reject(new Error(`S3 Upload failed: ${xhr.status} - ${errorText}`))
        }
      })
      
      xhr.addEventListener('error', (event) => {
        console.error('❌ XHR Network Error:', event)
        reject(new Error('Network error during S3 upload'))
      })
      
      xhr.addEventListener('timeout', () => {
        console.error('❌ XHR Timeout')
        reject(new Error('S3 upload timeout'))
      })
      
      // Configurar timeout (10 minutos)
      xhr.timeout = 600000
      
      // Preparar y enviar request a S3
      xhr.open('PUT', presignedUrl)
      xhr.setRequestHeader('Content-Type', contentType || 'application/vnd.android.package-archive')
      
      console.log(`📤 Enviando ${(file.size / 1024 / 1024).toFixed(2)}MB a S3...`)
      xhr.send(file)
    })
  }

  // Método de upload tradicional como fallback
  async uploadApkTraditional(uploadData, onUploadProgress) {
    const formData = new FormData()
    formData.append('apk', uploadData.file)
    formData.append('version', uploadData.version)
    formData.append('releaseNotes', uploadData.releaseNotes || '')
    formData.append('minAndroidVersion', uploadData.minAndroidVersion || '5.0')
    formData.append('targetSdkVersion', uploadData.targetSdkVersion || '33')

    console.log(`🔄 Upload tradicional de APK v${uploadData.version}`)

    const config = {
      timeout: 600000, // 10 minutos
      onUploadProgress: (progressEvent) => {
        if (progressEvent.lengthComputable) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onUploadProgress?.(progress)
        }
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    }

    return await this.api.post('/api/upload', formData, config)
  }

  // Get S3 status
  async getS3Status() {
    return await this.api.get('/api/s3/status')
  }

  // Get usage stats
  async getStats() {
    return await this.api.get('/api/stats')
  }

  // Get download URL
  getDownloadUrl(version) {
    return `${this.api.defaults.baseURL}/api/download/${version}`
  }

  // Test de conectividad simple (ya no necesitamos test CORS específico)
  async testConnection() {
    try {
      console.log('🧪 Testing API connectivity...')
      const response = await this.api.get('/api/health')
      console.log('✅ API connection successful')
      return { 
        success: true, 
        data: response,
        message: 'Conexión API exitosa'
      }
    } catch (error) {
      console.error('❌ API connection failed:', error.message)
      return { 
        success: false, 
        error: error.message,
        message: 'Error de conectividad con la API'
      }
    }
  }
}

export default ApiService