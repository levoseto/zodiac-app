import axios from 'axios'

class ApiService {
  constructor(baseURL) {
    this.api = axios.create({
      baseURL: baseURL,
      timeout: 600000, // 10 minutos para uploads grandes (tu API permite todo)
      withCredentials: false, // Compatible con tu origin: '*'
      headers: {
        'Accept': 'application/json'
        // Removemos Content-Type por defecto para mayor flexibilidad
      }
    })

    // Request interceptor simplificado
    this.api.interceptors.request.use(
      (config) => {
        console.log(`🌐 ${config.method?.toUpperCase()} ${config.url}`)
        
        // Para FormData, el navegador establecerá Content-Type automáticamente
        if (config.data instanceof FormData) {
          // No establecer Content-Type para que el navegador agregue boundary
          delete config.headers['Content-Type']
          console.log('📤 FormData upload detected, removing Content-Type header')
        } else if (!config.headers['Content-Type']) {
          // Solo para requests JSON
          config.headers['Content-Type'] = 'application/json'
        }
        
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor simplificado
    this.api.interceptors.response.use(
      (response) => {
        console.log(`✅ ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`)
        return response.data
      },
      (error) => {
        const status = error.response?.status
        const url = error.config?.url
        console.error(`❌ ${status || 'NETWORK'} ${error.config?.method?.toUpperCase()} ${url}`)
        console.error('Error details:', error.response?.data || error.message)
        
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

  // Upload APK - Optimizado para tu CORS permisivo
  async uploadApk(uploadData, onUploadProgress) {
    const formData = new FormData()
    formData.append('apk', uploadData.file)
    formData.append('version', uploadData.version)
    formData.append('releaseNotes', uploadData.releaseNotes || '')
    formData.append('minAndroidVersion', uploadData.minAndroidVersion || '5.0')
    formData.append('targetSdkVersion', uploadData.targetSdkVersion || '33')

    console.log(`🚀 Iniciando upload de APK v${uploadData.version} (${(uploadData.file.size / 1024 / 1024).toFixed(2)}MB)`)

    const config = {
      timeout: 600000, // 10 minutos
      onUploadProgress: (progressEvent) => {
        if (progressEvent.lengthComputable) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onUploadProgress?.(progress)
        }
      },
      // Sin restricciones de content length ya que tu API permite todo
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