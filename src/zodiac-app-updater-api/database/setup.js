const mongoose = require('mongoose');

// Esquema extendido con índices y validaciones adicionales
const AppVersionSchema = new mongoose.Schema({
  version: {
    type: String,
    required: [true, 'La versión es requerida'],
    unique: true,
    validate: {
      validator: function(v) {
        return /^\d+\.\d+\.\d+$/.test(v);
      },
      message: 'Versión inválida. Usa formato semver (ej: 1.0.0)'
    },
    index: true
  },
  releaseNotes: {
    type: String,
    maxlength: [2000, 'Las notas de versión no pueden exceder 2000 caracteres'],
    default: ''
  },
  apkFileName: {
    type: String,
    required: [true, 'El nombre del archivo APK es requerido']
  },
  apkPath: {
    type: String,
    required: [true, 'La ruta del archivo APK es requerida']
  },
  fileSize: {
    type: Number,
    required: [true, 'El tamaño del archivo es requerido'],
    min: [1, 'El tamaño del archivo debe ser mayor a 0']
  },
  uploadDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  minAndroidVersion: {
    type: String,
    default: '5.0',
    validate: {
      validator: function(v) {
        return /^\d+\.\d+$/.test(v);
      },
      message: 'Versión de Android inválida'
    }
  },
  targetSdkVersion: {
    type: Number,
    default: 33,
    min: [21, 'El SDK mínimo es 21'],
    max: [34, 'El SDK máximo soportado es 34']
  },
  // Estadísticas de descarga
  downloadCount: {
    type: Number,
    default: 0,
    min: 0
  },
  // Metadatos adicionales
  metadata: {
    buildNumber: String,
    gitCommit: String,
    buildDate: Date,
    buildEnvironment: {
      type: String,
      enum: ['development', 'staging', 'production'],
      default: 'production'
    }
  },
  // Información de compatibilidad
  compatibility: {
    minRam: {
      type: Number,
      default: 2, // GB
      min: 1
    },
    minStorage: {
      type: Number,
      default: 100, // MB
      min: 50
    },
    supportedArchitectures: [{
      type: String,
      enum: ['arm64-v8a', 'armeabi-v7a', 'x86', 'x86_64']
    }],
    requiredPermissions: [String]
  }
}, {
  timestamps: true,
  // Configuración de índices compuestos
  indexes: [
    { version: -1, uploadDate: -1 },
    { isActive: 1, version: -1 },
    { uploadDate: -1 }
  ]
});

// Middleware pre-save para validaciones adicionales
AppVersionSchema.pre('save', function(next) {
  // Generar nombre de archivo si no existe
  if (!this.apkFileName) {
    this.apkFileName = `zodiac-app-v${this.version}.apk`;
  }
  
  // Generar ruta si no existe
  if (!this.apkPath && this.version) {
    this.apkPath = `uploads/apks/${this.version}/${this.apkFileName}`;
  }

  // Validar que la versión sea mayor a las existentes (opcional)
  next();
});

// Métodos de instancia
AppVersionSchema.methods.incrementDownload = function() {
  this.downloadCount += 1;
  return this.save();
};

AppVersionSchema.methods.isNewerThan = function(otherVersion) {
  const semver = require('semver');
  return semver.gt(this.version, otherVersion);
};

// Métodos estáticos
AppVersionSchema.statics.findLatest = function() {
  return this.findOne({ isActive: true })
    .sort({ version: -1, uploadDate: -1 })
    .exec();
};

AppVersionSchema.statics.findByVersionRange = function(minVersion, maxVersion) {
  const semver = require('semver');
  return this.find({ isActive: true })
    .then(versions => versions.filter(v => 
      semver.gte(v.version, minVersion) && semver.lte(v.version, maxVersion)
    ));
};

const AppVersion = mongoose.model('AppVersion', AppVersionSchema);

