/**
 * Format date to localized string
 * @param {Date|string} dateString 
 * @returns {string}
 */
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format file size to human readable string
 * @param {number} bytes 
 * @returns {string}
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Validate semver format
 * @param {string} version 
 * @returns {boolean}
 */
export const isValidSemver = (version) => {
  const semverRegex = /^\d+\.\d+\.\d+$/
  return semverRegex.test(version)
}