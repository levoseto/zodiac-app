const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const semver = require('semver');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// AWS SDK v3 - Importaciones modulares
const { S3Client, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand, HeadBucketCommand } = require('@aws-sdk/client-s3');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar AWS S3 Client (v3)
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const S3_BUCKET = process.env.S3_BUCKET_NAME || 'zodiac-app-apks';

// Middleware de seguridad y optimización
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de 100 requests por ventana de tiempo
});
app.use('/api/', limiter);

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://anubis:pinotepa1A@levocluster0.pdrulcd.mongodb.net/zodiac-updater?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schema para versiones de la app
const AppVersionSchema = new mongoose.Schema({
  version: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return semver.valid(v);
      },
      message: 'Versión inválida. Usa formato semver (ej: 1.0.0)'
    }
  },
  releaseNotes: {
    type: String,
    default: ''
  },
  apkFileName: {
    type: String,
    required: true
  },
  apkPath: {
    type: String,
    required: true
  },
  s3Key: {
    type: String,
    required: true
  },
  s3Bucket: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  minAndroidVersion: {
    type: String,
    default: '5.0'
  },
  targetSdkVersion: {
    type: Number,
    default: 33
  }
}, {
  timestamps: true
});

const AppVersion = mongoose.model('AppVersion', AppVersionSchema);

// Configurar multer para memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 200 * 1024 * 1024 // 200MB límite - suficiente para tus APKs grandes
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.android.package-archive' || 
        file.originalname.endsWith('.apk')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos APK'), false);
    }
  }
});

// Función helper para generar URL pública de S3
const generateS3Url = (bucket, key) => {
  const region = process.env.AWS_REGION || 'us-east-1';
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
};

// ENDPOINTS DE LA API

// 1. Obtener la versión más reciente
app.get('/api/version/latest', async (req, res) => {
  try {
    const latestVersion = await AppVersion
      .findOne({ isActive: true })
      .sort({ version: -1, uploadDate: -1 })
      .exec();

    if (!latestVersion) {
      return res.status(404).json({
        success: false,
        message: 'No hay versiones disponibles'
      });
    }

    res.json({
      success: true,
      data: {
        version: latestVersion.version,
        releaseNotes: latestVersion.releaseNotes,
        fileSize: latestVersion.fileSize,
        fileSizeMB: (latestVersion.fileSize / 1024 / 1024).toFixed(2),
        uploadDate: latestVersion.uploadDate,
        minAndroidVersion: latestVersion.minAndroidVersion,
        targetSdkVersion: latestVersion.targetSdkVersion,
        downloadUrl: `/api/download/${latestVersion.version}`
      }
    });
  } catch (error) {
    console.error('Error obteniendo versión:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor',
      error: error.message
    });
  }
});

// 2. Comparar versión (para el cliente MAUI)
app.get('/api/version/compare/:currentVersion', async (req, res) => {
  try {
    const { currentVersion } = req.params;
    
    if (!semver.valid(currentVersion)) {
      return res.status(400).json({
        success: false,
        message: 'Versión actual inválida'
      });
    }

    const latestVersion = await AppVersion
      .findOne({ isActive: true })
      .sort({ version: -1, uploadDate: -1 })
      .exec();

    if (!latestVersion) {
      return res.json({
        success: true,
        hasUpdate: false,
        message: 'No hay versiones disponibles'
      });
    }

    const hasUpdate = semver.gt(latestVersion.version, currentVersion);

    res.json({
      success: true,
      hasUpdate: hasUpdate,
      currentVersion: currentVersion,
      latestVersion: latestVersion.version,
      releaseNotes: hasUpdate ? latestVersion.releaseNotes : null,
      downloadUrl: hasUpdate ? `/api/download/${latestVersion.version}` : null,
      fileSize: hasUpdate ? latestVersion.fileSize : null,
      fileSizeMB: hasUpdate ? (latestVersion.fileSize / 1024 / 1024).toFixed(2) : null
    });
  } catch (error) {
    console.error('Error comparando versión:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor',
      error: error.message
    });
  }
});

