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
    return await this.api.get('/api/health', { timeout: 5000 })
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

  // Upload APK
  async uploadApk(uploadData, onUploadProgress) {
    const formData = new FormData()
    formData.append('apk', uploadData.file)
    formData.append('version', uploadData.version)
    formData.append('releaseNotes', uploadData.releaseNotes || '')
    formData.append('minAndroidVersion', uploadData.minAndroidVersion || '5.0')
    formData.append('targetSdkVersion', uploadData.targetSdkVersion || '33')

    return await this.api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onUploadProgress?.(progress)
      }
    })
  }

  // Get download URL
  getDownloadUrl(version) {
    return `${this.api.defaults.baseURL}/api/download/${version}`
  }
}

export default ApiService