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

const app = express();
const PORT = process.env.PORT || 3000;

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

// SOLUCIÓN: Usar memoryStorage en lugar de diskStorage
const upload = multer({ 
  storage: multer.memoryStorage(), // Almacenar en memoria primero
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

// Middleware para servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// 3. ENDPOINT CORREGIDO: Subir nueva versión del APK
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

    // NUEVO: Ahora creamos el directorio y archivo manualmente
    const uploadDir = path.join(__dirname, 'uploads', 'apks', version);
    const fileName = `zodiac-app-v${version}.apk`;
    const filePath = path.join(uploadDir, fileName);

    // Crear directorio si no existe
    fs.mkdirSync(uploadDir, { recursive: true });

    // Escribir el archivo desde el buffer de memoria
    fs.writeFileSync(filePath, req.file.buffer);

    const newVersion = new AppVersion({
      version,
      releaseNotes: releaseNotes || '',
      apkFileName: fileName,
      apkPath: filePath,
      fileSize: req.file.size, // Tamaño desde req.file
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
        uploadDate: newVersion.uploadDate
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

    const filePath = appVersion.apkPath;
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Archivo APK no encontrado en el servidor'
      });
    }

    // Configurar headers para descarga
    res.setHeader('Content-Disposition', `attachment; filename="${appVersion.apkFileName}"`);
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Length', appVersion.fileSize);

    // Enviar archivo
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
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
      .select('-apkPath')
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

// 6. Eliminar versión (soft delete)
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

// Endpoint de health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
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
});

module.exports = app;