// Script para datos de ejemplo
async function seedDatabase() {
  try {
    // Verificar si ya existen datos
    const count = await AppVersion.countDocuments();
    if (count > 0) {
      console.log('La base de datos ya contiene datos. Omitiendo seed.');
      return;
    }

    // Crear versiones de ejemplo
    const sampleVersions = [
      {
        version: '1.0.0',
        releaseNotes: 'Versión inicial de Zodiac App. Incluye cálculo básico de signos zodiacales.',
        apkFileName: 'zodiac-app-v1.0.0.apk',
        apkPath: 'uploads/apks/1.0.0/zodiac-app-v1.0.0.apk',
        fileSize: 15728640, // 15 MB
        minAndroidVersion: '5.0',
        targetSdkVersion: 30,
        metadata: {
          buildNumber: '100',
          buildEnvironment: 'production'
        },
        compatibility: {
          minRam: 2,
          minStorage: 50,
          supportedArchitectures: ['arm64-v8a', 'armeabi-v7a'],
          requiredPermissions: ['android.permission.INTERNET']
        }
      },
      {
        version: '1.1.0',
        releaseNotes: 'Agregada funcionalidad de compatibilidad amorosa y mejoras en la interfaz.',
        apkFileName: 'zodiac-app-v1.1.0.apk',
        apkPath: 'uploads/apks/1.1.0/zodiac-app-v1.1.0.apk',
        fileSize: 18874368, // 18 MB
        minAndroidVersion: '5.0',
        targetSdkVersion: 32,
        metadata: {
          buildNumber: '110',
          buildEnvironment: 'production'
        },
        compatibility: {
          minRam: 2,
          minStorage: 75,
          supportedArchitectures: ['arm64-v8a', 'armeabi-v7a', 'x86_64'],
          requiredPermissions: ['android.permission.INTERNET', 'android.permission.VIBRATE']
        }
      },
      {
        version: '1.2.0',
        releaseNotes: 'Sistema de actualizaciones automáticas, horóscopo diario y notificaciones push.',
        apkFileName: 'zodiac-app-v1.2.0.apk',
        apkPath: 'uploads/apks/1.2.0/zodiac-app-v1.2.0.apk',
        fileSize: 22020096, // 21 MB
        minAndroidVersion: '6.0',
        targetSdkVersion: 33,
        downloadCount: 0,
        metadata: {
          buildNumber: '120',
          buildEnvironment: 'production'
        },
        compatibility: {
          minRam: 3,
          minStorage: 100,
          supportedArchitectures: ['arm64-v8a', 'armeabi-v7a', 'x86_64'],
          requiredPermissions: [
            'android.permission.INTERNET',
            'android.permission.VIBRATE',
            'android.permission.WAKE_LOCK',
            'android.permission.RECEIVE_BOOT_COMPLETED'
          ]
        }
      }
    ];

    // Insertar datos de ejemplo
    await AppVersion.insertMany(sampleVersions);
    console.log('✅ Base de datos inicializada con datos de ejemplo');

  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
  }
}

// Función para configurar índices
async function setupIndexes() {
  try {
    await AppVersion.createIndexes();
    console.log('✅ Índices creados correctamente');
  } catch (error) {
    console.error('❌ Error creando índices:', error);
  }
}

// Función para limpiar versiones antiguas (mantenimiento)
async function cleanupOldVersions(keepCount = 10) {
  try {
    const totalVersions = await AppVersion.countDocuments({ isActive: true });
    
    if (totalVersions <= keepCount) {
      console.log(`Solo hay ${totalVersions} versiones, no se requiere limpieza.`);
      return;
    }

    const versionsToKeep = await AppVersion
      .find({ isActive: true })
      .sort({ version: -1, uploadDate: -1 })
      .limit(keepCount)
      .select('_id');

    const keepIds = versionsToKeep.map(v => v._id);
    
    const result = await AppVersion.updateMany(
      { isActive: true, _id: { $nin: keepIds } },
      { $set: { isActive: false } }
    );

    console.log(`✅ Limpieza completada: ${result.modifiedCount} versiones antiguas desactivadas`);
  } catch (error) {
    console.error('❌ Error en limpieza:', error);
  }
}

// Función para obtener estadísticas
async function getStats() {
  try {
    const stats = await AppVersion.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: null,
          totalVersions: { $sum: 1 },
          totalDownloads: { $sum: '$downloadCount' },
          totalSize: { $sum: '$fileSize' },
          avgFileSize: { $avg: '$fileSize' },
          latestVersion: { $max: '$version' },
          oldestVersion: { $min: '$version' },
          latestUpload: { $max: '$uploadDate' }
        }
      }
    ]);

    return stats[0] || {
      totalVersions: 0,
      totalDownloads: 0,
      totalSize: 0,
      avgFileSize: 0,
      latestVersion: null,
      oldestVersion: null,
      latestUpload: null
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return null;
  }
}

module.exports = {
  AppVersion,
  seedDatabase,
  setupIndexes,
  cleanupOldVersions,
  getStats
};