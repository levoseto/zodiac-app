# 🌟 Zodiac App Updater API

API REST para gestionar actualizaciones automáticas de la aplicación Zodiac App desarrollada en .NET MAUI.

## 🚀 Características

- ✅ Gestión completa de versiones de APK
- ✅ Comparación automática de versiones con semver
- ✅ Descarga de APKs por versión específica
- ✅ Panel web de administración
- ✅ Organización automática por carpetas de versión
- ✅ Conexión con MongoDB Atlas
- ✅ Despliegue ready para Vercel
- ✅ Rate limiting y seguridad incorporada

## 📋 Prerrequisitos

- Node.js 18.x o superior
- MongoDB Atlas (cuenta gratuita)
- Cuenta de Vercel (opcional para despliegue)

## 🛠️ Instalación Local

1. **Clonar y configurar**
```bash
npm install
cp .env.example .env
```

2. **Configurar variables de entorno**
Edita el archivo `.env` con tus credenciales de MongoDB Atlas:
```
MONGODB_URI=mongodb+srv://tu_usuario:tu_password@cluster0.mongodb.net/zodiac-updater
```

3. **Ejecutar en desarrollo**
```bash
npm run dev
```

4. **Acceder al panel**
- API: http://localhost:3000/api
- Panel Admin: http://localhost:3000

## 🌐 Despliegue en Vercel

1. **Conectar repositorio**
   - Fork este repositorio
   - Conecta tu GitHub con Vercel
   - Importa el proyecto

2. **Configurar variables de entorno en Vercel**
   - Ve a Settings → Environment Variables
   - Agrega: `MONGODB_URI` con tu string de conexión

3. **Deploy automático**
   - Vercel desplegará automáticamente en cada push

## 📚 Endpoints de la API

### Obtener última versión disponible
```http
GET /api/version/latest
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "data": {
    "version": "1.2.3",
    "releaseNotes": "Nuevas funcionalidades...",
    "fileSize": 25485760,
    "uploadDate": "2025-08-25T10:30:00Z",
    "minAndroidVersion": "5.0",
    "targetSdkVersion": 33,
    "downloadUrl": "/api/download/1.2.3"
  }
}
```

### Comparar versión actual
```http
GET /api/version/compare/{version_actual}
```

**Ejemplo:** `GET /api/version/compare/1.0.0`

**Respuesta:**
```json
{
  "success": true,
  "hasUpdate": true,
  "currentVersion": "1.0.0",
  "latestVersion": "1.2.3",
  "releaseNotes": "Nuevas funcionalidades...",
  "downloadUrl": "/api/download/1.2.3",
  "fileSize": 25485760
}
```

### Descargar APK
```http
GET /api/download/{version}
```

**Ejemplo:** `GET /api/download/1.2.3`
- Descarga directa del archivo APK

### Listar todas las versiones
```http
GET /api/versions
```

### Subir nueva versión
```http
POST /api/upload
Content-Type: multipart/form-data

Form data:
- apk: archivo APK
- version: "1.2.3" (formato semver)
- releaseNotes: "Descripción de cambios"
- minAndroidVersion: "5.0"
- targetSdkVersion: 33
```

### Eliminar versión (soft delete)
```http
DELETE /api/version/{version}
```

## 📱 Uso desde la App MAUI

### 1. Verificar actualizaciones
```csharp
var client = new HttpClient();
var response = await client.GetStringAsync("https://tu-api.vercel.app/api/version/compare/1.0.0");
var updateInfo = JsonSerializer.Deserialize<UpdateResponse>(response);

if (updateInfo.hasUpdate) {
    // Mostrar diálogo de actualización
}
```

### 2. Descargar APK
```csharp
var downloadUrl = "https://tu-api.vercel.app" + updateInfo.downloadUrl;
var apkBytes = await client.GetByteArrayAsync(downloadUrl);

// Guardar en almacenamiento local
var fileName = Path.Combine(FileSystem.CacheDirectory, "update.apk");
await File.WriteAllBytesAsync(fileName, apkBytes);
```

### 3. Instalar actualización (Android)
```csharp
// Implementación específica para instalar APK en Android
var intent = new Android.Content.Intent(Android.Content.Intent.ActionView);
intent.SetDataAndType(Android.Net.Uri.FromFile(new Java.IO.File(fileName)), 
                      "application/vnd.android.package-archive");
intent.SetFlags(Android.Content.ActivityFlags.NewTask);
Android.App.Application.Context.StartActivity(intent);
```

## 🗂️ Estructura de Archivos

```
/
├── index.js              # API principal
├── package.json          # Dependencias
├── vercel.json           # Configuración Vercel
├── .env.example          # Variables de entorno
├── public/
│   └── index.html        # Panel de administración
└── uploads/
    └── apks/
        └── 1.2.3/        # APKs organizados por versión
            └── zodiac-app-v1.2.3.apk
```

## 🔒 Seguridad

- Rate limiting: 100 requests por 15 minutos
- Validación de archivos APK
- Sanitización de inputs
- CORS configurado
- Headers de seguridad con Helmet

## 🛠️ Desarrollo

### Comandos disponibles
```bash
npm run dev      # Desarrollo con nodemon
npm start        # Producción
npm run build    # Build para despliegue
```

### Estructura MongoDB

**Colección: `appversions`**
```javascript
{
  version: "1.2.3",           // Versión semver
  releaseNotes: "...",        // Notas de la versión
  apkFileName: "zodiac-app-v1.2.3.apk",
  apkPath: "/uploads/apks/1.2.3/zodiac-app-v1.2.3.apk",
  fileSize: 25485760,         // Tamaño en bytes
  uploadDate: ISODate("..."), // Fecha de subida
  isActive: true,             // Estado activo/inactivo
  minAndroidVersion: "5.0",   // Versión mínima Android
  targetSdkVersion: 33,       // SDK target
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

## 🐛 Troubleshooting

### Error de conexión MongoDB
- Verifica que tu IP esté whitelisteada en MongoDB Atlas
- Confirma que las credenciales sean correctas
- Asegúrate de que el cluster esté activo

### Problemas con uploads en Vercel
- Los archivos se almacenan temporalmente en Vercel
- Para producción, considera usar AWS S3 o similar
- El límite de tamaño es 100MB por archivo

### APK no se descarga
- Verifica que el archivo exista en la ruta especificada
- Confirma los permisos de lectura
- Revisa los logs de Vercel para errores

## 📄 Licencia

MIT License - libre para uso personal y comercial.

## 👨‍💻 Soporte

Para soporte técnico:
1. Revisa la documentación completa
2. Verifica los logs en Vercel Dashboard
3. Confirma la configuración de MongoDB Atlas

---

**¡Tu API de Zodiac App Updater está lista! 🚀**