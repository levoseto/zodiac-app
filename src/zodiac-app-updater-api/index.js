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
const cloudinary = require('cloudinary').v2;

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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
  cloudinaryPublicId: {
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
    fileSize: 100 * 1024 * 1024 // 100MB límite
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
      fileSize: hasUpdate ? latestVersion.fileSize : null
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

// 3. Subir nueva versión del APK con Cloudinary
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

    console.log(`📤 Subiendo APK v${version} a Cloudinary...`);

    // Convertir buffer a base64 para Cloudinary
    const base64File = `data:application/vnd.android.package-archive;base64,${req.file.buffer.toString('base64')}`;
    
    const publicId = `zodiac-app/apks/zodiac-app-v${version}`;
    
    // Subir a Cloudinary
    const uploadResult = await cloudinary.uploader.upload(base64File, {
      resource_type: 'raw', // Para archivos que no son imágenes/videos
      public_id: publicId,
      access_mode: 'public',
      use_filename: true,
      unique_filename: false
    });

    console.log(`✅ APK subido exitosamente a Cloudinary: ${uploadResult.secure_url}`);

    const newVersion = new AppVersion({
      version,
      releaseNotes: releaseNotes || '',
      apkFileName: `zodiac-app-v${version}.apk`,
      apkPath: uploadResult.secure_url,
      cloudinaryPublicId: uploadResult.public_id,
      fileSize: req.file.size,
      minAndroidVersion: minAndroidVersion || '5.0',
      targetSdkVersion: parseInt(targetSdkVersion) || 33
    });

    await newVersion.save();

    res.status(201).json({
      success: true,
      message: 'Versión subida exitosamente',
      data: {
        version: newVersion.version,
        fileSize: newVersion.fileSize,
        uploadDate: newVersion.uploadDate,
        downloadUrl: `/api/download/${version}`,
        cloudinaryUrl: uploadResult.secure_url
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

    console.log(`📥 Descargando APK v${version} desde Cloudinary`);

    // Configurar headers para descarga y redirigir a Cloudinary
    res.setHeader('Content-Disposition', `attachment; filename="${appVersion.apkFileName}"`);
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
      .select('-apkPath -cloudinaryPublicId')
      .exec();

    res.json({
      success: true,
      count: versions.length,
      data: versions.map(v => ({
        version: v.version,
        releaseNotes: v.releaseNotes,
        fileSize: v.fileSize,
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

// 6. Eliminar versión (soft delete + eliminar de Cloudinary)
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

    // Eliminar de Cloudinary
    try {
      await cloudinary.uploader.destroy(appVersion.cloudinaryPublicId, {
        resource_type: 'raw'
      });
      console.log(`🗑️ APK v${version} eliminado de Cloudinary`);
    } catch (cloudinaryError) {
      console.warn('Error eliminando de Cloudinary:', cloudinaryError.message);
      // Continuar aunque falle la eliminación de Cloudinary
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

// 7. Endpoint para verificar configuración de Cloudinary
app.get('/api/cloudinary/status', async (req, res) => {
  try {
    // Verificar configuración
    const config = cloudinary.config();
    
    if (!config.cloud_name || !config.api_key || !config.api_secret) {
      return res.status(500).json({
        success: false,
        message: 'Configuración de Cloudinary incompleta',
        config: {
          cloud_name: !!config.cloud_name,
          api_key: !!config.api_key,
          api_secret: !!config.api_secret
        }
      });
    }

    // Hacer una prueba simple a la API
    const result = await cloudinary.api.ping();
    
    res.json({
      success: true,
      message: 'Cloudinary configurado correctamente',
      cloudName: config.cloud_name,
      status: result.status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error conectando con Cloudinary',
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
    cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME
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
  console.log(`☁️ Cloudinary configurado: ${!!process.env.CLOUDINARY_CLOUD_NAME}`);
});

module.exports = app;