// 3. Subir nueva versión del APK con AWS S3 SDK v3
app.post('/api/upload', upload.single('apk'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó archivo APK'
      });
    }

    const { version, releaseNotes, minAndroidVersion, targetSdkVersion } = req.body;

    if (!version || !semver.valid(version)) {
      return res.status(400).json({
        success: false,
        message: 'Versión requerida y debe ser válida (formato semver)'
      });
    }

    // Verificar si la versión ya existe
    const existingVersion = await AppVersion.findOne({ version });
    if (existingVersion) {
      return res.status(409).json({
        success: false,
        message: 'La versión ya existe'
      });
    }

    const fileSizeMB = (req.file.size / 1024 / 1024).toFixed(2);
    console.log(`📤 Subiendo APK v${version} a S3... (Tamaño: ${fileSizeMB}MB)`);

    const s3Key = `apks/${version}/zodiac-app-v${version}.apk`;
    
    // Comando para subir archivo a S3 (SDK v3) - SIN ACL
    const putObjectCommand = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: req.file.buffer,
      ContentType: 'application/vnd.android.package-archive',
      ContentDisposition: `attachment; filename="zodiac-app-v${version}.apk"`,
      // ACL removido - usamos política del bucket en su lugar
      Metadata: {
        'version': version,
        'upload-date': new Date().toISOString(),
        'file-size': req.file.size.toString(),
        'original-name': req.file.originalname
      }
    });

    // Ejecutar comando de subida
    await s3Client.send(putObjectCommand);

    // Generar URL pública
    const s3Url = generateS3Url(S3_BUCKET, s3Key);

    console.log(`✅ APK subido exitosamente a S3: ${s3Url}`);

    const newVersion = new AppVersion({
      version,
      releaseNotes: releaseNotes || '',
      apkFileName: `zodiac-app-v${version}.apk`,
      apkPath: s3Url,
      s3Key: s3Key,
      s3Bucket: S3_BUCKET,
      fileSize: req.file.size,
      minAndroidVersion: minAndroidVersion || '5.0',
      targetSdkVersion: parseInt(targetSdkVersion) || 33
    });

    await newVersion.save();

    res.status(201).json({
      success: true,
      message: 'Versión subida exitosamente a AWS S3',
      data: {
        version: newVersion.version,
        fileSize: newVersion.fileSize,
        fileSizeMB: fileSizeMB,
        uploadDate: newVersion.uploadDate,
        downloadUrl: `/api/download/${version}`,
        s3Url: s3Url,
        s3Key: s3Key
      }
    });
  } catch (error) {
    console.error('Error subiendo versión:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor',
      error: error.message
    });
  }
});

// 4. Descargar APK por versión
app.get('/api/download/:version', async (req, res) => {
  try {
    const { version } = req.params;
    
    const appVersion = await AppVersion.findOne({ version, isActive: true });
    
    if (!appVersion) {
      return res.status(404).json({
        success: false,
        message: 'Versión no encontrada'
      });
    }

    console.log(`📥 Descargando APK v${version} desde S3`);

    // Verificar que el archivo existe en S3 usando SDK v3
    try {
      const headObjectCommand = new HeadObjectCommand({
        Bucket: appVersion.s3Bucket,
        Key: appVersion.s3Key
      });
      await s3Client.send(headObjectCommand);
    } catch (error) {
      console.error('Archivo no encontrado en S3:', error.message);
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado en S3'
      });
    }

    // Redirigir a la URL directa de S3
    res.redirect(appVersion.apkPath);
  } catch (error) {
    console.error('Error descargando APK:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor',
      error: error.message
    });
  }
});

// 5. Listar todas las versiones
app.get('/api/versions', async (req, res) => {
  try {
    const versions = await AppVersion
      .find({ isActive: true })
      .sort({ version: -1, uploadDate: -1 })
      .select('-apkPath -s3Key -s3Bucket')
      .exec();

    res.json({
      success: true,
      count: versions.length,
      totalSizeMB: versions.reduce((sum, v) => sum + (v.fileSize / 1024 / 1024), 0).toFixed(2),
      data: versions.map(v => ({
        version: v.version,
        releaseNotes: v.releaseNotes,
        fileSize: v.fileSize,
        fileSizeMB: (v.fileSize / 1024 / 1024).toFixed(2),
        uploadDate: v.uploadDate,
        minAndroidVersion: v.minAndroidVersion,
        targetSdkVersion: v.targetSdkVersion,
        downloadUrl: `/api/download/${v.version}`
      }))
    });
  } catch (error) {
    console.error('Error listando versiones:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor',
      error: error.message
    });
  }
});

