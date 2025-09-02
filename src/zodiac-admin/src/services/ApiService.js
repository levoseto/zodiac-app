import axios from 'axios'

class ApiService {
  constructor(baseURL) {
    this.api = axios.create({
      baseURL: baseURL,
      timeout: 300000, // 5 minutos para uploads grandes
      withCredentials: false, // Cambiado a false para evitar problemas de CORS
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`)
        
        // Headers específicos para CORS
        config.headers['X-Requested-With'] = 'XMLHttpRequest'
        
        // Para uploads de archivos, no establecer Content-Type (lo hará el navegador)
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type']
          config.timeout = 600000 // 10 minutos para uploads
        }
        
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
        
        // Manejo específico de errores CORS
        if (error.code === 'NETWORK_ERROR' || error.message.includes('CORS')) {
          console.error('Error de CORS detectado. Verifica la configuración del servidor.')
        }
        
        return Promise.reject(error)
      }
    )
  }

  // Health check
  async checkHealth() {
    return await this.api.get('/api/health', { timeout: 10000 })
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

  // Upload APK with improved CORS handling
  async uploadApk(uploadData, onUploadProgress) {
    const formData = new FormData()
    formData.append('apk', uploadData.file)
    formData.append('version', uploadData.version)
    formData.append('releaseNotes', uploadData.releaseNotes || '')
    formData.append('minAndroidVersion', uploadData.minAndroidVersion || '5.0')
    formData.append('targetSdkVersion', uploadData.targetSdkVersion || '33')

    // Configuración específica para upload con CORS
    const config = {
      headers: {
        // No establecer Content-Type, el navegador lo hará automáticamente con boundary
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-File-Name': uploadData.file.name
      },
      timeout: 600000, // 10 minutos para archivos grandes
      onUploadProgress: (progressEvent) => {
        if (progressEvent.lengthComputable) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          console.log(`Upload progress: ${progress}%`)
          onUploadProgress?.(progress)
        }
      },
      // Configuración adicional para archivos grandes
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

  // Test CORS connectivity
  async testCors() {
    try {
      const response = await this.api.options('/api/health')
      return { success: true, data: response }
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        isCorsError: error.code === 'NETWORK_ERROR' || error.message.includes('CORS')
      }
    }
  }
}

export default ApiService