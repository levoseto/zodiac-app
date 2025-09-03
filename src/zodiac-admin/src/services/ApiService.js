import axios from 'axios'

class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
    
    // Configurar instancia de axios
    this.axios = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 segundos para uploads grandes
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Interceptores para manejo de respuestas
    this.axios.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Error en API:', error.response?.data || error.message)
        return Promise.reject(error)
      }
    )
  }

  // ==================== VERSIONES ====================

  /**
   * Obtener la versión más reciente
   */
  async getLatestVersion() {
    const response = await this.axios.get('/version/latest')
    return response.data
  }

  /**
   * Comparar versión actual con la más reciente
   */
  async compareVersion(currentVersion) {
    const response = await this.axios.get(`/version/compare/${currentVersion}`)
    return response.data
  }

  /**
   * Obtener todas las versiones
   */
  async getAllVersions() {
    const response = await this.axios.get('/versions')
    return response.data
  }

  /**
   * Eliminar una versión específica
   */
  async deleteVersion(version) {
    const response = await this.axios.delete(`/version/${version}`)
    return response.data
  }

  // ==================== UPLOAD TRADICIONAL ====================

  /**
   * Subir APK usando método tradicional (para archivos pequeños)
   */
  async uploadApk(formData, onProgress = null) {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }

    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(percentCompleted)
      }
    }

    const response = await this.axios.post('/upload', formData, config)
    return response.data
  }

  // ==================== UPLOAD DIRECTO A S3 ====================

  /**
   * Generar URL pre-firmada para upload directo a S3
   */
  async generatePresignedUrl(version, fileSize, fileName) {
    const response = await this.axios.post('/upload/presigned', {
      version,
      fileSize,
      fileName
    })
    return response.data
  }

  /**
   * Subir archivo directamente a S3 usando URL pre-firmada
   */
  async uploadToS3(presignedUrl, file, onProgress = null) {
    const config = {
      headers: {
        'Content-Type': 'application/vnd.android.package-archive'
      }
    }

    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(percentCompleted)
      }
    }

    // Usar axios para subir directamente a S3
    const response = await axios.put(presignedUrl, file, config)
    return response
  }

  /**
   * Confirmar que el upload a S3 fue exitoso
   */
  async confirmUpload(uploadData) {
    const response = await this.axios.post('/upload/confirm', uploadData)
    return response.data
  }

  /**
   * Proceso completo de upload directo a S3
   */
  async uploadApkToS3(file, version, releaseNotes = '', minAndroidVersion = '5.0', targetSdkVersion = 33, onProgress = null) {
    try {
      // Paso 1: Generar URL pre-firmada
      const presignedData = await this.generatePresignedUrl(
        version, 
        file.size, 
        file.name
      )

      // Paso 2: Subir archivo a S3
      await this.uploadToS3(presignedData.data.presignedUrl, file, onProgress)

      // Paso 3: Confirmar el upload
      const confirmData = await this.confirmUpload({
        version,
        s3Key: presignedData.data.s3Key,
        s3Bucket: presignedData.data.s3Bucket,
        fileSize: file.size,
        fileName: file.name,
        releaseNotes,
        minAndroidVersion,
        targetSdkVersion
      })

      return confirmData
    } catch (error) {
      console.error('Error en upload a S3:', error)
      throw error
    }
  }

  // ==================== DESCARGAS ====================

  /**
   * Obtener URL de descarga para una versión específica
   */
  getDownloadUrl(version) {
    return `${this.baseURL}/download/${version}`
  }

  /**
   * Descargar APK (redirige al endpoint de descarga)
   */
  async downloadApk(version) {
    const url = this.getDownloadUrl(version)
    window.open(url, '_blank')
  }

  // ==================== ESTADÍSTICAS Y ESTADO ====================

  /**
   * Obtener estadísticas de uso
   */
  async getStats() {
    const response = await this.axios.get('/stats')
    return response.data
  }

  /**
   * Verificar estado de la API
   */
  async getHealthStatus() {
    const response = await this.axios.get('/health')
    return response.data
  }

  /**
   * Verificar estado de S3
   */
  async getS3Status() {
    const response = await this.axios.get('/s3/status')
    return response.data
  }

  // ==================== UTILIDADES ====================

  /**
   * Determinar si usar upload tradicional o directo a S3
   * Basado en el tamaño del archivo
   */
  shouldUseDirectS3Upload(fileSize) {
    const TRADITIONAL_LIMIT = 50 * 1024 * 1024 // 50MB
    return fileSize > TRADITIONAL_LIMIT
  }

  /**
   * Upload inteligente que selecciona automáticamente el método
   */
  async smartUpload(file, version, releaseNotes = '', minAndroidVersion = '5.0', targetSdkVersion = 33, onProgress = null) {
    if (this.shouldUseDirectS3Upload(file.size)) {
      console.log(`📤 Archivo grande (${(file.size / 1024 / 1024).toFixed(2)}MB) - usando upload directo a S3`)
      return await this.uploadApkToS3(file, version, releaseNotes, minAndroidVersion, targetSdkVersion, onProgress)
    } else {
      console.log(`📤 Archivo pequeño (${(file.size / 1024 / 1024).toFixed(2)}MB) - usando upload tradicional`)
      const formData = new FormData()
      formData.append('apk', file)
      formData.append('version', version)
      formData.append('releaseNotes', releaseNotes)
      formData.append('minAndroidVersion', minAndroidVersion)
      formData.append('targetSdkVersion', targetSdkVersion)
      
      return await this.uploadApk(formData, onProgress)
    }
  }

  /**
   * Validar versión semver
   */
  isValidVersion(version) {
    // Regex simplificado para semver (MAJOR.MINOR.PATCH con prerelease y build opcionales)
    const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/
    return semverRegex.test(version)
  }

  /**
   * Formatear tamaño de archivo
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Formatear fecha
   */
  formatDate(date) {
    return new Date(date).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

export default new ApiService()