// 6. Eliminar versión (soft delete + eliminar de S3)
app.delete('/api/version/:version', async (req, res) => {
  try {
    const { version } = req.params;
    
    const appVersion = await AppVersion.findOne({ version });
    if (!appVersion) {
      return res.status(404).json({
        success: false,
        message: 'Versión no encontrada'
      });
    }

    // Eliminar de S3 usando SDK v3
    try {
      const deleteObjectCommand = new DeleteObjectCommand({
        Bucket: appVersion.s3Bucket,
        Key: appVersion.s3Key
      });
      await s3Client.send(deleteObjectCommand);
      console.log(`🗑️ APK v${version} eliminado de S3`);
    } catch (s3Error) {
      console.warn('Error eliminando de S3:', s3Error.message);
      // Continuar aunque falle la eliminación de S3
    }

    // Soft delete en la base de datos
    appVersion.isActive = false;
    await appVersion.save();

    res.json({
      success: true,
      message: 'Versión desactivada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando versión:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor',
      error: error.message
    });
  }
});

// 7. Endpoint para verificar configuración de S3
app.get('/api/s3/status', async (req, res) => {
  try {
    // Verificar configuración básica
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Configuración de AWS S3 incompleta',
        missing: {
          accessKeyId: !process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: !process.env.AWS_SECRET_ACCESS_KEY,
          region: !process.env.AWS_REGION,
          bucket: !process.env.S3_BUCKET_NAME
        }
      });
    }

    // Verificar que el bucket existe usando SDK v3
    const headBucketCommand = new HeadBucketCommand({ Bucket: S3_BUCKET });
    await s3Client.send(headBucketCommand);
    
    res.json({
      success: true,
      message: 'AWS S3 configurado correctamente',
      config: {
        bucket: S3_BUCKET,
        region: process.env.AWS_REGION || 'us-east-1',
        sdkVersion: 'v3 (Moderna)',
        maxFileSize: '200MB'
      }
    });
  } catch (error) {
    console.error('Error verificando S3:', error);
    res.status(500).json({
      success: false,
      message: 'Error conectando con AWS S3',
      error: error.message,
      bucket: S3_BUCKET,
      suggestion: error.code === 'NoSuchBucket' ? 
        'El bucket no existe. Créalo en AWS Console.' : 
        'Verifica las credenciales y permisos.'
    });
  }
});

// 8. Endpoint para obtener estadísticas de uso
app.get('/api/stats', async (req, res) => {
  try {
    const versions = await AppVersion.find({ isActive: true });
    
    const totalFiles = versions.length;
    const totalSize = versions.reduce((sum, v) => sum + v.fileSize, 0);
    const averageSize = totalFiles > 0 ? totalSize / totalFiles : 0;
    
    // Límites del plan gratuito de AWS
    const FREE_TIER_LIMIT = 5 * 1024 * 1024 * 1024; // 5GB
    const usagePercentage = (totalSize / FREE_TIER_LIMIT * 100).toFixed(2);

    res.json({
      success: true,
      stats: {
        totalVersions: totalFiles,
        totalSizeBytes: totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
        totalSizeGB: (totalSize / 1024 / 1024 / 1024).toFixed(3),
        averageSizeMB: (averageSize / 1024 / 1024).toFixed(2),
        freeTeir: {
          limitGB: '5.0',
          usedPercentage: Math.min(parseFloat(usagePercentage), 100),
          remainingGB: Math.max(5 - (totalSize / 1024 / 1024 / 1024), 0).toFixed(3)
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor',
      error: error.message
    });
  }
});

// Endpoint de health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    storage: 'AWS S3',
    sdkVersion: 'v3',
    bucket: S3_BUCKET,
    maxUpload: '200MB'
  });
});

// Manejo de errores global
app.use((error, req, res, next) => {
  console.error('Error global:', error);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: error.message
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`📱 API de Zodiac App Updater lista!`);
  console.log(`☁️ AWS S3 SDK v3 configurado: ${!!process.env.AWS_ACCESS_KEY_ID}`);
  console.log(`🪣 Bucket S3: ${S3_BUCKET}`);
  console.log(`📦 Límite de archivo: 200MB`);
});

module.exports = app;