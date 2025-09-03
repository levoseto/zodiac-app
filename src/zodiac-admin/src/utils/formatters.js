/**
 * Utilidades de formateo para la aplicación
 */

/**
 * Formatear tamaño de archivo en bytes a una unidad legible
 */
export function formatFileSize(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * Formatear fecha a formato legible en español
 */
export function formatDate(date, options = {}) {
  if (!date) return '-'
  
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }
  
  const formatOptions = { ...defaultOptions, ...options }
  
  return new Date(date).toLocaleString('es-ES', formatOptions)
}

/**
 * Formatear fecha relativa (hace X tiempo)
 */
export function formatRelativeTime(date) {
  if (!date) return '-'
  
  const now = new Date()
  const then = new Date(date)
  const diffInSeconds = Math.floor((now - then) / 1000)
  
  const intervals = {
    año: 31536000,
    mes: 2592000,
    semana: 604800,
    día: 86400,
    hora: 3600,
    minuto: 60
  }
  
  for (let [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds)
    if (interval >= 1) {
      return `hace ${interval} ${unit}${interval > 1 && unit !== 'mes' ? 's' : interval > 1 && unit === 'mes' ? 'es' : ''}`
    }
  }
  
  return 'hace un momento'
}

/**
 * Formatear versión para mostrar con prefijo
 */
export function formatVersion(version, prefix = 'v') {
  if (!version) return '-'
  return `${prefix}${version}`
}

/**
 * Formatear porcentaje
 */
export function formatPercentage(value, decimals = 1) {
  if (value === null || value === undefined) return '-'
  return `${parseFloat(value).toFixed(decimals)}%`
}

/**
 * Formatear número con separadores de miles
 */
export function formatNumber(number, locale = 'es-ES') {
  if (number === null || number === undefined) return '-'
  return new Intl.NumberFormat(locale).format(number)
}

/**
 * Formatear duración en segundos a formato legible
 */
export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0s'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  
  let result = ''
  if (hours > 0) result += `${hours}h `
  if (minutes > 0) result += `${minutes}m `
  if (remainingSeconds > 0 || result === '') result += `${remainingSeconds}s`
  
  return result.trim()
}

/**
 * Truncar texto con ellipsis
 */
export function truncateText(text, maxLength = 100) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

/**
 * Capitalizar primera letra
 */
export function capitalize(text) {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Formatear velocidad de transferencia
 */
export function formatTransferRate(bytesPerSecond) {
  if (!bytesPerSecond || bytesPerSecond <= 0) return '-'
  
  const formattedSize = formatFileSize(bytesPerSecond)
  return `${formattedSize}/s`
}

/**
 * Validar y formatear versión semver
 */
export function validateAndFormatVersion(version) {
  if (!version) return { isValid: false, formatted: '' }
  
  // Regex simplificado para semver (compatible con todos los navegadores)
  const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/
  const match = version.match(semverRegex)
  
  if (!match) {
    return { isValid: false, formatted: version }
  }
  
  const [, major, minor, patch, prerelease, build] = match
  let formatted = `${major}.${minor}.${patch}`
  
  if (prerelease) formatted += `-${prerelease}`
  if (build) formatted += `+${build}`
  
  return { isValid: true, formatted }
}

/**
 * Comparar versiones semver (simple)
 */
export function compareVersions(version1, version2) {
  const v1Parts = version1.split('.').map(Number)
  const v2Parts = version2.split('.').map(Number)
  
  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0
    const v2Part = v2Parts[i] || 0
    
    if (v1Part > v2Part) return 1
    if (v1Part < v2Part) return -1
  }
  
  return 0
}

/**
 * Formatear tiempo estimado restante
 */
export function formatTimeRemaining(seconds) {
  if (!seconds || seconds <= 0) return 'Calculando...'
  
  if (seconds < 60) {
    return `${Math.round(seconds)} segundos`
  } else if (seconds < 3600) {
    const minutes = Math.round(seconds / 60)
    return `${minutes} minuto${minutes !== 1 ? 's' : ''}`
  } else {
    const hours = Math.round(seconds / 3600)
    return `${hours} hora${hours !== 1 ? 's' : ''}`
  }
}

/**
 * Obtener clase CSS para el estado
 */
export function getStatusClass(status) {
  const statusClasses = {
    success: 'alert-success',
    error: 'alert-error',
    warning: 'alert-warning',
    info: 'alert-info'
  }
  
  return statusClasses[status] || 'alert-info'
}

/**
 * Formatear configuración de Android
 */
export function formatAndroidVersion(version) {
  const androidVersions = {
    '4.0': 'Ice Cream Sandwich',
    '4.1': 'Jelly Bean',
    '4.4': 'KitKat', 
    '5.0': 'Lollipop',
    '6.0': 'Marshmallow',
    '7.0': 'Nougat',
    '8.0': 'Oreo',
    '9.0': 'Pie',
    '10': 'Android 10',
    '11': 'Android 11',
    '12': 'Android 12',
    '13': 'Android 13',
    '14': 'Android 14'
  }
  
  const versionName = androidVersions[version]
  return versionName ? `${version} (${versionName})` : version
}

export default {
  formatFileSize,
  formatDate,
  formatRelativeTime,
  formatVersion,
  formatPercentage,
  formatNumber,
  formatDuration,
  truncateText,
  capitalize,
  formatTransferRate,
  validateAndFormatVersion,
  compareVersions,
  formatTimeRemaining,
  getStatusClass,
  formatAndroidVersion
}